# Fase 5 — Specification

## Purpose

Close the tech debt flagged by the Fase 4 verify-report and migrate all Angular
templates from structural directives to Angular 17+ built-in control flow. No
new user-facing functionality is introduced.

---

## Track 1 — Tech Debt

---

### Requirement: TD-1 — Deterministic JWT Tampered-Signature Test

The test `isTokenValid_withTamperedSignature_returnsFalse` in `JwtServiceTest`
MUST always return the same result across successive runs without any external
side-effects or tolerances.

The tamper operation MUST alter enough characters of the Base64URL signature
segment that the probability of a round-trip collision is effectively zero (i.e.,
MUST NOT alter only the last character of the signature).

The assertion MUST remain `assertFalse(...)` — it MUST NOT be weakened, skipped,
or wrapped in a flaky-test annotation.

#### Scenario: Valid token has signature tampered at multiple positions

- GIVEN a valid JWT signed with the application secret
- WHEN the signature segment is altered at 8 or more leading characters (producing a value that differs from the original after Base64URL decode)
- THEN `jwtService.isTokenValid(tamperedToken, userDetails)` MUST return `false`
- AND the assertion MUST pass on every run (zero flakiness)

#### Scenario: Original token is still valid before tampering

- GIVEN a valid JWT signed with the application secret
- WHEN `jwtService.isTokenValid(originalToken, userDetails)` is called
- THEN the result MUST be `true`

---

### Requirement: TD-2 — jest-preset-angular Setup Entrypoint

`frontend/setup-jest.ts` MUST NOT import from `jest-preset-angular/setup-jest`
or `jest-preset-angular/setup-jest.js` (both deprecated in v14).

`frontend/setup-jest.ts` MUST use the `setupZoneTestEnv` function from
`jest-preset-angular/setup-env/zone` as the sole setup mechanism.

All existing frontend test suites MUST continue to pass after this change with
no modifications to test files.

#### Scenario: Setup file uses the recommended entrypoint

- GIVEN `frontend/setup-jest.ts`
- WHEN the file is inspected
- THEN it MUST NOT contain any import from `jest-preset-angular/setup-jest` or `jest-preset-angular/setup-jest.js`
- AND it MUST contain `import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone'`
- AND it MUST call `setupZoneTestEnv()`

#### Scenario: Existing frontend tests pass after migration

- GIVEN the updated `setup-jest.ts`
- WHEN `npm test` is executed in `frontend/`
- THEN all previously-passing test suites MUST pass
- AND no new deprecation warnings for the setup entrypoint MUST appear in the output

---

### Requirement: TD-3 — DELETE /api/orders/{id} Endpoint

The system MUST expose a `DELETE /api/orders/{id}` endpoint.

The endpoint MUST be accessible only to authenticated users with `ROLE_ADMIN`.

The endpoint MUST be annotated with `@PreAuthorize("hasRole('ADMIN')")` as
defense-in-depth in addition to the `SecurityConfig` rule.

#### Scenario: Admin deletes an existing order

- GIVEN an authenticated user with `ROLE_ADMIN`
- AND an order with the given `id` exists in the system
- WHEN `DELETE /api/orders/{id}` is called
- THEN the system MUST delete the order
- AND the response MUST be `204 No Content` with an empty body

#### Scenario: Admin attempts to delete a non-existent order

- GIVEN an authenticated user with `ROLE_ADMIN`
- AND no order with the given `id` exists in the system
- WHEN `DELETE /api/orders/{id}` is called
- THEN the response MUST be `404 Not Found`

#### Scenario: Non-admin user attempts to delete an order

- GIVEN an authenticated user with `ROLE_USER` (not ADMIN)
- WHEN `DELETE /api/orders/{id}` is called
- THEN the response MUST be `403 Forbidden`
- AND the order MUST NOT be deleted

#### Scenario: Unauthenticated request to delete an order

- GIVEN a request with no JWT token
- WHEN `DELETE /api/orders/{id}` is called
- THEN the response MUST be `401 Unauthorized`
- AND the order MUST NOT be deleted

#### Scenario: OrderService unit test — delete existing order

- GIVEN a mock `OrderRepository` that confirms the order exists
- WHEN `orderService.deleteOrder(id)` is called
- THEN the repository's delete method MUST be invoked once with the given `id`
- AND no exception MUST be thrown

#### Scenario: OrderService unit test — delete non-existent order

- GIVEN a mock `OrderRepository` where `existsById(id)` returns `false`
- WHEN `orderService.deleteOrder(id)` is called
- THEN an `OrderNotFoundException` MUST be thrown

