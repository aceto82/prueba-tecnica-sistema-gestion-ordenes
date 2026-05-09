# Archive Report: Fase 3 — Dashboard + RBAC

## Overview

Fase 3 implemented role-based access control (RBAC) with a dashboard for both ADMIN and USER roles. The change introduces data scoping in the backend and role-gated UI elements in the frontend.

## Implementation Summary

### Backend (Phases 1-2)
- **JWT Role Claim**: `JwtService.generateToken()` now includes `role` claim from user's role enum
- **SecurityConfig**: Added `.hasRole("USER")` and `.hasRole("ADMIN")` authorization rules
- **Customer-User Linking**: Added `userId` column to `CustomerJpaEntity` for data scoping
- **OrderService Scoping**: Filters orders by username for USER role
- **Dashboard Endpoint**: `GET /api/dashboard/stats` returns aggregation (counts by status + revenue)

### Frontend (Phases 3-4)
- **Dashboard Component**: Full implementation with 4 KPI cards and Chart.js bar chart
- **Dashboard Store**: Signal store exposing stats, loading, error states
- **AuthStore Enhancement**: Added `isAdmin` computed signal
- **Role Gating**: Conditional UI rendering in sidebar and order list

### Testing
- **Backend**: 72 tests passing (unit + integration)
- **Frontend**: 38 tests passing (Jest)
- **Total**: 110 tests passing

## Files Changed

### Backend
| File | Action |
|------|--------|
| `JwtService.java` | Modified - added role claim |
| `SecurityConfig.java` | Modified - added hasRole rules |
| `CustomerJpaEntity.java` | Modified - added userId column |
| `OrderSpecification.java` | Modified - added byUserId filter |
| `OrderService.java` | Modified - username parameter |
| `OrderController.java` | Modified - extracts principal |
| `OrderJpaRepository.java` | Modified - aggregation methods |
| `DashboardController.java` | Created |
| `DashboardStatsDto.java` | Created |

### Frontend
| File | Action |
|------|--------|
| `auth.store.ts` | Modified - added isAdmin |
| `dashboard.service.ts` | Created |
| `dashboard.store.ts` | Created |
| `dashboard.component.ts` | Modified - full implementation |
| `sidebar.component.ts` | Modified - admin section gating |

## Specs Synced

The delta spec for `orders-management` (REQ-O3 with role-based data scoping) has been merged into the main spec at `openspec/specs/orders-and-customers/spec.md`.

## Archive Contents

```
openspec/changes/archive/2026-05-09-fase-3/
├── verify-report.md    # Test verification results
├── archive-report.md   # This file
├── proposal.md        # Original proposal
├── spec.md            # Main spec
├── design.md          # Design decisions
├── tasks.md           # Task breakdown
└── specs/
    ├── dashboard-stats/
    ├── dashboard-frontend/
    ├── frontend-role-gating/
    ├── orders-management/
    └── rbac-backend/
```

## SDD Cycle Complete

Fase 3 is fully planned, implemented, verified, and archived. Ready for the next change.