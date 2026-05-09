# Tasks: Fase 2 — Orders & Customers CRUD (Backend + Frontend)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed files | ~45–52 |
| Estimated changed lines | 1 400 – 1 800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR A → PR B → PR C → PR D |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| A | Backend domain + persistence + services + tests | PR A | base = feature/fase-2 |
| B | Backend controllers + DTOs + exception handling + controller tests | PR B | base = PR A branch |
| C | Frontend customers module (simpler, no RxJS) | PR C | base = PR B branch |
| D | Frontend orders module (complex, RxJS, pagination) | PR D | base = PR C branch |

---

## Phase 1: Backend Domain & Ports

- [ ] F2-T01 — Add `canTransitionTo(OrderStatus next): boolean` to `OrderStatus` enum (all 4 legal edges; COMPLETED/CANCELLED → false always). Ref: REQ-O5. Effort: S. Accept: unit test green for all 12 pair combos.
- [ ] F2-T02 — Add `transitionTo(OrderStatus next)` method to `Order` domain entity; throws `InvalidOrderStatusTransitionException(currentStatus, next)`. Ref: REQ-O4, REQ-O5. Effort: S. Accept: calling with illegal next throws; legal next updates `this.status`.
- [ ] F2-T03 — Create `InvalidOrderStatusTransitionException` in `domain/exception/`. Fields: `OrderStatus from`, `OrderStatus to`. Ref: REQ-O5. Effort: S. Accept: class exists, extends `RuntimeException`.
- [ ] F2-T04 — Create `CustomerRepository` port in `domain/port/CustomerRepository.java` — methods: `save`, `findById`, `findAll(Pageable)`, `existsByEmail`, `existsByEmailAndIdNot`. Ref: REQ-C1–C4. Effort: S. Accept: interface compiles.
- [ ] F2-T05 — Create `OrderRepository` port in `domain/port/OrderRepository.java` — methods: `save`, `findById`, `findAll(Specification, Pageable)`. Ref: REQ-O1–O4. Effort: S. Accept: interface compiles.

---

## Phase 2: Backend Persistence Layer

- [ ] F2-T06 — Migrate `OrderJpaEntity`: drop raw `Long customerId` field, add `@ManyToOne(fetch = LAZY) @JoinColumn(name = "customer_id") CustomerJpaEntity customer`. Ref: design §2. Effort: S. Accept: `OrderJpaEntity` compiles; no schema change needed (`customer_id` column exists).
- [ ] F2-T07 — Add `@NamedEntityGraph(name = "order.customer", attributeNodes = @NamedAttributeNode("customer"))` to `OrderJpaEntity`. Ref: design §1. Effort: S. Accept: annotation present.
- [ ] F2-T08 — Update `OrderJpaRepository`: extend `JpaSpecificationExecutor<OrderJpaEntity>`; add `@EntityGraph("order.customer")` override on `findAll(Specification, Pageable)`. Ref: REQ-O3. Effort: S. Accept: method override compiles and Hibernate logs single join query.
- [ ] F2-T09 — Create `OrderSpecifications` class in `infrastructure/persistence/specification/` with static `withFilters(status, dateFrom, dateTo, customerName)` building AND-composed predicates. Ref: REQ-O3. Effort: M. Accept: each filter predicate tested independently with `@DataJpaTest`.
- [ ] F2-T10 — Update `OrderMapper.toDomain` and `toEntity`: replace raw `customerId` with `customer.getId()` on read; use `entityManager.getReference(CustomerJpaEntity.class, customerId)` on write. Ref: design §2. Effort: M. Accept: round-trip test passes without extra SELECT.
- [ ] F2-T11 — Create `CustomerJpaRepository` in `infrastructure/persistence/repository/` (extends `JpaRepository<CustomerJpaEntity, Long>`). Ref: REQ-C1–C4. Effort: S. Accept: interface compiles; Spring Boot auto-creates bean.
- [ ] F2-T12 — Create `CustomerRepositoryAdapter` implementing `CustomerRepository` port using `CustomerJpaRepository` and `CustomerMapper`. Ref: REQ-C1–C4. Effort: M. Accept: adapter satisfies port; `existsByEmail` delegates correctly.
- [ ] F2-T13 — Create `OrderRepositoryAdapter` implementing `OrderRepository` port using `OrderJpaRepository` and `OrderSpecifications`. Ref: REQ-O1–O4. Effort: M. Accept: `findAll(spec, pageable)` delegates to `OrderJpaRepository.findAll(spec, pageable)`.
- [ ] F2-T14 — Update `CustomerMapper`: add `toDomain(CustomerJpaEntity)` and `toEntity(Customer)` static methods (mirror `OrderMapper` pattern). Ref: design. Effort: S. Accept: mapper handles null-id on new entity.

