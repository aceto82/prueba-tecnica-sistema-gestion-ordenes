# Spec: Fase 4 — Hardening (Tests + Clean Code + Performance Audits)

## Purpose

Quality-gate spec for `fase-4`. No new product features. This spec describes the state the system MUST reach to be considered hardened: meaningful test coverage on both stacks, a Clean Code pass removing accumulated debt, and Angular performance compliance (OnPush, trackBy, lazy loading).

Three tracks in execution order: Tests → Clean Code → Audits.

---

## Track 1 — Backend Tests

### Requirement: OrderService Is Covered by Unit Tests

`OrderService` MUST be tested with JUnit 5 + Mockito. Repository dependencies MUST be mocked. Tests MUST cover: create order (happy path + validation errors), update status (all legal transitions + all illegal transitions), list with filters (status, dateRange, customerName), and username scoping (USER role sees only own orders; ADMIN sees all).

#### Scenario: Create order — happy path

- GIVEN a mocked `CustomerRepository` returns a customer for id `42` and total is `150.00`
- WHEN `OrderService.create(customerId=42, total=150.00, username="alice")` is called
- THEN the mocked `OrderRepository.save(...)` is called once
- AND the returned order has `status: PENDING` and `total: 150.00`

#### Scenario: Create order — customer not found

- GIVEN the mocked `CustomerRepository` returns `Optional.empty()` for the given customerId
- WHEN `OrderService.create(...)` is called
- THEN a `ResourceNotFoundException` (or equivalent) is thrown
- AND `OrderRepository.save(...)` is NEVER called

#### Scenario: Update status — legal transition

- GIVEN an order exists in `PENDING` status
- WHEN `OrderService.updateStatus(id, PROCESSING)` is called
- THEN the order is saved with `status: PROCESSING`

#### Scenario: Update status — illegal transition throws

- GIVEN an order exists in `COMPLETED` status
- WHEN `OrderService.updateStatus(id, PENDING)` is called
- THEN an `IllegalStateException` (or domain-specific exception) is thrown
- AND `OrderRepository.save(...)` is NEVER called

#### Scenario: List orders — USER role scopes by username

- GIVEN three orders exist, two belonging to user "alice" and one to user "bob"
- WHEN `OrderService.list(filters, username="alice", role=USER)` is called
- THEN only the two orders for "alice" are returned

#### Scenario: List orders — ADMIN role sees all

- GIVEN three orders exist belonging to different users
- WHEN `OrderService.list(filters, username="admin", role=ADMIN)` is called
- THEN all three orders are returned

---

### Requirement: CustomerService Is Covered by Unit Tests

`CustomerService` MUST be tested with JUnit 5 + Mockito. Tests MUST cover: create (happy path, duplicate email), list, get by id (found, not found), update (happy path, not found).

#### Scenario: Create customer — happy path

- GIVEN no customer exists with the given email
- WHEN `CustomerService.create(name, email)` is called
- THEN `CustomerRepository.save(...)` is called once
- AND the returned `CustomerDto` contains the persisted id, name, and email

#### Scenario: Create customer — duplicate email throws

- GIVEN a customer with email "a@b.com" already exists
- WHEN `CustomerService.create(name, email="a@b.com")` is called
- THEN a `DuplicateResourceException` (or equivalent) is thrown

#### Scenario: Get by id — not found

- GIVEN no customer with id `99` exists
- WHEN `CustomerService.getById(99)` is called
- THEN a `ResourceNotFoundException` is thrown

---

### Requirement: OrderRepository Is Covered by @DataJpaTest

`OrderRepository` custom queries MUST be tested against H2 in-memory using `@DataJpaTest`. Tests MUST cover: find by status, find by username (scoped query), and paginated retrieval.

#### Scenario: Find orders by status

- GIVEN two PENDING orders and one COMPLETED order are persisted in H2
- WHEN the repository is queried with `status=PENDING`
- THEN only the two PENDING orders are returned

#### Scenario: Find orders by username (scoped)

- GIVEN two orders for username "alice" and one for "bob"
- WHEN the repository is queried with `username="alice"`
- THEN only the two orders for "alice" are returned

#### Scenario: Paginated retrieval respects page size

