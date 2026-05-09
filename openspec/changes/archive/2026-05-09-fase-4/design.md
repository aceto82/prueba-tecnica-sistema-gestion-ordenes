# Fase 4 — Technical Design (Hardening)

## Context

Fases 1–3 shipped a working OMS (auth, orders CRUD, customers CRUD, dashboard, RBAC, RxJS-driven search, Signal stores). Baseline today:

- **Backend tests**: 13 test classes covering auth, services, repos, security filter, JWT, controllers, architecture
- **Frontend tests**: 9 spec files (auth.guard, jwt.interceptor, login-page, customer.service, order.service, order.store, customer.store, dashboard.store, auth.store)
- **OnPush**: ALL 13 components already declare `ChangeDetectionStrategy.OnPush` — audit becomes a verification pass, not a rewrite
- **trackBy**: 4 `*ngFor` instances, **zero** with `trackBy` — gap is real and mechanical
- **Lazy loading**: `app.routes.ts` already uses `loadComponent` / `loadChildren` for every feature — confirmed clean
- **Dead code**: at least one `console.log` in `order-list.component.ts:268` (placeholder delete)

Fase 4 closes coverage gaps, applies a Clean Code pass with the test net active, and runs the audits last.

---

## Goals / Non-Goals

**Goals**
1. Raise meaningful test coverage on backend services + repos + controllers and frontend stores + services + guards/interceptors to ~70–75% on business code
2. Apply Clean Code conventions across both stacks without behavioral change
3. Verify and complete Angular performance audits (OnPush, trackBy, lazy)

**Non-goals**
- New endpoints, screens, business rules
- Migrating `*ngFor` to `@for` control flow (purely stylistic)
- E2E (Cypress/Playwright)
- Architectural moves (CQRS, mediator, layer reshuffling)
- Bundle/asset optimizations beyond lazy routes
- Hitting 100% coverage — getters/DTOs/config are explicitly excluded

---

## Architecture Decisions (ADR-style)

### ADR-1 — Three sequential tracks (Tests → Clean Code → Audits)

**Decision**: Land tests first across both stacks, THEN refactor with Clean Code, THEN run Angular audits last.

**Rationale**: Refactoring without a green test net is reckless. Audits last because they are mechanical, low-risk, and benefit from any refactor renames.

**Rejected alternative**: Parallel tracks. Faster on paper, but Clean Code edits without coverage create regressions that surface only at demo.

---

### ADR-2 — Backend test layering: test each layer with the right tool

**Decision**: Three distinct backend test styles, one per layer:

| Layer | Test style | Why |
|-------|------------|-----|
| Domain (`domain/model/*`) | Plain JUnit 5, no Spring | Domain has no Spring deps — boot-free tests run in milliseconds |
| Application (`application/service/*`) | `@ExtendWith(MockitoExtension.class)` + `@Mock` ports | Service logic in isolation, no DB/Spring context |
| Persistence (`infrastructure/persistence/*`) | `@DataJpaTest` + H2 | Real JPA queries, mappers, Specifications validated against a real (in-memory) DB |
| Controllers (`infrastructure/web/controller/*`) | `@WebMvcTest` + `MockMvc` + `@MockBean` services | Tests routing, validation, security, serialization without booting full app |
| Security filter (`JwtAuthenticationFilter`) | `@SpringBootTest(webEnvironment=MOCK)` OR pure JUnit + manual filter wiring | Already covered — keep current style |

**Rationale**: matches the hexagonal layers. Cheapest test that proves the layer's responsibility.

**Rejected alternative**: One big `@SpringBootTest` for everything. Slow, fragile, hides which layer broke.

---

### ADR-3 — Frontend test patterns by artifact type

**Decision**:

| Artifact | Pattern |
|----------|---------|
| HTTP services (`*.service.ts`) | `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController` — verify URL, method, body, headers; flush response |
| Signal stores (`*.store.ts`) | `TestBed` with mocked service via `useValue` returning `of(...)`; assert signal values **after** the action resolves |
| Guards (`*.guard.ts`) | `TestBed.runInInjectionContext` (functional guards); mock `Router` and `AuthService` |
| Interceptors (`*.interceptor.ts`) | `provideHttpClient(withInterceptors([...]))` + `HttpTestingController`; assert `req.headers.get('Authorization')` |
| Components (smoke tests only) | Angular Testing Library `render` + `screen.getByRole/getByText` + `fireEvent` — assert template renders signal data + click handlers fire store methods |

**Rationale**: Stores are the truth source — testing them covers most behavior. Components get smoke tests to catch template-binding regressions, not deep DOM assertions.