---

## Track 2 — Angular Control Flow Migration

---

### Requirement: CF-1 — @if replaces *ngIf in all templates

No template file in `frontend/src/app/` MUST contain `*ngIf` after migration.

Every conditional block previously expressed as `*ngIf` MUST be expressed using
`@if (condition) { } @else { }` syntax.

Components MUST remove `NgIf` from their `imports` array after migration.

#### Scenario: Template has no *ngIf directives

- GIVEN any `.html` template or inline template in `frontend/src/app/`
- WHEN the file is inspected for `*ngIf`
- THEN zero occurrences MUST be found

#### Scenario: Conditional with else branch renders correctly

- GIVEN a component whose template uses `@if (condition) { … } @else { … }`
- WHEN `condition` is `true`
- THEN the if-block MUST be rendered and the else-block MUST NOT be rendered
- AND WHEN `condition` is `false`
- THEN the else-block MUST be rendered and the if-block MUST NOT be rendered

#### Scenario: NgIf removed from component imports

- GIVEN any standalone component that previously imported `NgIf`
- WHEN the component's `imports` array is inspected after migration
- THEN `NgIf` MUST NOT appear in it

---

### Requirement: CF-2 — @for replaces *ngFor in all templates

No template file in `frontend/src/app/` MUST contain `*ngFor` after migration.

Every iteration block previously expressed as `*ngFor` MUST be expressed using
`@for (item of collection; track expr) { }` syntax.

The `track` expression MUST use `item.id` for entity collections and `item`
directly for primitive (string/number) collections. `track $index` MUST NOT be
used when identity tracking is available.

`trackBy` class methods (`trackById`, `trackByStatus`, etc.) that exist solely
to support `*ngFor` MUST be removed from the component class after migration.

Components MUST remove `NgFor` from their `imports` array after migration.

#### Scenario: Template has no *ngFor directives

- GIVEN any `.html` template or inline template in `frontend/src/app/`
- WHEN the file is inspected for `*ngFor`
- THEN zero occurrences MUST be found

#### Scenario: Entity list uses track item.id

- GIVEN a `@for` loop over an array of entity objects (orders, customers, etc.)
- WHEN the `track` expression is inspected
- THEN it MUST be `track item.id` (or equivalent property name) — NOT `track $index`

#### Scenario: Primitive list uses track item

- GIVEN a `@for` loop over an array of strings or numbers (e.g. status values)
- WHEN the `track` expression is inspected
- THEN it MUST use the primitive value directly (e.g. `track s`) — NOT `track $index`

#### Scenario: trackBy class methods removed

- GIVEN any component class that previously defined a `trackById` or `trackByStatus` method
- WHEN the class source is inspected after migration
- THEN those methods MUST NOT exist

#### Scenario: NgFor removed from component imports

- GIVEN any standalone component that previously imported `NgFor`
- WHEN the component's `imports` array is inspected after migration
- THEN `NgFor` MUST NOT appear in it

---

### Requirement: CF-3 — CommonModule cleanup

Components that imported `CommonModule` solely to access `NgIf` or `NgFor`
MUST remove `CommonModule` from their `imports` array entirely after migration.

`CommonModule` MAY be retained only if the template uses at least one Angular
pipe that it provides (e.g. `DatePipe`, `DecimalPipe`, `CurrencyPipe`,
`AsyncPipe`, `JsonPipe`, `SlicePipe`). In that case, `CommonModule` MUST be
replaced with the specific pipe class import(s) — NOT left as a catch-all.

`dashboard.component.ts` MUST replace `CommonModule` with `DecimalPipe`
directly (the `| number` pipe requires it) and MUST NOT retain `CommonModule`.

#### Scenario: Component that used CommonModule only for NgIf/NgFor removes it

- GIVEN a standalone component that imported `CommonModule` and whose template uses no Angular pipes
- WHEN the component's `imports` array is inspected after migration
- THEN `CommonModule` MUST NOT appear in it

#### Scenario: Dashboard component imports DecimalPipe directly

- GIVEN `dashboard.component.ts`
- WHEN its `imports` array is inspected
- THEN `DecimalPipe` MUST be present
- AND `CommonModule` MUST NOT be present

#### Scenario: Pipe functionality preserved after CommonModule removal

- GIVEN a component whose template uses `| number` (or another specific pipe)
- WHEN the template is rendered
- THEN the pipe MUST format the value correctly
- AND no "pipe not found" error MUST appear in the browser console or test output
