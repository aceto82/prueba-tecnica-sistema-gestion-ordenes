# Tasks: Fase 4 — Hardening (Tests + Clean Code + Angular Audits)

## Review Workload Forecast

| PR  | Scope                                       | Est. new LOC | Est. changed LOC | Total LOC | 400-line risk | Chained PRs recommended |
|-----|---------------------------------------------|-------------|-----------------|-----------|---------------|-------------------------|
| A1  | Backend tests (new test classes)            | ~380        | 0               | ~380      | Medium        | Optional split          |
| A2  | Frontend tests (new spec files)             | ~320        | 0               | ~320      | Low           | No                      |
| B   | Clean Code pass (backend + frontend)        | ~30         | ~60             | ~90       | Low           | No                      |
| C   | Angular audits (trackBy + verifications)    | ~40         | ~30             | ~70       | Low           | No                      |

**Chained PRs recommended**: Yes for PR A (A1 → A2 sequential recommended; each under 400 LOC).  
**Decision needed before apply**: Yes — confirm A1/A2 split or merge into single PR A.  
**Overall sequence**: A1 → A2 → B → C (B and C require A merged; C is independent of B).

---

## PR A1 — Backend Tests

> Spec requirement: Track 1 Backend — OrderService, CustomerService, OrderRepository (@DataJpaTest), JwtService, OrderController, CustomerController, DashboardController, GlobalExceptionHandler.
> All listed files **already exist** with partial coverage. Tasks below address the **gaps** identified against spec scenarios.

- [ ] **F4-T01** | PR A1 | `backend/src/test/java/com/oms/application/service/OrderServiceTest.java`
  Add missing spec scenarios: `listOrders` with USER role scopes by username (only own orders returned); `listOrders` with ADMIN role returns all orders. The current test passes username but does not assert role-based scoping at the service boundary.

