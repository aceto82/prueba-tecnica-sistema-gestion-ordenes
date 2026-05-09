# Spec: Fase 2 — Orders & Customers CRUD (Backend + Frontend)

## Purpose

Full spec for `fase-2`. Both capabilities are NEW — no existing specs to delta against.
Covers: `customers-management`, `orders-management`.

---

## Capability: customers-management

### REQ-C1: List Customers (Paginated)

The system MUST expose `GET /api/customers` accepting `page`, `size`, and `sort` query params (Spring `Pageable`). The response MUST be a `Page<CustomerDto>`. The endpoint MUST require a valid JWT.

#### Scenario: Returns paginated customer list

- GIVEN at least one customer exists in the database
- WHEN `GET /api/customers?page=0&size=10` is called with a valid JWT
- THEN the response is HTTP 200 with `content`, `totalElements`, `totalPages`, `number`
- AND each item contains `id`, `name`, and `email`

#### Scenario: Empty database returns empty page

- GIVEN no customers exist
- WHEN `GET /api/customers?page=0&size=10` is called with a valid JWT
- THEN the response is HTTP 200 with `content: []` and `totalElements: 0`

#### Scenario: Unauthenticated request is rejected

- GIVEN no `Authorization` header
- WHEN `GET /api/customers` is called
- THEN the response is HTTP 401 with RFC-7807 body

---

### REQ-C2: Get Customer by ID

The system MUST expose `GET /api/customers/{id}` returning a single `CustomerDto`. If no customer exists for `{id}`, the system MUST return HTTP 404.

#### Scenario: Existing customer is returned

- GIVEN a customer with id `42` exists
- WHEN `GET /api/customers/42` is called with a valid JWT
- THEN the response is HTTP 200 with `id`, `name`, and `email`

#### Scenario: Unknown id returns 404

- GIVEN no customer with id `99` exists
- WHEN `GET /api/customers/99` is called with a valid JWT
- THEN the response is HTTP 404 with RFC-7807 body

---

### REQ-C3: Create Customer

The system MUST expose `POST /api/customers` accepting `{ name, email }`. Both fields are REQUIRED and MUST be validated. `email` MUST be unique. On success, HTTP 201 is returned with the created `CustomerDto`.

#### Scenario: Valid payload creates customer

- GIVEN name and email are provided and email is not already in use
- WHEN `POST /api/customers` is called with a valid JWT
- THEN the response is HTTP 201 with `id`, `name`, and `email`
- AND the customer is persisted in the database

#### Scenario: Missing required field returns 400

- GIVEN the request body omits `name` or `email`
- WHEN `POST /api/customers` is called
- THEN the response is HTTP 400 with RFC-7807 body listing the invalid fields

#### Scenario: Duplicate email returns 409

- GIVEN a customer with the same email already exists
- WHEN `POST /api/customers` is called with that email
- THEN the response is HTTP 409 with RFC-7807 body

---

### REQ-C4: Update Customer

The system MUST expose `PUT /api/customers/{id}` accepting `{ name, email }`. Both fields are REQUIRED. If the customer does not exist, HTTP 404 is returned. Email uniqueness constraint applies.

#### Scenario: Valid update modifies customer

- GIVEN a customer with id `42` exists
- WHEN `PUT /api/customers/42` is called with valid name and email
- THEN the response is HTTP 200 with the updated `CustomerDto`
- AND the database reflects the new values

#### Scenario: Unknown id returns 404

- GIVEN no customer with id `99` exists
- WHEN `PUT /api/customers/99` is called
- THEN the response is HTTP 404 with RFC-7807 body

#### Scenario: Missing field returns 400

- GIVEN the request body omits `name` or `email`
- WHEN `PUT /api/customers/{id}` is called
- THEN the response is HTTP 400 with RFC-7807 body

---

## Capability: orders-management

### REQ-O1: Create Order

The system MUST expose `POST /api/orders` accepting `{ customerId, total }`. `customerId` MUST reference an existing customer. `total` MUST be greater than 0. The initial status MUST be `PENDING`. On success, HTTP 201 is returned.

