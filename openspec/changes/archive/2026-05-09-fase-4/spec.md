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