- [ ] **F4-T02** | PR A1 | `backend/src/test/java/com/oms/infrastructure/persistence/OrderRepositoryAdapterTest.java` *(new file)*
  Create `@DataJpaTest` test class for `OrderRepositoryAdapter`. Must cover: find by status (PENDING filter returns only PENDING rows), find by username (scoped query returns only that user's orders), paginated retrieval respects page size (5 orders → page of 2 returns exactly 2, `totalElements` = 5).

- [ ] **F4-T03** | PR A1 | `backend/src/test/java/com/oms/infrastructure/security/JwtServiceTest.java`
  Add missing spec scenarios: tampered token fails validation (alter one character of signature → `isTokenValid` returns false); role extraction returns correct role string (`extractRole` or equivalent — verify claim key matches what the spec calls `role`).

- [ ] **F4-T04** | PR A1 | `backend/src/test/java/com/oms/infrastructure/web/controller/OrderControllerTest.java`
  Add missing spec scenarios: unauthenticated request returns 401 (currently security is excluded from `@WebMvcTest` — add a separate test variant that includes security or document why 401 is tested via integration); ADMIN-only endpoint returns 403 for USER role; invalid body returns 400 with `application/problem+json` content type.

- [ ] **F4-T05** | PR A1 | `backend/src/test/java/com/oms/infrastructure/web/controller/CustomerControllerTest.java`
  Add missing spec scenarios: `POST /api/customers` returns 403 for USER role; invalid body returns 400; duplicate email returns 409 (via `GlobalExceptionHandler`).

- [ ] **F4-T06** | PR A1 | `backend/src/test/java/com/oms/infrastructure/web/controller/DashboardControllerTest.java` *(new file)*
  Create `@WebMvcTest` test for `DashboardController`. Must cover: authenticated USER receives 200 with stats payload; unauthenticated request receives 401.

- [ ] **F4-T07** | PR A1 | `backend/src/test/java/com/oms/infrastructure/web/controller/GlobalExceptionHandlerTest.java` *(new file)*
  Create unit test (no Spring context) for `GlobalExceptionHandler`. Must cover: `EntityNotFoundException` → 404 ProblemDetail; `DuplicateEmailException` → 409 ProblemDetail; `InvalidStatusTransitionException` → 400 ProblemDetail; `MethodArgumentNotValidException` → 400 with `errors` property.

---

## PR A2 — Frontend Tests

> Spec requirement: Track 1 Frontend — OrderStore, CustomerStore, AuthStore (all exist), HTTP services (order, customer, dashboard, auth), JwtInterceptor, AuthGuard.
> Stores + interceptor + order/customer services + guard + login-page already have spec files. Tasks below address **gaps**: missing `update()` scenario on OrderStore, `CustomerStore` HTTP error scenario, `DashboardService` spec, `AuthService` spec, and page component smoke specs.

- [ ] **F4-T08** | PR A2 | `frontend/src/app/features/orders/order.store.spec.ts`
  Add missing spec scenario: `update()` replaces existing order in signal (orders had `{ id:1, status:'PENDING' }` → after PUT flush with `{ id:1, status:'PROCESSING' }`, the signal contains the updated order and length is unchanged). Current spec has create/load but not update.

- [ ] **F4-T09** | PR A2 | `frontend/src/app/features/customers/customer.store.spec.ts`
  Add missing spec scenario: `load()` on HTTP 500 sets `error()` signal to non-null and `loading()` to false.

- [ ] **F4-T10** | PR A2 | `frontend/src/app/features/dashboard/dashboard.service.spec.ts` *(new file)*
  Create Jest spec for `DashboardService` (located at `frontend/src/app/features/dashboard/dashboard.service.ts`). Must cover: `getStats()` sends `GET /api/dashboard/stats`; response maps to `DashboardStats` shape; HTTP error propagates.

- [ ] **F4-T11** | PR A2 | `frontend/src/app/core/services/auth.service.spec.ts` *(new file)*
  Create Jest spec for `AuthService`. Must cover: `login()` sends `POST /api/auth/login` with credentials body; returns `{ token }` on success; error propagates on 401.

- [ ] **F4-T12** | PR A2 | `frontend/src/app/features/orders/pages/order-list/order-list.component.spec.ts` *(new file)*
  Create smoke spec for `OrderListComponent`. Must cover: component renders without error (fixture creates and detects changes); the `OrderStore` is mocked with empty signals; presence of a table or data container element is asserted.

- [ ] **F4-T13** | PR A2 | `frontend/src/app/features/orders/pages/order-form/order-form.component.spec.ts` *(new file)*
  Create smoke spec for `OrderFormComponent`. Must cover: component renders without error; form element is present in the DOM.

- [ ] **F4-T14** | PR A2 | `frontend/src/app/features/orders/pages/order-detail/order-detail.component.spec.ts` *(new file)*
  Create smoke spec for `OrderDetailComponent`. Must cover: component renders without error with mocked `OrderStore` and `ActivatedRoute`.

- [ ] **F4-T15** | PR A2 | `frontend/src/app/features/customers/pages/customer-list/customer-list.component.spec.ts` *(new file)*
  Create smoke spec for `CustomerListComponent`. Must cover: component renders without error with mocked `CustomerStore`.

- [ ] **F4-T16** | PR A2 | `frontend/src/app/features/customers/pages/customer-form/customer-form.component.spec.ts` *(new file)*
  Create smoke spec for `CustomerFormComponent`. Must cover: component renders without error; form is present.

- [ ] **F4-T17** | PR A2 | `frontend/src/app/features/customers/pages/customer-detail/customer-detail.component.spec.ts` *(new file)*
  Create smoke spec for `CustomerDetailComponent`. Must cover: component renders without error with mocked `CustomerStore` and `ActivatedRoute`.

- [ ] **F4-T18** | PR A2 | `frontend/src/app/features/dashboard/dashboard.component.spec.ts` *(new file)*
  Create smoke spec for `DashboardComponent`. Must cover: component renders without error with mocked `DashboardStore`.

---

## PR B — Clean Code Pass

> Spec requirement: Track 2 — no method >20 lines in services/controllers, no magic strings/numbers, signals readonly at public API, dead code removed (unused imports, commented-out blocks, console.log).
> All methods in `OrderService` and `OrderController` are already ≤20 lines. Primary gap is `console.log` removal and readonly signal audit.

- [ ] **F4-T19** | PR B | `frontend/src/app/features/orders/pages/order-list/order-list.component.ts`
  Remove `console.log('Delete order:', id)` at line ~268 inside `deleteOrder()`. Replace with a TODO comment or stub that does not produce console output. *Requires PR A1+A2 merged first (safety net).*

- [ ] **F4-T20** | PR B | `frontend/src/app/features/orders/order.store.ts`
  Audit all public signal properties. Confirm every public property uses `.asReadonly()`. If any writable `WritableSignal<T>` is exposed publicly, convert it to readonly. *Verify only — expected to already comply based on design ADR-6.*

- [ ] **F4-T21** | PR B | `frontend/src/app/features/customers/customer.store.ts`
  Same readonly audit as F4-T20 for `CustomerStore`.

- [ ] **F4-T22** | PR B | `frontend/src/app/features/auth/auth.store.ts`
  Same readonly audit as F4-T20 for `AuthStore`.

- [ ] **F4-T23** | PR B | `frontend/src/app/**/*.ts` (all feature files)
  Scan for unused imports and `any` type annotations without justifying comments. Remove unused imports. Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason>` where `any` is intentional, or replace with a typed alternative.

- [ ] **F4-T24** | PR B | `backend/src/main/java/com/oms/application/` + `backend/src/main/java/com/oms/infrastructure/web/`
  Audit Java service and controller methods for unused variables and compiler warnings. Verify zero unused-variable warnings in `application/` and `infrastructure/web/` packages. Document any findings; fix if found.

---

## PR C — Angular Performance Audits

> Spec requirement: Track 3 — OnPush on all components (verify only), trackBy on all *ngFor (4 gaps to fix), lazy loading (verify only).

- [ ] **F4-T25** | PR C | `frontend/src/app/features/customers/pages/customer-list/customer-list.component.ts`
  Add `trackByCustomerId(index: number, customer: { id: number }): number { return customer.id; }` method to the class. Add `trackBy: trackByCustomerId` to the `*ngFor` at line ~127. *Requires PR A merged (smoke spec covers this component).*

- [ ] **F4-T26** | PR C | `frontend/src/app/features/orders/pages/order-list/order-list.component.ts`
  Add `trackByStatus(index: number, s: string): string { return s; }` method. Add `trackBy: trackByStatus` to the `*ngFor` at line ~164 (status options).

- [ ] **F4-T27** | PR C | `frontend/src/app/features/orders/pages/order-list/order-list.component.ts`
  Add `trackByOrderId(index: number, order: { id: number }): number { return order.id; }` method. Add `trackBy: trackByOrderId` to the `*ngFor` at line ~187 (order rows). *Same file as F4-T26 — implement both in one commit.*

- [ ] **F4-T28** | PR C | `frontend/src/app/features/orders/pages/order-form/order-form.component.ts`
  Add `trackByCustomerId(index: number, c: { id: number }): number { return c.id; }` method. Add `trackBy: trackByCustomerId` to the `*ngFor` at line ~111 (customer select options).

- [ ] **F4-T29** | PR C | `frontend/src/app/**/*.component.ts` (all 13 components)
  Verify `ChangeDetectionStrategy.OnPush` is declared in every `@Component` decorator. Document the verified list. No code changes expected (design ADR-6 confirms universal compliance).

- [ ] **F4-T30** | PR C | `frontend/src/app/app.routes.ts`
  Verify all feature routes use `loadComponent` or `loadChildren` (no static feature imports). Document the verified list. No code changes expected (design ADR-8 confirms universal lazy loading).

---

## Dependency Graph

```
F4-T01..T07 (PR A1)
    └─► F4-T08..T18 (PR A2)  [can run in parallel with A1]
            └─► F4-T19..T24 (PR B)  [requires A1+A2 merged]
                    └─► F4-T25..T30 (PR C)  [requires A merged; B optional but preferred]
```

**Parallelizable**: A1 and A2 can be written in parallel (they touch different test files).  
**Sequential gates**: B requires A (safety net), C requires A (smoke specs cover changed components).