- GIVEN five orders exist
- WHEN `findAll(Pageable.ofSize(2))` is called
- THEN the first page contains exactly 2 orders
- AND `totalElements` is 5

---

### Requirement: JWT and Auth Are Covered by Unit Tests

`JwtService` (or equivalent) MUST be tested with JUnit 5 (no Spring context required). Tests MUST cover: token generation (claims present, signature valid), token validation (valid token returns true, expired token returns false, tampered token returns false), and role extraction.

#### Scenario: Generated token contains expected claims

- GIVEN a username "alice" and role "USER"
- WHEN `JwtService.generateToken("alice", "USER")` is called
- THEN the decoded token contains `sub: "alice"` and a role claim
- AND the `exp` claim is in the future

#### Scenario: Expired token fails validation

- GIVEN a token whose `exp` is set to a past timestamp
- WHEN `JwtService.isValid(token)` is called
- THEN it returns `false`

#### Scenario: Tampered token fails validation

- GIVEN a valid token whose signature is altered by one character
- WHEN `JwtService.isValid(token)` is called
- THEN it returns `false`

#### Scenario: Role is correctly extracted from token

- GIVEN a token generated for role "ADMIN"
- WHEN `JwtService.extractRole(token)` is called
- THEN it returns `"ADMIN"`

---

### Requirement: Controllers Are Covered by @WebMvcTest

`OrderController` and `CustomerController` MUST be tested with `@WebMvcTest` + `MockMvc`. Service layer MUST be mocked with `@MockBean`. Tests MUST cover: authentication required (401 without JWT), role enforcement (403 when role is insufficient), valid request → 200/201, invalid body → 400.

#### Scenario: Protected endpoint returns 401 without JWT

- GIVEN no `Authorization` header
- WHEN `GET /api/orders` is called
- THEN MockMvc records HTTP 401

#### Scenario: ADMIN-only endpoint returns 403 for USER role

- GIVEN a user authenticated with `@WithMockUser(roles="USER")`
- WHEN `POST /api/customers` is called (ADMIN-only)
- THEN MockMvc records HTTP 403

#### Scenario: Valid order creation returns 201

- GIVEN `OrderService.create(...)` mock returns a valid `OrderDto`
- AND the caller is authenticated with `@WithMockUser(roles="USER")`
- WHEN `POST /api/orders` is called with valid JSON body
- THEN MockMvc records HTTP 201 with the `OrderDto` payload

#### Scenario: Invalid body returns 400 with RFC-7807

- GIVEN `@WithMockUser(roles="USER")` is present
- WHEN `POST /api/orders` is called with a body missing required fields
- THEN MockMvc records HTTP 400
- AND `Content-Type` is `application/problem+json`

---

## Track 1 — Frontend Tests

### Requirement: OrderStore Is Covered by Jest Tests

`OrderStore` MUST be tested with Jest. Tests MUST cover: initial signal state, `load()` sets orders signal and clears loading, `create()` appends to orders signal, `update()` replaces the order in the signal, and filter signals (status, search, page).

#### Scenario: Initial state

- GIVEN `OrderStore` is instantiated
- WHEN no action has been called
- THEN `orders()` is `[]`, `loading()` is `false`, `error()` is `null`

#### Scenario: load() populates orders signal

- GIVEN `HttpTestingController` is set up to return a page of 2 orders
- WHEN `store.load()` is called and the HTTP request is flushed
- THEN `orders()` contains 2 items
- AND `loading()` is `false`

#### Scenario: create() appends new order

- GIVEN `orders()` has 1 order
- WHEN `store.create(payload)` is called and POST is flushed with a new order
- THEN `orders()` has 2 items

#### Scenario: update() replaces existing order

- GIVEN `orders()` has order `{ id: 1, status: "PENDING" }`
- WHEN `store.update(1, { status: "PROCESSING" })` is called and PUT is flushed
- THEN `orders()` contains `{ id: 1, status: "PROCESSING" }` and length is unchanged

---

### Requirement: CustomerStore Is Covered by Jest Tests

`CustomerStore` MUST be tested with Jest. Tests MUST cover: load, create, update, and error state on HTTP failure.

#### Scenario: load() on HTTP error sets error signal

