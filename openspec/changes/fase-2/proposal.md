# Proposal: Fase 2 — Orders & Customers CRUD (Backend + Frontend)

## Intent

Fase 1 delivered the foundation (hexagonal scaffold, JWT auth, layout shell). The application has no business value yet — placeholder feature pages, no Order/Customer use cases, no API integration. Fase 2 makes the OMS functional: full Orders and Customers CRUD on the backend, paginated/filterable list endpoints, status-transition rules, and Angular feature modules wired to real APIs. Without this phase the project does not satisfy the prueba técnica requirements.

## Scope

### In Scope

- **Backend Customers CRUD**: `CustomerRepository` port, adapter, `CustomerService`, `CustomerController` (`/api/customers`) — create, list, detail, update.
- **Backend Orders CRUD**: `OrderRepository` port, adapter, `OrderService`, `OrderController` (`/api/orders`) — create, list, detail, update, cancel.
- **Order list endpoint**: pagination (`page`, `size`, `sort`), filter by `status` and date range (`from`, `to`), search by customer name. Returns `Page<OrderListItemDto>` with embedded `CustomerSummary`.
- **Order status transitions**: enforced in `OrderService` — `PENDING -> PROCESSING -> COMPLETED`; `PENDING|PROCESSING -> CANCELLED`. Invalid transitions raise a domain exception → 409.
- **DTOs + mappers** for request/response per resource (no JPA leakage to controllers).
- **Frontend Customers module**: `customers-list/`, `customer-form/`, `customer.store.ts`, HTTP service.
- **Frontend Orders module**: `orders-list/` (table + filters + pagination + search with `debounceTime(300)+switchMap`), `order-detail/`, `order-form/` (create/edit), `order.store.ts`, HTTP service.
- **Wire feature modules to real backend** through `jwtInterceptor`; remove placeholders.

### Out of Scope

- Reporting, analytics, exports, dashboards beyond the existing placeholder.
- Order line items / products catalog (Order remains single-item per Fase 1 model).
- Real-time updates (WebSocket / SSE).
- Role-based authorization beyond authenticated access (RBAC deferred).
- Soft-delete infrastructure (we use `CANCELLED` status instead — see Approach #2).
- E2E tests (unit + integration only this phase).

## Capabilities

### New Capabilities

- `customers-management`: backend CRUD endpoints + frontend module for managing customers.
- `orders-management`: backend CRUD + status transitions + paginated/filtered list + frontend module for managing orders.

### Modified Capabilities

- None. Fase 1 capabilities (`auth`, `app-shell`) are unchanged.

## Approach

Extend the hexagonal layout established in Fase 1 — same shape per resource: domain entity (already exists) → port (`domain/port/`) → adapter (`infrastructure/persistence/`) → service (`application/service/`) → controller (`infrastructure/web/controller/`) → DTOs (`infrastructure/web/dto/`).

Key decisions:

1. **Order list/detail responses embed `CustomerSummary`** (`id`, `name`, `email`) — avoids N+1 round-trips from the frontend; detail view does not need a second fetch.
2. **Removal = `CANCELLED` status, not soft-delete**. Aligns with the domain (orders have lifecycle), keeps audit trail, avoids `deletedAt` plumbing. `DELETE /api/orders/{id}` transitions status to `CANCELLED`.
3. **Pagination via Spring `Pageable`** (`page`, `size`, `sort`). Standard, well-tested, integrates with `JpaRepository`. Frontend sends `?page=0&size=20&sort=createdAt,desc`.
4. **`CustomerRepository` port lives in `domain/port/`** — same pattern as `UserRepository`. Consistency over micro-optimization.
5. **Status transitions enforced in `OrderService`** via a private `assertValidTransition(current, next)` method; controller stays thin.
6. **Filtering** via JPA Specifications (`Specification<OrderJpaEntity>`) composed from query params — flexible without a query DSL.
7. **Frontend stores** mirror `AuthStore`: signals-based state (`items`, `loading`, `error`, `pagination`), actions return observables for the components to subscribe. OnPush + standalone everywhere.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/.../domain/port/` | New | `OrderRepository`, `CustomerRepository` interfaces |
| `backend/.../application/service/` | New | `OrderService`, `CustomerService` |
| `backend/.../infrastructure/persistence/` | New | `OrderRepositoryAdapter`, `CustomerRepositoryAdapter` + Specifications |
| `backend/.../infrastructure/web/controller/` | New | `OrderController`, `CustomerController` |
| `backend/.../infrastructure/web/dto/` | New | Request/response DTOs + `CustomerSummary` |
| `backend/.../config/SecurityConfig.java` | Modified | Permit `/api/orders/**` and `/api/customers/**` only for authenticated users |
| `backend/.../config/GlobalExceptionHandler.java` | Modified | Map domain exceptions (NotFound → 404, InvalidTransition → 409) |
| `frontend/src/app/features/orders/` | Replaced | Placeholder → full module (list, detail, form, store, service) |
| `frontend/src/app/features/customers/` | Replaced | Placeholder → full module (list, form, store, service) |
| `frontend/src/app/app.routes.ts` | Modified | Lazy routes for new sub-pages |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Status-transition logic leaking into controller/frontend | Medium | Unit tests in `OrderService` covering every legal/illegal pair; controller has no `if status == ...` |
| N+1 on Order list (lazy `Customer` fetch) | Medium | Use JPA `@EntityGraph` or `JOIN FETCH` in adapter; assert with SQL log in test |
| Filter combinatorial explosion in adapter | Low | JPA Specifications keep each predicate isolated and composable |
| Frontend store divergence between Orders and Customers | Low | Define a shared store shape early; both stores follow `AuthStore` template |
| Search debounce missing → request storms | Medium | `debounceTime(300) + switchMap` is mandatory; document in store |
| Scope creep into RBAC or line items | Medium | Out-of-scope list above; defer to Fase 3 |

## Rollback Plan

Each backend resource and each frontend feature is additive. Rollback strategies:

- **Backend**: revert the per-resource commits (Customers first, Orders second) — auth and Fase 1 endpoints remain untouched. DB schema for `customers` and `orders` tables already exists from Fase 1, so no migration rollback needed.
- **Frontend**: feature modules are isolated under `features/orders/` and `features/customers/`. Revert restores the placeholder components; `app.routes.ts` reverts to the placeholder routes.
- Branch is `feature/fase-2`; if the PR is rejected, `main` is unaffected.

## Dependencies

- Fase 1 merged (hexagonal scaffold, JWT auth, JPA entities, layout shell). Confirmed.
- No new third-party libraries on the backend (Spring Data + JPA Specifications are already on classpath).
- No new third-party libraries on the frontend (Angular 18.2 Signals + RxJS suffice).

## Success Criteria

- [ ] All `/api/customers` and `/api/orders` endpoints respond per the spec, authenticated via JWT.
- [ ] Order status transitions reject invalid moves with HTTP 409 + RFC-7807 problem detail.
- [ ] Order list endpoint returns paginated, filtered, searchable results with `CustomerSummary` embedded.
- [ ] Frontend Orders list shows server-side paginated rows; filters and search work without request storms.
- [ ] Frontend Orders create/edit/cancel flows work end-to-end against the real backend.
- [ ] Frontend Customers list + create/edit flow works end-to-end.
- [ ] Unit tests cover `OrderService` transition logic; integration tests cover controllers.
- [ ] No JPA entities leak through controllers (only DTOs cross the boundary).