---

## Phase 3: Backend Application Services

- [ ] F2-T15 — Create `CustomerService` in `application/service/`: `list(Pageable)`, `findById(Long)`, `create(Customer)`, `update(Long, Customer)`. Throws `EntityNotFoundException` on missing id; throws `DuplicateEmailException` on conflict. Ref: REQ-C1–C4. Effort: M. Accept: unit tests with Mockito for all four methods.
- [ ] F2-T16 — Create `OrderService` in `application/service/`: `create(CreateOrderCommand)`, `findById(Long)`, `list(OrderFilterParams, Pageable)`, `updateStatus(Long, OrderStatus)`, `updateTotal(Long, BigDecimal)`. Validates customer exists; calls `order.transitionTo(next)` for status; rejects total update if order not PENDING. Ref: REQ-O1–O5. Effort: L. Accept: unit tests for all REQ-O5 legal/illegal transitions + not-found paths.

---

## Phase 4: Backend DTOs & Controllers

- [ ] F2-T17 — Create DTOs in `infrastructure/web/dto/`: `CustomerSummary(id, name)`, `CustomerResponse(id, name, email)`, `CreateCustomerRequest(@NotBlank name, @NotBlank @Email email)`, `OrderListItem(id, status, total, createdAt, customer: CustomerSummary)`, `OrderDetailDto(id, status, total, createdAt, customer: CustomerSummary)`, `CreateOrderRequest(@NotNull @Positive customerId, @NotNull @DecimalMin("0.01") total)`, `UpdateOrderRequest(status, total)`. Ref: REQ-C1–C4, REQ-O1–O4. Effort: M. Accept: all records compile; `@Valid` annotations present.
- [ ] F2-T18 — Create `CustomerController` at `infrastructure/web/controller/CustomerController.java`: `GET /api/customers` (paginated), `GET /api/customers/{id}`, `POST /api/customers` (201), `PUT /api/customers/{id}` (200). Ref: REQ-C1–C4. Effort: M. Accept: `@WebMvcTest` happy-path for all 4 endpoints returns correct status.
- [ ] F2-T19 — Create `OrderController` at `infrastructure/web/controller/OrderController.java`: `POST /api/orders` (201), `GET /api/orders/{id}`, `GET /api/orders` (paginated + filters), `PUT /api/orders/{id}`. Ref: REQ-O1–O4. Effort: M. Accept: `@WebMvcTest` happy-path for all 4 endpoints returns correct status.
- [ ] F2-T20 — Extend `GlobalExceptionHandler`: `InvalidOrderStatusTransitionException` → 400 RFC-7807 (include `from`, `to`); `DuplicateEmailException` → 409 RFC-7807; `EntityNotFoundException` → 404 RFC-7807. Ref: REQ-O5, REQ-C3. Effort: S. Accept: handler methods return correct `ProblemDetail` instances.
- [ ] F2-T21 — Create `DuplicateEmailException` in `domain/exception/`. Ref: REQ-C3. Effort: S. Accept: class exists, extends `RuntimeException`.
- [ ] F2-T22 — Update `SecurityConfig`: permit `GET|POST /api/customers/**` and `GET|POST|PUT /api/orders/**` for authenticated users. Ref: REQ-C1, REQ-O1. Effort: S. Accept: unauthenticated GET /api/customers returns 401.

---

## Phase 5: Backend Tests