- GIVEN `HttpTestingController` is set up to return a 500 error
- WHEN `store.load()` is called and the request errors
- THEN `error()` is non-null
- AND `loading()` is `false`

---

### Requirement: AuthStore Is Covered by Jest Tests

`AuthStore` MUST be tested with Jest. Tests MUST cover: login (token stored in signal + localStorage), logout (signal cleared + localStorage cleared), `isAdmin` computed signal (true for ADMIN role, false for USER).

#### Scenario: Login stores token in signal and localStorage

- GIVEN `HttpTestingController` returns `{ token: "jwt.abc.xyz" }` for POST /api/auth/login
- WHEN `store.login(credentials)` is called and the request is flushed
- THEN `token()` equals `"jwt.abc.xyz"`
- AND `localStorage.getItem("auth_token")` equals `"jwt.abc.xyz"`

#### Scenario: Logout clears token

- GIVEN `token()` is non-null
- WHEN `store.logout()` is called
- THEN `token()` is `null`
- AND `localStorage.getItem("auth_token")` is `null`

#### Scenario: isAdmin returns true for ADMIN role

- GIVEN the decoded JWT contains role `"ADMIN"`
- WHEN `store.isAdmin()` is evaluated
- THEN it returns `true`

#### Scenario: isAdmin returns false for USER role

- GIVEN the decoded JWT contains role `"USER"`
- WHEN `store.isAdmin()` is evaluated
- THEN it returns `false`

---

### Requirement: HTTP Services Are Covered by Jest Tests with HttpClientTestingModule

`OrderService`, `CustomerService`, `DashboardService`, and `AuthService` MUST be tested using `HttpClientTestingModule` + `HttpTestingController`. Tests MUST verify: correct HTTP method, URL, query params, and request body for each operation; response is correctly mapped to the returned type; errors are propagated.

#### Scenario: OrderService.getOrders sends correct params

- GIVEN filters `{ status: "PENDING", page: 0, size: 10 }`
- WHEN `orderService.getOrders(filters)` is called
- THEN `HttpTestingController.expectOne(...)` matches `GET /api/orders?status=PENDING&page=0&size=10`

#### Scenario: JwtInterceptor attaches Authorization header

- GIVEN `AuthStore.token()` returns `"jwt.abc.xyz"`
- WHEN any HTTP request is made through the Angular HTTP client
- THEN the outgoing request contains `Authorization: Bearer jwt.abc.xyz`

#### Scenario: JwtInterceptor skips header when token is null

- GIVEN `AuthStore.token()` returns `null`
- WHEN an HTTP request is made
- THEN the outgoing request has no `Authorization` header

---

### Requirement: AuthGuard and RoleGuard Are Covered by Jest Tests

`AuthGuard` and `RoleGuard` (if present) MUST be tested. Tests MUST cover: unauthenticated user is redirected to `/login`, authenticated USER is allowed access to USER routes, authenticated USER is blocked from ADMIN-only routes.

#### Scenario: Unauthenticated user is redirected

- GIVEN `AuthStore.token()` returns `null`
- WHEN `AuthGuard.canActivate(...)` is called
- THEN the guard returns `UrlTree` pointing to `/login`

#### Scenario: Authenticated user passes AuthGuard

- GIVEN `AuthStore.token()` returns a non-null JWT
- WHEN `AuthGuard.canActivate(...)` is called
- THEN the guard returns `true`

---

## Track 2 — Clean Code

### Requirement: No Method Exceeds 20 Lines in Services and Controllers

Every method in `application/` services and `infrastructure/web/` controllers MUST NOT exceed 20 lines. Methods exceeding this limit MUST be extracted into private helper methods with descriptive names.

#### Scenario: Method length compliance

- GIVEN any service or controller method
- WHEN the lines are counted (excluding blank lines and braces-only lines)
- THEN the count is ≤ 20

---

### Requirement: No Magic Strings or Numbers

Named constants MUST replace inline string literals for status values, JWT claim keys, localStorage keys, and HTTP path segments used in more than one place. No inline `any` type annotation MUST appear in frontend TypeScript files without a justifying comment.

#### Scenario: Magic string replaced by constant

