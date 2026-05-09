# Delta: orders-management (Fase 3 — RBAC Data Scoping)

## MODIFIED Requirements

### REQ-O3: List Orders (Paginated + Filtered) — With Role-Based Scoping

The system MUST expose `GET /api/orders` supporting pagination (`page`, `size`, `sort`) and the following filters:
- `status`: exact match on order status enum
- `dateFrom` / `dateTo`: inclusive date-range filter on `createdAt`
- `customerName`: partial, case-insensitive match against the related customer's name

Filters are optional and combinable. Each item in the page MUST embed `CustomerSummary { id, name }`. The query MUST NOT produce N+1 database calls.

**Data Scoping:** When the requester's role is `USER`, the response MUST include only orders whose associated customer is linked to that user. When the requester's role is `ADMIN`, all orders are returned regardless of customer-to-user linkage.

(Previously: No role-based data scoping — all authenticated users saw all orders)

#### Scenario: ADMIN requests orders list with no filters

- GIVEN an authenticated user with role `ADMIN`
- WHEN `GET /api/orders?page=0&size=10` is called
- THEN the response is HTTP 200 with all orders in the system
- AND the `totalElements` reflects the total order count across all customers

#### Scenario: USER requests orders list sees only their own

- GIVEN an authenticated user with role `USER` linked to customers "Alice Corp" and "Bob Inc"
- WHEN `GET /api/orders?page=0&size=10` is called
- THEN the response is HTTP 200 containing only orders belonging to those customers
- AND orders for other customers are NOT included in the response

#### Scenario: USER with no linked customers receives empty list

- GIVEN an authenticated user with role `USER` who has no customers assigned
- WHEN `GET /api/orders?page=0&size=10` is called
- THEN the response is HTTP 200 with `content: []` and `totalElements: 0`

#### Scenario: ADMIN filter by status returns all matching orders

- GIVEN an ADMIN user and orders with statuses `PENDING`, `PROCESSING`, `COMPLETED`
- WHEN `GET /api/orders?status=PENDING` is called
- THEN all PENDING orders across all customers are returned

#### Scenario: USER filter by status returns only their matching orders

- GIVEN a USER with linked customer "Alice" who has one PENDING order
- AND a different customer "Bob" has one PENDING order
- WHEN `GET /api/orders?status=PENDING` is called
- THEN only Alice's PENDING order is returned

#### Scenario: USER filters by date range within their orders

- GIVEN a USER linked to customer "Alice" with orders created on 2025-01-01 and 2025-06-15
- WHEN `GET /api/orders?dateFrom=2025-06-01&dateTo=2025-06-30` is called
- THEN only the order created on 2025-06-15 is returned (from Alice's orders)