**Rejected alternative**: Deep component DOM tests with full data flow. Brittle, duplicates store coverage, slow.

---

### ADR-4 — Coverage targets and exclusions

**Decision**: target ~70–75% on **business code**:

**Included**: services, stores, mappers (when they have logic), guards, interceptors, controllers, repositories, specifications, domain entities.

**Excluded** (do not chase coverage on these):
- DTOs / records / Lombok-generated code
- Plain getters/setters
- Spring config classes (`SecurityConfig`, `JwtProperties`, `WebMvcConfig`) — already exercised indirectly by controller tests
- `OmsApplication.main`, `app.config.ts`, `main.ts`
- Static label maps (`ORDER_STATUS_LABELS`, etc.)

**Rationale**: chasing 100% pollutes the suite with valueless tests and wastes review time. Heuristic: *"would this test fail if the logic was wrong?"* — if no, do not write it.

---

### ADR-5 — Clean Code rules (concrete, enforceable)

**Decision**: apply uniformly across stacks:

1. **Extract method when**: > 20 lines OR > 2 nesting levels. Name extracted methods with verbs (`validateStatusTransition`, `buildSearchSpec`).
2. **Naming**: classes are nouns, methods are verbs, no abbreviations (`usr` → `user`, `ord` → `order`). Booleans start with `is/has/can`.
3. **Constants**: `private static final` (Java) or `const` at module top (TS). No magic numbers/strings inline.
4. **Remove dead code**: confirmed instance — `order-list.component.ts:268` `console.log('Delete order:', id)` placeholder. Either implement delete OR remove the button + handler.
5. **No `console.log`** in production code. Allowed only in `*.spec.ts` if a test explicitly asserts logging.
6. **No `any`** — replace with concrete types or `unknown`.
7. **Single Responsibility per class**: if a service does both data fetching and form-state mutation, split.

**Rejected alternative**: enforce these via lint rules in this phase. ESLint/PMD config is its own scope; keep Fase 4 to a manual pass + checklist.

---

### ADR-6 — OnPush audit becomes a verification pass

**Decision**: every component already declares `ChangeDetectionStrategy.OnPush`. The audit task is to verify each component renders correctly under OnPush by:
- Confirming all template bindings come from signals or `async` pipe
- Flagging any `setTimeout` / manual subscription that mutates fields without `markForCheck()`

**Rationale**: codebase already passes the structural check. The risk is *behavioral* (silent stale renders), so audit = run the app + open each route + interact with controls.

**Rejected alternative**: assume OnPush is correct just because the decorator is set. Under-tests the actual rendering pipeline.

---

### ADR-7 — `trackBy` via class methods, not inline arrows

**Decision**: every `*ngFor` gets a `trackBy` reference to a **class method**, not an inline arrow:

```typescript
// CORRECT
trackById = (_: number, item: { id: number }): number => item.id;
// template: *ngFor="let o of orders(); trackBy: trackById"

// WRONG — defeats Angular's identity check, recreated every CD cycle
*ngFor="let o of orders(); trackBy: (i, item) => item.id"
```

For `*ngFor` over `OrderStatus[]` (the status filter dropdown) the trackBy is the value itself: `trackByValue = (_: number, v: string) => v`.

**Files affected** (4 `*ngFor` instances):
- `customer-list.component.ts:127` — over `store.customers()` → `trackById`
- `order-list.component.ts:164` — over `statuses` (status enum) → `trackByValue`
- `order-list.component.ts:187` — over `store.orders()` → `trackById`
- `order-form.component.ts:111` — over `customers()` → `trackById`

---

### ADR-8 — Lazy-loading audit is a one-line confirmation

**Decision**: `app.routes.ts` is already correct — every feature uses `loadComponent` or `loadChildren`. Audit task: read the file, confirm in writing in the verify report, done. No code change.

---

## Component Map / File-Level Plan

### Backend — files needing NEW or EXPANDED tests

