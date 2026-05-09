# Tasks: Fase 3 — Dashboard + RBAC

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend RBAC foundation (JWT role, SecurityConfig, Customer userId) | PR 1 | Base branch: main; includes tests |
| 2 | OrderService scoping + Dashboard backend endpoint | PR 2 | Depends on PR 1; includes tests |
| 3 | Frontend Dashboard (service, store, component + chart) + role gating | PR 3 | Depends on PR 2; includes tests |

## Phase 1: Backend RBAC Foundation

- [ ] 1.1 Modify `JwtService.java` — add `role` claim from `User.getRole().name()` to JWT token
- [ ] 1.2 Modify `SecurityConfig.java` — add `.requestMatchers("/api/orders/**").hasRole("USER")` and `.hasRole("ADMIN")` for delete operations
- [ ] 1.3 Modify `CustomerJpaEntity.java` — add `userId` column (nullable String) for customer-user linking
- [ ] 1.4 Update seed script — assign existing customers to "admin" user

## Phase 2: Core Backend Implementation

- [ ] 2.1 Create `OrderSpecification.java` — add `byUserId()` method to filter orders by customer.userId
- [ ] 2.2 Modify `OrderService.java` — add `username` parameter to `listOrders()`; apply specification for USER role
- [ ] 2.3 Modify `OrderController.java` — extract `@AuthenticationPrincipal UserDetails` and pass username to service
- [ ] 2.4 Modify `OrderJpaRepository.java` — add `countByStatus()` and `sumTotalAmount()` aggregation methods
- [ ] 2.5 Create `DashboardStatsDto.java` — response DTO with `totalOrders`, `ordersByStatus`, `totalRevenue`
- [ ] 2.6 Create `DashboardController.java` — `GET /api/dashboard/stats` endpoint returning DashboardStatsDto

## Phase 3: Frontend Dashboard

- [ ] 3.1 Install chart.js dependencies — `npm install chart.js ng-chartjs`
- [ ] 3.2 Create `dashboard.service.ts` — HTTP service calling `GET /api/dashboard/stats`
- [ ] 3.3 Create `dashboard.store.ts` — signal store exposing `stats`, `loading`, `error` signals
- [ ] 3.4 Modify `dashboard.component.ts` — implement 4 KPI cards and Chart.js bar chart

## Phase 4: Frontend Role Gating

- [ ] 4.1 Modify `auth.store.ts` — add `isAdmin` computed signal: `computed(() => this._currentUser()?.role === 'ADMIN')`
- [ ] 4.2 Modify `sidebar.component.ts` — conditionally render admin section with `*ngIf="authStore.isAdmin()"`
- [ ] 4.3 Modify order list component — conditionally hide delete button for non-ADMIN users

## Phase 5: Testing & Verification

- [ ] 5.1 Write unit test for `JwtService` — verify role claim is present in generated token
- [ ] 5.2 Write unit test for `OrderService.listOrders()` with username filter applied
- [ ] 5.3 Write integration test for `GET /api/dashboard/stats` returns correct aggregation
- [ ] 5.4 Write integration test for USER role gets filtered orders, ADMIN gets all
- [ ] 5.5 Write Jest test for `AuthStore.isAdmin` computed signal
- [ ] 5.6 Write Jest test for `DashboardStore` fetching and exposing stats

## Dependency Graph

```
Phase 1 (Foundation)
├── 1.1 JwtService role claim ──────────┐
├── 1.2 SecurityConfig rules            │
├── 1.3 CustomerJpaEntity userId        │──→ Phase 2
└── 1.4 Seed script update              │     (depends on all Phase 1)

Phase 2 (Core Backend)
├── 2.1 OrderSpecification ─────────────┤
├── 2.2 OrderService scoping ───────────┤
├── 2.3 OrderController ─────────────────┼──→ Phase 3 & 4
├── 2.4 OrderJpaRepository aggs          │     (frontend needs backend ready)
├── 2.5 DashboardStatsDto ──────────────┤
└── 2.6 DashboardController ─────────────┘

Phase 3 (Frontend Dashboard)
├── 3.1 Install chart.js ───────────────┤
├── 3.2 dashboard.service ───────────────┤
├── 3.3 dashboard.store ──────────────────┤
└── 3.4 dashboard.component ─────────────┘

Phase 4 (Role Gating)
├── 4.1 AuthStore isAdmin ───────────────┤
├── 4.2 Sidebar conditional ─────────────┤
└── 4.3 Order list gating ───────────────┘

Phase 5 (Testing)
└── All tests run after implementation complete
```