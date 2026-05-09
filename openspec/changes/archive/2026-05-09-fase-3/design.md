# Design: Fase 3 — Dashboard + RBAC

## Technical Approach

Implement role-based access control with two enforcement layers: Spring Security authorization at the API gateway level, and data-scoped queries in the service layer. Dashboard provides aggregated KPIs via a dedicated endpoint returning counts by status and revenue totals. Frontend uses Angular signals for reactive role-based UI gating.

## Architecture Decisions

### Decision: Role claim format in JWT

**Choice**: Include `role` as a simple string claim (`"ADMIN"` or `"USER"`) alongside the `sub` claim in `JwtService.generateToken()`.

**Alternatives considered**: Encode as authorities list `["ROLE_ADMIN", "ROLE_USER"]` mapping to Spring Security's `SimpleGrantedAuthority`.

**Rationale**: Frontend `decodeJwtPayload` already expects a simple string in `payload.role`. Adding list-based authorities would require frontend changes and additional parsing. Simple string is sufficient for both backend role checks and frontend UI gating.

### Decision: Data scoping model for USER role

**Choice**: Add `userId` column to `CustomerJpaEntity` to link customers to users. Filter orders by customer.userId matching the authenticated username.

**Alternatives considered**: Add `createdBy` directly to OrderJpaEntity | Use ADMIN-only scoping for Fase 3 and defer USER scoping to future phase.

**Rationale**: Customer → User is the natural ownership relationship in this domain (customers belong to users who manage them). Adding `createdBy` to orders would require backfilling existing data and doesn't reflect actual business ownership. Deferring USER scoping loses the core RBAC value of this phase.

### Decision: Dashboard stats query approach

**Choice**: Use Spring Data JPA repository methods with `@Query` aggregation (COUNT + SUM) rather than JPQL in service layer.

**Alternatives considered**: Load full pages and aggregate in memory | Use native query with `@Query(nativeQuery = true)`.

**Rationale**: JPA repository methods keep aggregation close to the data access layer. Native queries add DB-specific coupling. In-memory aggregation is wasteful for simple counts/sums.

### Decision: Frontend role gating strategy

**Choice**: Add `isAdmin` computed signal to `AuthStore`, use inline `*ngIf="authStore.isAdmin()"` in templates for simple cases.

**Alternatives considered**: Create a reusable `RoleGateDirective` | Use route guards for admin-only routes.

**Rationale**: Direct computed signal in templates is simpler for this scope. Directive would add abstraction overhead for 2-3 use cases. Route guards don't apply here—ADMIN and USER see the same routes, just with different UI elements.

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  AuthStore.isAdmin() ──→ Sidebar, OrderList delete buttons  │
│  DashboardStore.stats() ──> DashboardComponent KPIs/chart   │
└──────────────────────┬──────────────────────────────────────┘
                       │ JWT with role claim
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND                                │
│  JwtAuthenticationFilter ──> SecurityContext                │
│  SecurityConfig ──> .hasRole() authorization               │
│  OrderController.listOrders() ──> OrderService.filtered    │
│  DashboardController.stats() ──> Repository aggregation    │
└─────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/.../JwtService.java` | Modify | Add `role` claim to JWT in `generateToken()` |
| `backend/.../SecurityConfig.java` | Modify | Add `.requestMatchers().hasRole()` rules for orders |
| `backend/.../CustomerJpaEntity.java` | Modify | Add `userId` column for customer-user linking |
| `backend/.../OrderSpecification.java` | Modify | Add filter by userId for data scoping |
| `backend/.../OrderService.java` | Modify | Accept optional `username` param for USER role filtering |
| `backend/.../OrderController.java` | Modify | Extract `@AuthenticationPrincipal` and pass to service |
| `backend/.../OrderJpaRepository.java` | Modify | Add aggregation query methods for stats |
| `backend/.../DashboardController.java` | Create | `GET /api/dashboard/stats` endpoint |
| `backend/.../DashboardStatsDto.java` | Create | Response DTO with counts by status + revenue |
| `frontend/.../auth.store.ts` | Modify | Add `isAdmin` computed signal |
| `frontend/.../dashboard.service.ts` | Create | HTTP service for dashboard endpoint |
| `frontend/.../dashboard.store.ts` | Create | Signal store for dashboard state management |
| `frontend/.../dashboard.component.ts` | Modify | Full implementation with KPI cards + Chart.js |
| `frontend/.../sidebar.component.ts` | Modify | Admin section conditionally rendered |

## Interfaces / Contracts

### Backend

```java
// DashboardStatsDto.java
public record DashboardStatsDto(
    long totalOrders,
    Map<OrderStatus, Long> ordersByStatus,
    BigDecimal totalRevenue
) {}
```

```java
// OrderController.listOrders()
@GetMapping
public Page<OrderResponse> listOrders(
    @PageableDefault(size = 10) Pageable pageable,
    @RequestParam(required = false) OrderStatus status,
    @AuthenticationPrincipal UserDetails userDetails  // NEW
)
```

```java
// OrderService.listOrders()
public Page<OrderListResponse> listOrders(
    OrderFilter filter,
    Pageable pageable,
    String username  // NEW: null for ADMIN, username for USER
)
```

### Frontend

```typescript
// dashboard.service.ts
interface DashboardStats {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalRevenue: number;
}

getStats(): Observable<DashboardStats>
```

```typescript
// auth.store.ts - add computed signal
readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN')
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | JwtService generates token with role claim | Mockito: verify `.claim("role", ...)` called |
| Unit | SecurityConfig hasRole rules applied | Integration test with mock MVC |
| Unit | OrderService filters by username for USER | Mock repository, verify `Specification` built |
| Unit | DashboardStatsDto maps correctly | Assert record fields match |
| Unit | AuthStore.isAdmin computes from role | Signal test: set role to ADMIN/USER, assert computed |
| Integration | `GET /api/dashboard/stats` returns correct aggregation | `@SpringBootTest` + mock data |
| Integration | USER role gets filtered orders, ADMIN gets all | MockMvc with different users |
| E2E | Dashboard renders 4 KPI cards + chart | Playwright: verify text content, canvas element |

## Migration / Rollout

**No database migration required for Phase 3**, but note:
- Add `userId` column to `customers` table as nullable (allow existing customers without owner)
- Seed script updates: assign customers to "admin" user initially

**Rollback plan:**
- Backend: Revert `SecurityConfig` to `.anyRequest().authenticated()`, remove role claim from `JwtService`, remove username parameter from `OrderService` — no DB changes
- Frontend: Revert `DashboardComponent` to placeholder, remove `isAdmin` computed, remove role-conditional templates — purely additive changes

## Open Questions

- [ ] Should we add a DB migration script or let Hibernate handle schema update? (Hibernate auto-create is fine for dev, but production needs migration)
- [ ] Do we need a DB migration for the new `userId` column on customers? (Nullable column can be added without migration, but explicit migration is cleaner)
- [ ] Should the seeder assign all existing customers to the admin user, or leave them unassigned? (Admin sees all customers anyway—leaving unassigned simplifies)