#### Scenario: Valid payload creates order with PENDING status

- GIVEN a customer with id `42` exists and total is `150.00`
- WHEN `POST /api/orders` is called with a valid JWT
- THEN the response is HTTP 201 with `id`, `customerId`, `total: 150.00`, `status: PENDING`

#### Scenario: Non-existent customerId returns 404

- GIVEN no customer with id `99` exists
- WHEN `POST /api/orders` is called with `customerId: 99`
- THEN the response is HTTP 404 with RFC-7807 body

#### Scenario: total ≤ 0 returns 400

- GIVEN total is `0` or negative
- WHEN `POST /api/orders` is called
- THEN the response is HTTP 400 with RFC-7807 body

---

### REQ-O2: Get Order by ID

The system MUST expose `GET /api/orders/{id}` returning a single `OrderDetailDto` that embeds `CustomerSummary { id, name }`. If the order does not exist, HTTP 404 is returned.

#### Scenario: Existing order is returned with CustomerSummary

- GIVEN an order with id `7` belonging to customer `{ id: 42, name: "Alice" }` exists
- WHEN `GET /api/orders/7` is called with a valid JWT
- THEN the response is HTTP 200 containing `id`, `status`, `total`, and `customer: { id: 42, name: "Alice" }`

#### Scenario: Unknown id returns 404

- GIVEN no order with id `999` exists
- WHEN `GET /api/orders/999` is called with a valid JWT
- THEN the response is HTTP 404 with RFC-7807 body

---

### REQ-O3: List Orders (Paginated + Filtered)

The system MUST expose `GET /api/orders` supporting pagination (`page`, `size`, `sort`) and the following filters:
- `status`: exact match on order status enum
- `dateFrom` / `dateTo`: inclusive date-range filter on `createdAt`
- `customerName`: partial, case-insensitive match against the related customer's name

Filters are optional and combinable. Each item in the page MUST embed `CustomerSummary { id, name }`. The query MUST NOT produce N+1 database calls.

#### Scenario: Unfiltered list returns all orders paginated

- GIVEN three orders exist
- WHEN `GET /api/orders?page=0&size=10` is called with a valid JWT
- THEN the response is HTTP 200 with `totalElements: 3` and each item embeds `customer`

#### Scenario: Filter by status returns matching orders only

- GIVEN orders with statuses `PENDING`, `PROCESSING`, `COMPLETED` exist
- WHEN `GET /api/orders?status=PENDING` is called
- THEN only orders with `status: PENDING` are returned

#### Scenario: Filter by date range returns matching orders only

- GIVEN orders created on 2025-01-01, 2025-06-15, and 2025-12-31
- WHEN `GET /api/orders?dateFrom=2025-06-01&dateTo=2025-06-30` is called
- THEN only the order created on 2025-06-15 is returned

#### Scenario: Filter by customerName performs partial case-insensitive match

- GIVEN customers "Alice Smith" and "Bob Jones" each have one order
- WHEN `GET /api/orders?customerName=alice` is called
- THEN only Alice's order is returned

#### Scenario: Combined filters narrow results

- GIVEN Alice has one PENDING and one PROCESSING order
- WHEN `GET /api/orders?customerName=alice&status=PENDING` is called
- THEN only the PENDING order is returned

---

### REQ-O4: Update Order

The system MUST expose `PUT /api/orders/{id}` that accepts `{ status }` and, when the order is `PENDING`, optionally `{ total }`. Status changes MUST respect the transition rules in REQ-O5. `total` updates are only valid while the order is `PENDING`. If the order does not exist, HTTP 404.

#### Scenario: Update status of existing PENDING order to PROCESSING

- GIVEN an order in status `PENDING`
- WHEN `PUT /api/orders/{id}` is called with `{ status: "PROCESSING" }`
- THEN the response is HTTP 200 with `status: PROCESSING`

#### Scenario: Update total of PENDING order