| File | Existing test? | Action |
|------|----------------|--------|
| `application/service/OrderService.java` | Yes (`OrderServiceTest`) | Expand: cover `updateOrderDetails` PENDING-only rule, status-transition logic, `listOrders` with username filter (Phase 5 already added this), `EntityNotFoundException` paths |
| `application/service/CustomerService.java` | Yes (`CustomerServiceTest`) | Verify duplicate-email rule covered; expand if gaps |
| `infrastructure/persistence/OrderRepositoryAdapter.java` | NO | Create `OrderRepositoryAdapterTest` with `@DataJpaTest` |
| `infrastructure/persistence/CustomerRepositoryAdapter.java` | Yes (`CustomerRepositoryAdapterTest`) | Verify; expand pagination edge cases |
| `infrastructure/persistence/UserRepositoryAdapter.java` | Yes | Keep |
| `infrastructure/persistence/specification/OrderSpecification.java` | Yes (`OrderSpecificationTest`) | Verify all predicate branches covered (status, customerId, dateFrom/To, username) |
| `infrastructure/persistence/mapper/OrderMapper.java` | NO | Create `OrderMapperTest` (round-trip domain ↔ JPA) |
| `infrastructure/persistence/mapper/CustomerMapper.java` | NO | Create `CustomerMapperTest` |
| `infrastructure/persistence/mapper/UserMapper.java` | NO | Create `UserMapperTest` |
| `infrastructure/web/controller/OrderController.java` | Yes (`OrderControllerTest`) | Verify `@WebMvcTest`-style; expand validation error responses, RBAC paths |
| `infrastructure/web/controller/CustomerController.java` | Yes | Same |
| `infrastructure/web/controller/AuthController.java` | Yes | Keep |
| `infrastructure/web/controller/DashboardController.java` | NO | Create `DashboardControllerTest` (`@WebMvcTest`) |
| `infrastructure/web/controller/GlobalExceptionHandler.java` | NO (covered indirectly) | Add direct test asserting status codes for each exception type |
| `infrastructure/web/mapper/OrderDtoMapper.java` | NO | Create `OrderDtoMapperTest` |
| `infrastructure/web/mapper/CustomerDtoMapper.java` | NO | Create `CustomerDtoMapperTest` |
| `domain/model/Order.java` | Yes (`OrderDomainTest`) | Verify all factory + status transition branches |

### Backend — files needing Clean Code refactor (suspected; confirm during apply)

- `OrderService.java` — has two overloads of `listOrders` (with/without username); extract a common path or document the fork
- `OrderSpecification.java` — likely > 20 lines per predicate builder; candidate for extract-method
- `GlobalExceptionHandler.java` — verify each handler is small and focused
- `DevDataSeeder.java` — keep as-is; seeding code is not "production code" subject to Clean Code chase

### Frontend — files needing NEW or EXPANDED tests

| File | Existing test? | Action |
|------|----------------|--------|
| `core/services/auth.service.ts` | NO | Create `auth.service.spec.ts` — login posts to `/api/auth/login`, stores JWT, exposes user signal |
| `core/services/order.service.ts` | Yes | Verify URL/payload coverage; add error-path test |
| `core/services/customer.service.ts` | Yes | Same |
| `features/dashboard/dashboard.service.ts` | NO | Create `dashboard.service.spec.ts` |
| `core/guards/auth.guard.ts` | Yes | Verify; expand role-based redirect path |
| `core/interceptors/jwt.interceptor.ts` | Yes | Verify; add 401 handling case if applicable |
| `features/auth/auth.store.ts` | Yes | Verify |
| `features/orders/order.store.ts` | Yes | Verify; expand error/loading state coverage |
| `features/customers/customer.store.ts` | Yes | Same |
| `features/dashboard/dashboard.store.ts` | Yes | Verify |
| `features/orders/pages/order-list/order-list.component.ts` | NO | Create smoke spec — renders rows, search input fires store action, status filter triggers reload |
| `features/orders/pages/order-form/order-form.component.ts` | NO | Smoke spec — submit triggers create/update, validation surfaces |
| `features/orders/pages/order-detail/order-detail.component.ts` | NO | Smoke spec — renders fields from store |
| `features/customers/pages/customer-list/customer-list.component.ts` | NO | Smoke spec |
| `features/customers/pages/customer-form/customer-form.component.ts` | NO | Smoke spec |
| `features/customers/pages/customer-detail/customer-detail.component.ts` | NO | Smoke spec |
| `features/dashboard/dashboard.component.ts` | NO | Smoke spec — renders stats, bar chart container |
| `shared/ui/layout/header/header.component.ts` | NO | Optional — only if it has logic (logout, role display) |
| `shared/ui/layout/sidebar/sidebar.component.ts` | NO | Optional — same |
| `shared/ui/layout/layout.component.ts` | NO | Skip — pure shell |
| `features/auth/login-page/login-page.component.ts` | Yes | Verify |

### Frontend — files needing Clean Code / audit changes

| File | Change |
|------|--------|
| `order-list.component.ts:268` | Remove `console.log` (and remove or implement the delete handler) |
| `order-list.component.ts:164` | Add `trackByValue` |
| `order-list.component.ts:187` | Add `trackById` |
| `order-form.component.ts:111` | Add `trackById` |
| `customer-list.component.ts:127` | Add `trackById` |
| All components | Manual visual OnPush verification (no code change unless a render bug surfaces) |

