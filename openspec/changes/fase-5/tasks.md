# Tasks: Fase 5 — Tech Debt + Angular Control Flow Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~520 (PR-A: ~130, PR-B: ~390) |
| 400-line budget risk | Low (each PR individually under 400) |
| Chained PRs recommended | Yes |
| Suggested split | PR-A → PR-B |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | TD-1 + TD-2 + TD-3 (backend tech debt + DELETE endpoint) | PR-A | Full stack: JWT test, jest setup, port/adapter/service/controller/tests |
| 2 | TD-4 (Angular control-flow migration) | PR-B | 7 components, pure refactor, no functional change |

---

## Phase 1: TD-1 — Fix Flaky JWT Test

- [x] 1.1 Modify `backend/src/test/java/com/oms/infrastructure/security/JwtServiceTest.java`: Replace one-char mutation with deterministic byte-XOR tamper logic (decode signature, XOR first byte with 0xFF, re-encode)

---

## Phase 2: TD-2 — jest-preset-angular Entrypoint

- [x] 2.1 Modify `frontend/setup-jest.ts`: Replace `import 'jest-preset-angular/setup-jest'` with `import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone'` + call `setupZoneTestEnv()`

---

## Phase 3: TD-3 — DELETE /api/orders/{id} Endpoint

- [x] 3.1 Add `void deleteById(Long id)` to `domain/port/OrderRepository.java`
- [x] 3.2 Implement `deleteById` in `infrastructure/persistence/OrderRepositoryAdapter.java` → `jpaRepository.deleteById(id)`
- [x] 3.3 Add `deleteOrder(Long id)` to `application/service/OrderService.java` (check existsById, throw EntityNotFoundException if missing, then delete)
- [x] 3.4 Add `@DeleteMapping("/{id}")` + `@PreAuthorize("hasRole('ADMIN')")` to `infrastructure/web/controller/OrderController.java`
- [x] 3.5 Write `OrderServiceTest.deleteOrder_*` tests (success + not-found scenarios)
- [x] 3.6 Write `OrderControllerTest.deleteOrder_*` tests (204 + 404)
- [x] 3.7 Add `deleteOrder_withAdminRole_returns204` to `OrderControllerSecurityTest.java`

---

## Phase 4: TD-4 — Angular Control-Flow Migration

- [ ] 4.1 Migrate `customer-list.component.ts`: Replace *ngIf/*ngFor with @if/@for, remove NgFor/NgIf from imports, remove trackById method
- [ ] 4.2 Migrate `customer-form.component.ts`: Replace *ngIf with @if/else, remove NgIf from imports
- [ ] 4.3 Migrate `order-list.component.ts`: Replace *ngIf/*ngFor with @if/@for/@empty, remove NgFor/NgIf from imports, remove trackById + trackByStatus methods
- [ ] 4.4 Migrate `order-form.component.ts`: Replace *ngIf/*ngFor with @if/@for, remove NgFor/NgIf from imports, remove trackById method
- [ ] 4.5 Migrate `order-detail.component.ts`: Replace *ngIf with @if, remove NgIf from imports
- [ ] 4.6 Migrate `login-page.component.ts`: Replace *ngIf with @if, remove NgIf from imports
- [ ] 4.7 Migrate `dashboard.component.ts`: Replace CommonModule with DecimalPipe import, verify @if blocks remain correct

---

## Implementation Notes

- PR-A must be merged before PR-B (DELETE endpoint needed for future frontend wiring, but not in this phase)
- Each Angular component migration: run `npm test -- --testPathPattern=<component>` after change to verify no regression
- TD-4 is pure refactor — no behavioral changes expected; existing component specs are the safety net