# Spec: Fase 3 — Dashboard + RBAC

## Overview

This spec covers Phase 3 of the OMS project, introducing:
- **RBAC backend**: Role-based access control with JWT role claims and data-scoped queries
- **Dashboard backend**: Aggregation endpoint for KPI statistics
- **Dashboard frontend**: UI component with KPI cards and Chart.js visualization
- **Frontend role-gating**: Conditional UI rendering based on user role
- **Orders management (modified)**: Added data scoping for USER role

## Domain Specs

| Domain | Type | Description |
|--------|------|-------------|
| `dashboard-stats` | NEW | Backend aggregation endpoint returning order counts by status and revenue totals |
| `rbac-backend` | NEW | Role enforcement in SecurityConfig + JWT role claim + data-scoped queries |
| `dashboard-frontend` | NEW | Dashboard component with KPI cards and Chart.js bar chart |
| `frontend-role-gating` | NEW | Conditional UI rendering based on AuthStore.isAdmin() |
| `orders-management` | MODIFIED | Added role-based data scoping to REQ-O3 (List Orders) |

## Key API Contracts

### GET /api/dashboard/stats
Returns aggregated order statistics:
```json
{
  "totalOrders": 10,
  "byStatus": { "PENDING": 3, "PROCESSING": 4, "COMPLETED": 2, "CANCELLED": 1 },
  "totalRevenue": 5000.00
}
```

### GET /api/orders (with RBAC)
- ADMIN: Returns all orders
- USER: Returns only orders linked to their customers

### JWT Role Claim
Login response includes `role: "ADMIN"` or `role: "USER"` in JWT payload.

## Frontend Changes

- `DashboardComponent`: 4 KPI cards + Chart.js bar chart
- `DashboardStore`: Signal store exposing `stats`, `loading`, `error`
- `AuthStore.isAdmin()`: Computed signal for role-based UI
- Sidebar: Conditional admin section
- Order list: Conditional delete button (admin only)

## Related Files

- `specs/dashboard-stats/spec.md` — Full spec
- `specs/rbac-backend/spec.md` — Full spec
- `specs/dashboard-frontend/spec.md` — Full spec
- `specs/frontend-role-gating/spec.md` — Full spec
- `specs/orders-management/spec.md` — Delta spec (MODIFIED requirements)