- GIVEN an order in status `PENDING` with total `100.00`
- WHEN `PUT /api/orders/{id}` is called with `{ total: 250.00 }`
- THEN the response is HTTP 200 with `total: 250.00`

#### Scenario: Update total of non-PENDING order returns 400

- GIVEN an order in status `PROCESSING`
- WHEN `PUT /api/orders/{id}` is called with `{ total: 250.00 }`
- THEN the response is HTTP 400 with RFC-7807 body explaining total is immutable after PENDING

#### Scenario: Unknown id returns 404

- GIVEN no order with id `999` exists
- WHEN `PUT /api/orders/999` is called
- THEN the response is HTTP 404 with RFC-7807 body

---

### REQ-O5: Order Status Transitions

`OrderService` MUST enforce the following finite-state machine. Any transition not listed here is ILLEGAL and MUST return HTTP 400 with an RFC-7807 body that includes the current status and the rejected target status.

| From | To | Legal |
|------|----|-------|
| PENDING | PROCESSING | YES |
| PENDING | CANCELLED | YES |
| PROCESSING | COMPLETED | YES |
| PROCESSING | CANCELLED | YES |
| COMPLETED | any | NO |
| CANCELLED | any | NO |

#### Scenario: PENDING → PROCESSING is accepted

- GIVEN an order with status `PENDING`
- WHEN the status is updated to `PROCESSING`
- THEN the response is HTTP 200 with `status: PROCESSING`

#### Scenario: PENDING → CANCELLED is accepted

- GIVEN an order with status `PENDING`
- WHEN the status is updated to `CANCELLED`
- THEN the response is HTTP 200 with `status: CANCELLED`

#### Scenario: PROCESSING → COMPLETED is accepted

- GIVEN an order with status `PROCESSING`
- WHEN the status is updated to `COMPLETED`
- THEN the response is HTTP 200 with `status: COMPLETED`

#### Scenario: PROCESSING → CANCELLED is accepted

- GIVEN an order with status `PROCESSING`
- WHEN the status is updated to `CANCELLED`
- THEN the response is HTTP 200 with `status: CANCELLED`

#### Scenario: COMPLETED → any transition is rejected

- GIVEN an order with status `COMPLETED`
- WHEN any status update is attempted (e.g. PENDING, PROCESSING, CANCELLED)
- THEN the response is HTTP 400 with RFC-7807 body containing current status `COMPLETED` and the rejected target

#### Scenario: CANCELLED → any transition is rejected

- GIVEN an order with status `CANCELLED`
- WHEN any status update is attempted
- THEN the response is HTTP 400 with RFC-7807 body containing current status `CANCELLED` and the rejected target

#### Scenario: PENDING → COMPLETED is rejected (skipping PROCESSING)

- GIVEN an order with status `PENDING`
- WHEN the status is updated to `COMPLETED`
- THEN the response is HTTP 400 with RFC-7807 body

---

## Capability: orders-management (Frontend)

### REQ-F1: Orders List View

The `OrdersListComponent` MUST render a table of orders with pagination controls, a search input, and a status filter. The component MUST be standalone and OnPush. Data MUST flow through `OrderStore` using signals.

- Search input MUST debounce 300 ms and cancel in-flight requests via `switchMap`.
- Status filter changes MUST cancel in-flight requests via `switchMap`.
- Pagination controls MUST update `OrderStore` page signal and reload.

#### Scenario: Table renders with paginated data

- GIVEN `OrderStore` has loaded a page of orders
- WHEN `OrdersListComponent` is rendered
- THEN a table row exists for each order in the current page
- AND pagination controls reflect `totalPages` and current `page`

#### Scenario: Search debounce triggers request after 300 ms

- GIVEN the user types in the search input
- WHEN fewer than 300 ms have elapsed since the last keystroke
- THEN no HTTP request is made
- WHEN 300 ms have elapsed without further input
- THEN exactly one HTTP request is dispatched with `customerName=<typed value>`

#### Scenario: Status filter change reloads list