- [ ] F2-T23 — Unit tests for `OrderStatus.canTransitionTo`: all 12 pair combos (4 legal, 8 illegal). Ref: REQ-O5. Effort: S. Accept: 12 assertions, all green.
- [ ] F2-T24 — Unit tests for `Order.transitionTo`: legal transitions update status; illegal throw `InvalidOrderStatusTransitionException`. Ref: REQ-O5. Effort: S. Accept: all test cases green.
- [ ] F2-T25 — `@DataJpaTest` for `OrderSpecifications`: seed 3 orders with different statuses/dates/customers; verify each filter and their combination. Ref: REQ-O3. Effort: M. Accept: no N+1 via Hibernate statistics counter.
- [ ] F2-T26 — Unit tests for `CustomerService` with Mockito: list, findById (found/not-found), create (ok/duplicate email), update (ok/not-found/email conflict). Ref: REQ-C1–C4. Effort: M. Accept: all 8 test cases green.
- [ ] F2-T27 — Unit tests for `OrderService` with Mockito: create (ok/customer-not-found/bad-total), findById (found/not-found), all REQ-O5 legal/illegal transitions, total-update-on-non-pending. Ref: REQ-O1–O5. Effort: M. Accept: all test cases green.
- [ ] F2-T28 — `@WebMvcTest` for `CustomerController`: 4 happy paths + 400 on missing field + 404 on unknown id + 409 on duplicate email. Ref: REQ-C1–C4. Effort: M. Accept: 7 test cases green.
- [ ] F2-T29 — `@WebMvcTest` for `OrderController`: 4 happy paths + 400 on bad total + 404 on unknown id + 400 on illegal status transition. Ref: REQ-O1–O5. Effort: M. Accept: 7 test cases green.

---

## Phase 6: Frontend Routing Update

- [x] F2-T30 — Replace `loadComponent` in `app.routes.ts` with `loadChildren` for `orders` and `customers` paths. Ref: REQ-F1, REQ-F3, design §10. Effort: S. Accept: app still bootstraps; `router-outlet` renders.
- [x] F2-T31 — Create `features/orders/orders.routes.ts` exporting `ORDER_ROUTES` with `''` (list), `new` (form), `:id` (detail), `:id/edit` (form) using `loadComponent`. Ref: REQ-F1, REQ-F2. Effort: S. Accept: navigating to `/orders` renders `OrderListComponent` placeholder.
- [x] F2-T32 — Create `features/customers/customers.routes.ts` exporting `CUSTOMER_ROUTES` with `''` (list), `new` (form), `:id/edit` (form). Ref: REQ-F3. Effort: S. Accept: navigating to `/customers` renders `CustomersListComponent` placeholder.

---

## Phase 7: Frontend Models & HTTP Services

- [x] F2-T33 — Create `core/models/customer.model.ts` (`Customer`, `CustomerSummary`, `CreateCustomerRequest`, `Page<T>` generic) and `core/models/order.model.ts` (`Order`, `OrderListItem`, `OrderDetail`, `CreateOrderRequest`, `UpdateOrderRequest`, `OrderStatus`). Ref: design §4, §8. Effort: S. Accept: interfaces/types export correctly.
- [x] F2-T34 — Create `core/services/customer.service.ts`: thin `HttpClient` wrapper — `list(page, size)`, `findById(id)`, `create(req)`, `update(id, req)`. Ref: REQ-C1–C4. Effort: S. Accept: each method returns typed `Observable`; no state.
- [x] F2-T35 — Create `core/services/order.service.ts`: thin `HttpClient` wrapper — `list(params)`, `findById(id)`, `create(req)`, `update(id, req)`. Builds `HttpParams` from optional filter fields. Ref: REQ-O1–O4. Effort: S. Accept: list method only adds params present in the input object.

---

## Phase 8: Frontend Stores

