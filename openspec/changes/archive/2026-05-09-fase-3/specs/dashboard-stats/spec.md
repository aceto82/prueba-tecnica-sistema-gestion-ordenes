# Spec: dashboard-stats (Fase 3)

## Purpose

Backend aggregation endpoint returning order statistics (counts by status + revenue totals) for dashboard KPIs.

---

## Requirement: Dashboard Stats Endpoint Returns Aggregated Data

The system MUST expose `GET /api/dashboard/stats` that returns a JSON object containing:
- `totalOrders`: total count of orders across all statuses
- `byStatus`: object with counts per `OrderStatus` enum value
- `totalRevenue`: sum of all order totals as BigDecimal

The endpoint MUST require a valid JWT. The aggregation MUST execute without loading full order entities.

#### Scenario: ADMIN retrieves dashboard stats

- GIVEN an authenticated user with role `ADMIN`
- AND the database contains 10 orders: 3 PENDING, 4 PROCESSING, 2 COMPLETED, 1 CANCELLED
- AND the sum of all order totals is 5000.00
- WHEN `GET /api/dashboard/stats` is called
- THEN the response is HTTP 200 with:
  ```json
  {
    "totalOrders": 10,
    "byStatus": {
      "PENDING": 3,
      "PROCESSING": 4,
      "COMPLETED": 2,
      "CANCELLED": 1
    },
    "totalRevenue": 5000.00
  }
  ```

#### Scenario: USER retrieves dashboard stats

- GIVEN an authenticated user with role `USER` with linked customers
- WHEN `GET /api/dashboard/stats` is called
- THEN the response includes aggregated stats ONLY for orders belonging to that user
- AND `totalOrders` reflects only the count of the user's orders
- AND `totalRevenue` reflects only the sum of the user's order totals

#### Scenario: Empty database returns zero counts

- GIVEN no orders exist in the database
- WHEN `GET /api/dashboard/stats` is called
- THEN the response is HTTP 200 with `totalOrders: 0`, `byStatus` all zero, `totalRevenue: 0`

#### Scenario: Unauthenticated request returns 401

- GIVEN no `Authorization` header
- WHEN `GET /api/dashboard/stats` is called
- THEN the response is HTTP 401 with RFC-7807 body