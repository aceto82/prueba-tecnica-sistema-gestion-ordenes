# Fase 5 — Technical Design

> Closes Fase 4 tech debt + migrates Angular templates to built-in control flow (@if/@for).
> No new functionality. No domain model changes. Quality + best-practice phase.

---

## 1. Architecture Overview

Three concerns, two layers, one phase:

| Concern | Layer | Scope |
|---------|-------|-------|
| Flaky JWT test | backend / test | 1 file |
| jest-preset-angular entrypoint | frontend / config | 1 file |
| DELETE /api/orders/{id} | backend / domain → application → infrastructure | 4 files (port, service, controller, tests) |
| Angular control-flow migration | frontend / templates | 7 components |

Hexagonal boundaries are preserved: DELETE flows through `OrderRepository` port → `OrderRepositoryAdapter` → `OrderJpaRepository` (Spring Data, already provides `deleteById`). No mapper changes (deletion does not move data through the boundary, only an id).

Angular control-flow migration touches **only template strings** and `@Component.imports` arrays — zero behavioral change, zero store/service edits.

---

## 2. ADR-style Decisions

### TD-1: Flaky JWT test — root cause + fix

**Decision**: Fix the actual root cause. **Reject** both `@RepeatedTest` (masks bug) and "hardcoded expired token" (wrong test — that's TD-1 about TAMPERING, not expiration).

**Root cause analysis** (`JwtServiceTest.java:107-123`):

```java
String tamperedSignature = parts[2].substring(0, parts[2].length() - 1) + "X";
```

The current code mutates **one Base64URL character** at the end of the signature. Base64URL alphabet = 64 symbols; HMAC-SHA256 signature decodes to 32 bytes. A one-character flip in the LAST char only affects ~6 bits of the decoded byte sequence — and depending on which char position changes, **the JJWT parser may interpret the trailing char as padding/equivalent under some Base64 variants and re-derive a byte sequence that the verifier accepts**. Even when it doesn't, the test depends on probabilistic decoding behavior across JJWT versions.

The test is technically non-deterministic by construction.

**Fix (deterministic byte-level tamper)**:

```java
@Test
void isTokenValid_withTamperedSignature_returnsFalse() {
    JwtService service = buildService(EXPIRATION_MS);
    UserDetails userDetails = user("alice");
    String validToken = service.generateToken(userDetails);

    String[] parts = validToken.split("\\.");
    // Decode signature to raw bytes, flip every bit of the first byte, re-encode.
    byte[] sigBytes = java.util.Base64.getUrlDecoder().decode(parts[2]);
    sigBytes[0] = (byte) (sigBytes[0] ^ 0xFF);
    String tamperedSignature = java.util.Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(sigBytes);
    String tamperedToken = parts[0] + "." + parts[1] + "." + tamperedSignature;

    boolean valid = service.isTokenValid(tamperedToken, userDetails);

    assertThat(valid).isFalse();
}
```

**Why this is deterministic**: XOR with `0xFF` flips ALL 8 bits of the first byte → the resulting 32-byte sequence cannot collide with the original HMAC. The signature length and Base64URL alphabet are preserved, so JJWT parses the structure normally and rejects only on signature mismatch — exactly what we want to assert.

**Trade-off**: Slightly more verbose than the one-line mutation, but `assertThat(valid).isFalse()` now means what the test name claims.

### TD-2: jest-preset-angular entrypoint

**Decision**: Migrate `frontend/setup-jest.ts` from `jest-preset-angular/setup-jest` to `jest-preset-angular/setup-env/zone` + `setupZoneTestEnv()`.

**Verification**: Read `frontend/node_modules/jest-preset-angular/setup-jest.js` — it emits a deprecation warning that explicitly tells you the replacement:

```
Importing "setup-jest.js" directly is deprecated. The file "setup-jest.js" will be removed in the future.
Please use "setupZoneTestEnv" function instead. Example:

    import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
    setupZoneTestEnv();
```

**Final file** (1 import → 1 import + 1 call):

```ts
// frontend/setup-jest.ts
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();
```

**Why `/zone` and not `/zoneless`**: The project still uses `zone.js@~0.14.0` (see `package.json`); migrating to zoneless is out of scope for Fase 5.

### TD-3: DELETE /api/orders/{id}

**Layered design** (no shortcut around hexagonal boundary):

| Layer | File | Change |
|-------|------|--------|
| Domain port | `domain/port/OrderRepository.java` | Add `void deleteById(Long id);` |
| Infra adapter | `infrastructure/persistence/OrderRepositoryAdapter.java` | Implement `deleteById` → `jpaRepository.deleteById(id)` |
| Application | `application/service/OrderService.java` | Add `deleteOrder(Long id)` with existence check |
| Web | `infrastructure/web/controller/OrderController.java` | Add `@DeleteMapping("/{id}")` returning 204 |
| Test (unit) | `application/service/OrderServiceTest.java` | New tests: success + not-found |
| Test (web) | `infrastructure/web/controller/OrderControllerSecurityTest.java` | New: ADMIN → 204; (existing USER → 403 stays) |
| Test (web) | `infrastructure/web/controller/OrderControllerTest.java` | New: 204 + service-called-once + 404 |

**Application logic**:

```java
public void deleteOrder(Long id) {
    if (!orderRepository.existsById(id)) {
        throw new EntityNotFoundException("Order not found with id: " + id);
    }
    orderRepository.deleteById(id);
}
```

**Why pre-check existence with `existsById`**: Spring Data `deleteById` throws `EmptyResultDataAccessException` when the entity is missing — that's an infrastructure exception leaking semantics. Centralizing on `EntityNotFoundException` (already used by `getOrderById`, `createOrder`, `updateOrderDetails`) keeps the GlobalExceptionHandler mapping clean (404 problem+json).

**Controller**:

```java
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
    orderService.deleteOrder(id);
    return ResponseEntity.noContent().build();
}
```

**Why `@PreAuthorize` AND SecurityConfig matcher** (defense-in-depth):
- `SecurityConfig` already has `.requestMatchers(HttpMethod.DELETE, "/api/orders/**").hasRole("ADMIN")` (line 45).
- `@PreAuthorize` is method-level — survives if the URL pattern matcher is ever refactored.
- Belt + suspenders is cheap (one annotation) and aligns with the existing pattern in `CustomerController.delete`.

**Why 204 No Content (not 200 with body, not 202)**: REST convention for idempotent destructive ops with no payload. Aligns with the existing `CustomerController` delete.

**No domain `Order.delete()` method**: Deletion is not a domain rule — the entity has no business invariants to enforce on removal (no soft-delete, no cascade rules in this phase). Pure data-layer concern, lives in the application service.

### TD-4: Angular control-flow migration — strategy

**Decision**: Migrate **per-component**, in a single PR (PR-B), with an explicit pipe-import audit for each file BEFORE removing `CommonModule` / `NgIf` / `NgFor`.

**Mechanical transformation rules**:

| Before | After |
|--------|-------|
| `*ngIf="cond"` on element | wrap element in `@if (cond) { … }` |
| `*ngIf="cond; else tplRef"` + `<ng-template #tplRef>` | `@if (cond) { … } @else { … }` |
| `*ngIf="expr as alias"` | `@if (expr; as alias) { … }` |
| `*ngFor="let x of list; trackBy: trackByFn"` | `@for (x of list; track x.id) { … } @empty { … }` |
| `*ngFor="let x of list; trackBy: trackByPrim"` (primitives) | `@for (x of list; track x) { … }` |
| `<ng-container *ngIf="…; else …">` | `@if (…) { … } @else { … }` (drop the wrapper) |

**`track` policy**:
- Entities with `id` (Order, Customer) → `track item.id`
- Primitives (the `statuses: OrderStatus[]` array in OrderList) → `track s` (the value itself, since OrderStatus values are unique strings)
- **Never** `track $index` — it forces full re-render on reorder/insert and breaks OnPush optimization.

**Dead code to remove**: every `trackBy*` method in the component class becomes unused once `*ngFor` is gone. Remove them. The proposal counted 4: `trackById` × 3 (customer-list, order-list, order-form) + `trackByStatus` × 1 (order-list).

**Per-component import diffs** (the only TS edits):

| Component | Remove from `imports` | Keep | Add |
|-----------|----------------------|------|-----|
| `customer-list.component.ts` | `NgFor`, `NgIf` | `RouterLink` | — |
| `customer-form.component.ts` | `NgIf` | `ReactiveFormsModule` | — |
| `order-list.component.ts` | `NgFor`, `NgIf` | `NgStyle`, `FormsModule`, `RouterLink`, `CurrencyPipe`, `DatePipe` | — |
| `order-form.component.ts` | `NgFor`, `NgIf` | `ReactiveFormsModule` | — |
| `order-detail.component.ts` | `NgIf` | `CurrencyPipe`, `DatePipe`, `RouterLink` | — |
| `login-page.component.ts` | `NgIf` | `ReactiveFormsModule` | — |
| `dashboard.component.ts` | `CommonModule` | — | `DecimalPipe` |

**Note on `NgStyle`**: stays. `[ngStyle]="{...}"` in `order-list` is an attribute directive, NOT a structural directive — outside the scope of @if/@for migration. (Future work could move to `[style.background]="..."` but it's not required by the proposal.)

**Note on `dashboard`**: already uses `@if`. The only change is replacing `CommonModule` with the targeted `DecimalPipe` import (used in `{{ store.totalRevenue() | number:'1.2-2' }}` — `number` pipe is the public name of `DecimalPipe`).

---

## 3. Component Map (data flow unchanged)

```
DELETE /api/orders/{id}
  └─> OrderController.deleteOrder(id)
       └─> OrderService.deleteOrder(id)
            ├─> OrderRepository.existsById(id)  → throw EntityNotFoundException if false
            └─> OrderRepository.deleteById(id)
                 └─> OrderRepositoryAdapter.deleteById(id)
                      └─> OrderJpaRepository.deleteById(id)  [Spring Data]
```

Frontend (out of scope for Fase 5 — `OrderListComponent.deleteOrder()` has a `// TODO` placeholder; wiring it is a Fase 6 concern, NOT this phase). The proposal explicitly lists DELETE as a backend-only deliverable; the frontend Delete button is already gated by `@if (authStore.isAdmin())`.

---

## 4. Integration Points

| Surface | Change | Risk |
|---------|--------|------|
| `JwtServiceTest` | swap tamper logic | none — same assertion, deterministic |
| `setup-jest.ts` | swap import | low — caught immediately by `npm test` |
| `SecurityConfig` | NONE (already configured) | none |
| `GlobalExceptionHandler` | NONE (already maps `EntityNotFoundException` → 404) | none |
| Angular templates | 7 component template strings | medium — must run `npm test` + visual smoke after each |

---

## 5. PR Delivery Strategy

**Estimated changed lines** (rough):

| PR | Files | LOC added | LOC removed | Net |
|----|-------|-----------|-------------|-----|
| PR-A (tech debt) | 8 (1 jest, 1 jwt test, 6 backend+tests) | ~120 | ~10 | +110 |
| PR-B (Angular migration) | 7 components | ~180 | ~210 | -30 |

**Total**: ~330 lines of churn (well under the 400-line PR budget when split).

**Recommended split**:

### PR-A — `feature/fase-5-tech-debt`
- TD-1: Fix flaky JWT test (1 file)
- TD-2: jest-preset-angular entrypoint (1 file)
- TD-3: DELETE /api/orders/{id} end-to-end (port + adapter + service + controller + 3 tests)

**Rationale**: backend + test infra changes, easy to review independently, isolated risk surface. Reviewer can run `./mvnw test` and `npm test` to validate without touching templates.

### PR-B — `feature/fase-5-angular-control-flow`
- TD-4: Migrate 7 components to @if/@for + clean CommonModule/NgIf/NgFor imports + remove dead trackBy methods

**Rationale**: pure refactor, no functional change, reviewer focuses on template diffs. Group by "all templates at once" rather than per-feature because:
- Each component is self-contained (no cross-component dependencies in templates).
- Splitting by feature would create 3 PRs of ~60 lines each — overhead > benefit.
- `CommonModule`/`NgIf`/`NgFor` removal MUST happen atomically with the template change in the same component (otherwise the component breaks).

**Why NOT one mega-PR**: PR-A and PR-B touch completely different test surfaces. Mixing them slows review and conflates "did the backend break" vs "did the templates break" debugging.

**Branching**: both PRs target `develop`, PR-A first (independent), PR-B can start in parallel (no overlap).

---

## 6. Testing Strategy

| Concern | Test type | Location |
|---------|-----------|----------|
| TD-1 fix | Unit (JUnit 5) | `JwtServiceTest.isTokenValid_withTamperedSignature_returnsFalse` (modified) |
| TD-2 fix | Smoke (any existing spec) | runs `npm test` — all specs must still execute without deprecation warning |
| TD-3 service | Unit (Mockito) | `OrderServiceTest.deleteOrder_*` (new — 2 tests: success, not-found) |
| TD-3 controller | @WebMvcTest | `OrderControllerTest.deleteOrder_*` (new — 204 + 404) |
| TD-3 security | @WebMvcTest + Spring Security Test | `OrderControllerSecurityTest.deleteOrder_withUserRole_returns403` (already exists, line 116 — verifies it still passes after endpoint is wired); add `deleteOrder_withAdminRole_returns204` |
| TD-4 templates | Existing component specs | `npm test` must pass with zero changes to spec files |

**TDD discipline (Strict TDD Mode active)**:
1. PR-A: write the failing tamper-test fix first; write `OrderServiceTest.deleteOrder_*` failing tests first; then implement.
2. PR-B: existing component specs are the safety net — migrate one component, run its spec, verify green, commit, repeat.

---

## 7. Risks

1. **Flaky test fix masks deeper issue**: low probability — the byte-XOR approach is mathematically deterministic. If JJWT 0.12 ever changes signature length validation, the test stays correct (signature still has 32 bytes after XOR).

2. **`jest-preset-angular@14.2.4` peer-dependency drift**: the `setupZoneTestEnv` symbol exists in 14.x; verified via `node_modules` inspection. Risk: zero.

3. **Template migration silent regression**: a malformed `@if` block can compile and render nothing. Mitigation: existing component specs assert on rendered DOM (e.g. `expect(fixture.nativeElement.querySelector('table'))...`) — they'll fail loudly. Strict TDD: run `npm test -- --testPathPattern=<component>` after each migration.

4. **`dashboard.component` `CommonModule` removal**: if `DecimalPipe` import is forgotten, the `| number:'1.2-2'` pipe will throw at runtime (template-only, no compile error in 18.x). Mitigation: dashboard spec must render the revenue card and assert formatted text.

5. **Pipe inventory for each migrated component**: I audited all 7 components; only `dashboard` uses `CommonModule` (everything else imports specific pipes already). Low risk, but the migration agent (sdd-apply) must re-verify per file.

6. **Frontend Delete wiring out of scope**: `OrderListComponent.deleteOrder()` remains a TODO. Document this clearly in PR-A description so reviewers don't expect end-to-end DELETE.

7. **Order of PR merge**: PR-A introduces a new endpoint that the frontend doesn't call yet — fine. PR-B doesn't touch the backend — fine. No coupling.

---

## 8. Out of Scope (explicit)

- Frontend wiring for DELETE button (Fase 6+).
- Soft-delete or audit-log for orders (no business requirement).
- Migration to zoneless Angular (`setup-env/zoneless`).
- `[ngStyle]` → `[style.*]` refactor in `order-list`.
- New tests beyond the ones required to validate the three TD fixes.