- GIVEN a constant such as `AUTH_TOKEN_KEY = "auth_token"` is defined
- WHEN any code reads or writes the localStorage key
- THEN it references the constant, not the raw string literal

---

### Requirement: Signals in Stores Are Always ReadOnly at Public API

Every public signal property exposed by `OrderStore`, `CustomerStore`, and `AuthStore` MUST be declared with `.asReadonly()`. Writable signal references MUST be private.

#### Scenario: Public signal is readonly

- GIVEN `OrderStore` is inspected
- WHEN each public property is checked
- THEN none of them is a writable `WritableSignal<T>`; all are `Signal<T>` (readonly)

---

### Requirement: Dead Code Is Removed

Unused imports, unused private methods, and commented-out code blocks MUST be removed. ESLint `no-unused-vars` and `@typescript-eslint/no-explicit-any` MUST pass with zero violations in frontend. Java compiler warnings for unused variables MUST be zero in `application/` and `infrastructure/web/`.

---

## Track 3 — Angular Performance Audits

### Requirement: All Components Use ChangeDetectionStrategy.OnPush

Every `@Component` class in `frontend/src/app/` MUST declare `changeDetection: ChangeDetectionStrategy.OnPush`. No component MUST use the default change detection strategy.

#### Scenario: OnPush declared on all components

- GIVEN any `.component.ts` file under `src/app/`
- WHEN the `@Component` decorator is inspected
- THEN `changeDetection: ChangeDetectionStrategy.OnPush` is present

#### Scenario: No rendering regression after adding OnPush

- GIVEN `ChangeDetectionStrategy.OnPush` is applied to a component that previously lacked it
- WHEN the component is rendered in the running application
- THEN all data-bound template expressions update correctly on signal changes and async pipe emissions

---

### Requirement: All *ngFor Directives Have a Class-Method trackBy

Every `*ngFor` usage in component templates MUST include a `trackBy` attribute pointing to a method defined on the component class. Inline arrow functions MUST NOT be used as trackBy values.

#### Scenario: trackBy method is present on each *ngFor

- GIVEN any template file containing `*ngFor`
- WHEN the directive attribute is inspected
- THEN `trackBy` is present and its value is a reference to a class method (e.g. `trackById`)

#### Scenario: trackBy method is defined on the component class

- GIVEN a component with `trackById` referenced in the template
- WHEN the component class is inspected
- THEN a method `trackById(index: number, item: { id: number }): number` is defined
- AND it returns `item.id`

#### Scenario: No inline arrow function used as trackBy

- GIVEN any template file containing `*ngFor`
- WHEN the `trackBy` value is inspected
- THEN it is NOT an inline arrow function (e.g. `trackBy: (i, o) => o.id` is PROHIBITED)

---

### Requirement: All Feature Routes Are Lazy-Loaded

Every feature route in `app.routes.ts` and feature-level route files MUST use `loadComponent` or `loadChildren`. No feature component or feature module MUST be eagerly imported in the route definition files.

#### Scenario: Production build produces separate chunks per feature

- GIVEN `npm run build --configuration production` completes
- WHEN the output `dist/` directory is inspected
- THEN separate JavaScript chunks exist for `auth`, `orders`, `customers`, and `dashboard` features
- AND the initial bundle does NOT contain feature component code

#### Scenario: No eager static import of feature components in route files

- GIVEN `app.routes.ts` and any feature route files
- WHEN the imports at the top of the file are inspected
- THEN no feature-level component or module is imported statically; all use dynamic `import()`

---

## Coverage Targets

| Area | Metric | Minimum Target |
|------|--------|----------------|
| `backend/application/` | Line coverage | ≥ 75% |
| `backend/infrastructure/web/` | Line coverage | ≥ 70% |
| `backend/infrastructure/persistence/` | Line coverage | ≥ 70% |
| `frontend/core/services/` | Statement coverage | ≥ 70% |
| `frontend/features/**/store` | Statement coverage | ≥ 70% |
| `frontend/core/guards/` | Statement coverage | ≥ 70% |
| `frontend/core/interceptors/` | Statement coverage | ≥ 70% |

Coverage MUST be measured on business logic paths only. Getters, DTOs, and `@Module` boilerplate are excluded from enforcement.