- GIVEN the orders list is loaded
- WHEN the user selects a different status from the filter control
- THEN the in-flight request (if any) is cancelled
- AND a new request is dispatched with `status=<selected value>`

#### Scenario: Changing page loads correct page

- GIVEN the orders list has multiple pages
- WHEN the user clicks to page 2
- THEN `OrderStore` page signal is updated to `1` (zero-indexed)
- AND a new request is dispatched with `page=1`

---

### REQ-F2: Order Create/Edit Form

The `OrderFormComponent` MUST validate `customerId` (required) and `total` (required, > 0) before submission. On create, `POST /api/orders` is called. On edit, the existing order is loaded first and `PUT /api/orders/{id}` is called on submit.

#### Scenario: Create form — valid submission creates order

- GIVEN customerId is set and total > 0
- WHEN the user submits the create form
- THEN `POST /api/orders` is called with the form values
- AND on success the user is navigated to the orders list

#### Scenario: Create form — missing customerId blocks submission

- GIVEN customerId is empty
- WHEN the user attempts to submit
- THEN the form is invalid, the HTTP call is NOT made
- AND a validation error is displayed for customerId

#### Scenario: Create form — total ≤ 0 blocks submission

- GIVEN total is `0` or negative
- WHEN the user attempts to submit
- THEN the form is invalid, the HTTP call is NOT made
- AND a validation error is displayed for total

#### Scenario: Edit form — loads existing order data

- GIVEN the user navigates to `/orders/{id}/edit`
- WHEN the component initialises
- THEN `GET /api/orders/{id}` is called
- AND form fields are pre-populated with the returned order values

#### Scenario: Edit form — valid submission updates order

- GIVEN the edit form has loaded an existing PENDING order and total is changed to `300`
- WHEN the user submits
- THEN `PUT /api/orders/{id}` is called with the updated values
- AND on success the user is navigated to the order detail or list

---

## Capability: customers-management (Frontend)

### REQ-F3: Customers List View

The `CustomersListComponent` MUST render a table of customers with pagination controls. The component MUST be standalone and OnPush. Data MUST flow through `CustomerStore` using signals following the `AuthStore` pattern.

#### Scenario: Table renders with paginated data

- GIVEN `CustomerStore` has loaded a page of customers
- WHEN `CustomersListComponent` is rendered
- THEN a table row exists for each customer in the current page
- AND pagination controls reflect `totalPages` and current `page`

#### Scenario: Changing page loads correct page

- GIVEN the customer list has multiple pages
- WHEN the user clicks to page 2
- THEN `CustomerStore` page signal is updated to `1`
- AND a new request is dispatched with `page=1`

---

### REQ-F4: Customer Create/Edit Form

The `CustomerFormComponent` MUST validate `name` (required) and `email` (required, valid email format) before submission. On create, `POST /api/customers` is called. On edit, the existing customer is loaded first and `PUT /api/customers/{id}` is called on submit.

#### Scenario: Create form — valid submission creates customer

- GIVEN name and a valid email are provided
- WHEN the user submits the create form
- THEN `POST /api/customers` is called with the form values
- AND on success the user is navigated to the customers list

#### Scenario: Create form — missing name or email blocks submission

- GIVEN name or email is empty
- WHEN the user attempts to submit
- THEN the form is invalid and the HTTP call is NOT made

#### Scenario: Create form — invalid email format blocks submission

- GIVEN email is not a valid email address
- WHEN the user attempts to submit
- THEN a validation error is displayed and the HTTP call is NOT made

#### Scenario: Edit form — loads existing customer data

- GIVEN the user navigates to `/customers/{id}/edit`
- WHEN the component initialises
- THEN `GET /api/customers/{id}` is called
- AND form fields are pre-populated with the returned customer values

#### Scenario: Edit form — valid submission updates customer

- GIVEN the edit form has valid name and email
- WHEN the user submits
- THEN `PUT /api/customers/{id}` is called with the updated values
- AND on success the user is navigated to the customers list