---

## Test File Naming and Location Conventions

### Backend (mirrors source tree)

```
backend/src/test/java/com/oms/<same-package-as-source>/<ClassName>Test.java
```

- One test class per production class. Test class = `<ClassName>Test`.
- Test method names: `methodName_state_expectedBehavior` — e.g. `updateOrderDetails_whenStatusNotPending_throwsIllegalState`.
- Use `@DisplayName` on the class for human-readable suite name.
- Place fixtures under `backend/src/test/java/com/oms/support/` (only if shared across 3+ tests).

### Frontend (collocated with source)

```
frontend/src/app/.../<file>.spec.ts          # next to <file>.ts
```

- Describe block = class/file name. Each `it()` = `should <verb> when <state>`.
- Component smoke specs use Angular Testing Library; store/service specs use `TestBed`.
- Shared test utilities under `frontend/src/test-utils/` (create only if needed by 3+ specs).

---

## Data Flow Overview (unchanged — for reference)

Tests follow the existing flow; no new components introduced.

```
Browser
  └── Angular component → Store (signals) → Service (HTTP) → Backend
                                                                ├── Controller
                                                                ├── Service (use case)
                                                                ├── Repository port
                                                                └── JPA adapter → PostgreSQL
```

Test boundaries align with arrows: each arrow is a contract one or both sides must verify.

---

## Delivery Slicing — Suggested PR Split

Three sequential PRs, each independently green and reviewable.

### PR A — Tests (safety net) — TARGET ~700 lines
**Branch**: `feature/fase-4-tests`

- Backend: new mapper tests, `DashboardControllerTest`, `GlobalExceptionHandler` test, `OrderRepositoryAdapterTest`, expanded service tests
- Frontend: `auth.service.spec.ts`, `dashboard.service.spec.ts`, smoke specs for the 7 untested components
- No production code changes

**Risk**: large by line count due to volume of test files. Mitigation: tests are mechanical and reviewable per-file; can split into PR A1 (backend) and PR A2 (frontend) if reviewer prefers.

### PR B — Clean Code pass — TARGET ~250 lines
**Branch**: `feature/fase-4-cleancode`
**Requires**: PR A merged

- Remove `console.log`s and decide on the delete handler stub
- Extract long methods (Order service, Specification builders if needed)
- Naming pass + magic-number → constant migration
- Replace residual `any`

**Risk**: refactors can introduce regressions. Mitigated by PR A safety net — tests must stay green.

### PR C — Angular audits — TARGET ~80 lines
**Branch**: `feature/fase-4-audits`
**Requires**: PR B merged

- Add `trackById` / `trackByValue` to 4 components (5 `*ngFor` instances total)
- Add visual OnPush verification note in PR description (no code unless bug found)
- Add written confirmation in PR body that `app.routes.ts` is fully lazy

**Risk**: minimal — mechanical changes with established pattern.

### Total budget
~1030 lines across 3 PRs. PR A is the heavy one and may need an `auto-chain` split. PRs B and C are well within the 400-line review budget.

---

## Architectural Risks

1. **Coverage chase trap** — pressure to hit a number can produce valueless tests on getters/DTOs. Mitigation: ADR-4 exclusion list + the heuristic *"would this fail if the logic was wrong?"*
2. **OnPush silent stale renders** — components declare OnPush but may rely on Zone-driven CD that hides bugs. Mitigation: ADR-6 manual verification pass per route.
3. **PR A size** — many test files = many lines. Mitigation: pre-approved split into A1 (backend) / A2 (frontend) if reviewer requests.
4. **Smoke-test scope creep** — component specs can balloon into deep DOM tests. Mitigation: ADR-3 explicitly limits to "renders signal data + click fires store method".
5. **Refactor regressions in PR B** — Clean Code edits without behavioral test coverage are risky. Mitigation: ADR-1 sequencing — PR A must merge first.
6. **No lint enforcement** — Clean Code rules are manual this phase. Future risk: drift. Acceptable for this phase; defer lint config to a follow-up.

---

## Open Questions (none blocking)

- Should the `delete order` button in `order-list` be removed in PR B (cleanest) or implemented as a follow-up feature (out of Fase 4 scope)? **Recommendation: remove the button + handler in PR B; reintroduce as a feature in a later phase if needed.**
- Do we want a coverage report artifact (jacoco / istanbul) committed in PR A? **Recommendation: configure but do not commit reports — add a CI step that prints the summary.**
