# Proposal: Fase 3 — Dashboard + RBAC

## Intent

Enable role-based access control so ADMINs can see all orders and manage the system while regular USERs are limited to their own data. Also expose aggregation endpoints and a dashboard UI so both roles can see KPIs and trends at a glance.

## Scope

### In Scope
- **RBAC backend**: Role enforcement on `SecurityConfig`, JWT `role` claim, and data-scoped queries in `OrderService`
- **Dashboard backend**: `GET /api/dashboard/stats` endpoint returning order counts by status and revenue totals
- **Dashboard frontend**: `DashboardComponent` with KPI cards and Chart.js bar chart for order status distribution
- **Frontend role-gating**: Hide admin-only UI (delete actions, user management) based on `AuthStore.currentUser().role`

### Out of Scope
- User management CRUD (creation, deletion, role assignment) — users remain seeded only
- Trend/date-range filtering on dashboard — basic snapshot only
- Multi-tenancy or data isolation beyond orders — customers are still visible to all authenticated users

## Capabilities

### New Capabilities
- `dashboard-stats`: Backend aggregation endpoint `GET /api/dashboard/stats` returning order counts by status and revenue totals
- `rbac-backend`: Role enforcement in `SecurityConfig` + JWT `role` claim + data-scoped queries
- `dashboard-frontend`: Dashboard component with KPI cards and Chart.js visualization
- `frontend-role-gating`: Conditional UI rendering based on `AuthStore.currentUser().role`

### Modified Capabilities
- `orders-management` (Backend): `GET /api/orders` — USER role returns only orders whose customer belongs to that user; ADMIN returns all orders

## Approach

### Backend

**RBAC**
- `JwtService.generateToken()`: include `role` claim from `User.getRole().name()` alongside `sub`
- `SecurityConfig`: add `.requestMatchers("/api/orders/**").hasRole("USER")` for read operations; ADMIN endpoints (delete, future admin routes) get `.hasRole("ADMIN")`
- `OrderService.listOrders()`: take optional `username` parameter; for USER role, inject the current principal's username and filter orders by `customer.customerName` linked to that user (or introduce a `userId` on `Order` if tighter isolation is needed — see Risks)
- `OrderController`: accept `@AuthenticationPrincipal UserDetails user` and extract role, passing username to service

**Dashboard**
- `DashboardController`: new `GET /api/dashboard/stats` returning `DashboardStatsDto` with counts per `OrderStatus` and `BigDecimal totalRevenue`
- Use `OrderJpaRepository` aggregation queries (COUNT + SUM) directly to avoid loading full pages

### Frontend

**Dashboard**
- `DashboardComponent`: standalone, OnPush, injects `DashboardStore` (new signal store)
- `DashboardStore`: fetches `GET /api/dashboard/stats`, exposes `stats` signal; also fetches trend data from `GET /api/orders` with date filters
- Template: 4 KPI cards (Total Orders, Pending, Processing, Completed) + Chart.js bar chart
- Use `ng-chartjs` or vanilla Chart.js integrated via Angular

**Role-gating**
- `AuthStore.currentUser().role` already decodes from JWT — expose `isAdmin` computed signal
- Sidebar: conditionally render "Admin" section
- Order list: conditionally render delete button for ADMIN only
- Add `Role.GateDirective` (attribute directive, standalone) or inline `*ngIf="authStore.isAdmin()"` in templates

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/main/java/com/oms/infrastructure/security/JwtService.java` | Modified | Add `role` claim to generated JWT |
| `backend/src/main/java/com/oms/config/SecurityConfig.java` | Modified | Add `.hasRole()` rules per endpoint pattern |
| `backend/src/main/java/com/oms/application/service/OrderService.java` | Modified | Scoped query for USER role |
| `backend/src/main/java/com/oms/infrastructure/web/controller/DashboardController.java` | New | `GET /api/dashboard/stats` endpoint |
| `backend/src/main/java/com/oms/infrastructure/web/dto/DashboardStatsDto.java` | New | Response DTO for dashboard |
| `frontend/src/app/features/dashboard/dashboard.component.ts` | Modified | Full implementation with KPI cards |
| `frontend/src/app/features/dashboard/dashboard.store.ts` | New | Signal store for dashboard state |
| `frontend/src/app/features/dashboard/dashboard.service.ts` | New | HTTP service for dashboard endpoint |
| `frontend/src/app/features/auth/auth.store.ts` | Modified | Add `isAdmin` computed signal |
| `frontend/src/app/shared/ui/layout/sidebar/sidebar.component.ts` | Modified | Admin section conditionally rendered |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `User` → `Order` link doesn't exist yet — users aren't linked to specific customers | Medium | Decide on isolation model: user "owns" a set of customers (add `userId` to `CustomerJpaEntity`), or scope by `createdBy` on orders. If no link, fall back to ADMIN-only scoping for Fase 3, defer USER scoping to future phase |
| Chart.js integration with Angular OnPush may cause ExpressionChangedAfterItHasBeenCheckedError | Low | Use `ChangeDetectorRef.markForCheck()` after async data or `runOutsideAngular` for chart updates |
| JWT already generated without `role` claim — existing tokens won't decode role | Med | The frontend `decodeJwtPayload` will return empty string; add a token version or re-login prompt if payload lacks role |
| Dashboard stats endpoint accessible to all authenticated users (OK) but ADMIN stats need to be complete | Low | Ensure the stats query runs without a user filter — it's an aggregate, not per-user |

## Rollback Plan

- **Backend**: Revert `SecurityConfig` to `.anyRequest().authenticated()`, remove `role` claim from `JwtService`, remove data-scoping in `OrderService` — no DB migration needed
- **Frontend**: Revert `DashboardComponent` to placeholder, remove `isAdmin` from `AuthStore`, remove role-conditional templates — purely additive
- **DB**: No schema changes expected for Fase 3

## Dependencies

- PostgreSQL `oms_dev` database exists (prerequisite per AGENTS.md)
- `Role.ADMIN` / `Role.USER` enums already exist in domain model
- JWT auth already implemented with `AuthStore` decoding `role` from token payload
- Angular Chart.js library to be added (`npm install chart.js ng-chartjs`)

## Success Criteria

- [ ] `GET /api/dashboard/stats` returns `{ totalOrders, byStatus: { PENDING, PROCESSING, COMPLETED, CANCELLED }, totalRevenue }` for ADMIN
- [ ] `GET /api/orders` for USER returns only orders linked to that user; ADMIN returns all
- [ ] `DashboardComponent` renders 4 KPI cards and a Chart.js bar chart without runtime errors
- [ ] ADMIN sees delete buttons in order list; USER does not
- [ ] Login with `admin/admin123` returns JWT with `role: "ADMIN"` claim; login with non-admin returns `role: "USER"`
- [ ] Backend unit tests pass for `OrderService.listOrders()` with both roles
- [ ] Frontend Jest tests pass for `AuthStore.isAdmin` and `DashboardStore`