- [x] F2-T36 — Create `features/customers/customer.store.ts` mirroring `AuthStore` pattern: signals `customers`, `selectedCustomer`, `loading`, `error`, `currentPage`, `totalPages`; methods `load(page)`, `findById(id)`, `create(req)`, `update(id, req)`. Ref: REQ-F3. Effort: M. Accept: Jasmine test verifies `load` sets `customers` signal and `loading` goes false on complete.
- [x] F2-T37 — Create `features/orders/order.store.ts`: signals as per design §8; methods `load(patch)`, `findById(id)`, `create(req)`, `updateStatus(id, status)`. `load` merges patch into `_params` signal, calls `orderService.list`. Ref: REQ-F1, design §8. Effort: M. Accept: Jasmine test verifies `load` with `status` patch sends correct params.

---

## Phase 9: Frontend Customers Module

- [x] F2-T38 — Create `features/customers/pages/customer-list/customer-list.component.ts`: standalone, OnPush; renders table from `CustomerStore.customers`; pagination controls wired to `store.load(page)`. Ref: REQ-F3. Effort: M. Accept: fakeAsync test verifies page change calls `store.load(1)`.
- [x] F2-T39 — Create `features/customers/pages/customer-form/customer-form.component.ts`: standalone, OnPush; reactive form with `name` (required) + `email` (required, Validators.email); on `ngOnInit` if `:id` param present → load and patch; submit calls `store.create` or `store.update`; navigates to `/customers` on success. Ref: REQ-F3 (create/edit scenarios). Effort: M. Accept: Jasmine test: submit with invalid email does not call `store.create`; valid submit calls `store.create` and router navigates.

---

## Phase 10: Frontend Orders Module

- [ ] F2-T40 — Create `features/orders/pages/order-list/order-list.component.ts`: standalone, OnPush; table from `OrderStore.orders`; `Subject<string>` + `debounceTime(300) + distinctUntilChanged() + switchMap` for search; status `<select>` calls `store.load({status, page:0})` directly; pagination wired. Ref: REQ-F1. Effort: L. Accept: fakeAsync test: two rapid keystrokes → only one HTTP call after 300 ms tick.
- [ ] F2-T41 — Create `features/orders/pages/order-form/order-form.component.ts`: standalone, OnPush; reactive form with `customerId` (required) + `total` (required, min 0.01); on edit mode load order and patch; submit calls `store.create` or `store.updateStatus`/total; navigate on success. Ref: REQ-F2. Effort: M. Accept: Jasmine: total ≤ 0 keeps form invalid; valid submit calls correct store method.
- [ ] F2-T42 — Create `features/orders/pages/order-detail/order-detail.component.ts`: standalone, OnPush; loads order via `store.findById(id)` on init; displays `customer.name`, `status`, `total`, `createdAt`. Ref: REQ-O2. Effort: S. Accept: test verifies `findById` called with route param id.

---

## Phase 11: Frontend Tests

- [ ] F2-T43 — Jasmine + `HttpTestingController` tests for `CustomerService`: verify URL, method, and typed response for `list`, `findById`, `create`, `update`. Ref: REQ-C1–C4. Effort: M. Accept: 4 test cases green; `TestBed.verify()` passes.
- [ ] F2-T44 — Jasmine + `HttpTestingController` tests for `OrderService`: verify URL construction with optional params for `list`; verify method + payload for `create`/`update`. Ref: REQ-O1–O4. Effort: M. Accept: 4 test cases green.
- [ ] F2-T45 — Jasmine tests for `CustomerStore`: `load` patches signals; `create` appends new item; `update` replaces item; error signal set on HTTP failure. Ref: REQ-F3. Effort: M. Accept: 4 test cases green.
- [ ] F2-T46 — Jasmine tests for `OrderStore`: `load` with different patches merges params correctly; status filter param included when set; page param updates. Ref: REQ-F1. Effort: M. Accept: 3 test cases green.

---

## Phase 12: Integration Smoke

- [ ] F2-T47 — End-to-end smoke: start app locally; create a customer via `POST /api/customers`; create an order for that customer; list orders with `customerName` filter; transition order PENDING→PROCESSING; verify 400 on PROCESSING→PENDING. Ref: REQ-C3, REQ-O1, REQ-O3, REQ-O5. Effort: M. Accept: all 5 HTTP calls return expected status codes.
