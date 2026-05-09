# Spec: rbac-backend (Fase 3)

## Purpose

Role-based access control enforcement in backend: JWT role claim, SecurityConfig rules, and data-scoped service queries.

---

## Requirement: JWT Includes Role Claim

The system MUST include a `role` claim in the JWT payload during token generation. The claim value MUST equal the user's role enum name (`ADMIN` or `USER`). The claim MUST be present in every JWT issued after login.

#### Scenario: Login returns JWT with role claim

- GIVEN a user with role `ADMIN` exists in the database
- WHEN `POST /api/auth/login` is called with valid credentials
- THEN the returned JWT contains `role: "ADMIN"` in the payload
- AND the JWT can be decoded to verify the claim exists

#### Scenario: USER login returns JWT with USER role

- GIVEN a user with role `USER` exists
- WHEN `POST /api/auth/login` is called
- THEN the returned JWT contains `role: "USER"`

---

## Requirement: SecurityConfig Enforces Role-Based Access

The system MUST configure Spring Security to enforce role checks:
- Routes matching `/api/orders/**` MUST require role `USER` or `ADMIN`
- Routes for delete operations and future admin functions MUST require role `ADMIN`
- Unauthenticated requests to protected routes MUST be rejected with HTTP 401

#### Scenario: ADMIN can access order endpoints

- GIVEN a valid JWT with `role: "ADMIN"`
- WHEN a request is made to `GET /api/orders`
- THEN the request is authorized and returns HTTP 200

#### Scenario: USER can access GET /api/orders

- GIVEN a valid JWT with `role: "USER"`
- WHEN `GET /api/orders` is called
- THEN the request is authorized and returns HTTP 200

#### Scenario: Unauthenticated request to /api/orders returns 401

- GIVEN no JWT is provided
- WHEN `GET /api/orders` is called
- THEN HTTP 401 is returned with RFC-7807 body

---

## Requirement: OrderService Applies Data Scoping Based on Role

The `OrderService.listOrders()` method MUST accept the user's role and username (or userId) as parameters. When role is `USER`, the query MUST filter orders to only those linked to the user's customers. When role is `ADMIN`, no filtering is applied.

#### Scenario: OrderService returns all orders for ADMIN

- GIVEN a call to `OrderService.listOrders(role=ADMIN, username="admin")`
- THEN the returned list contains ALL orders in the database

#### Scenario: OrderService filters orders for USER

- GIVEN a call to `OrderService.listOrders(role=USER, username="john")`
- AND user "john" is linked to customers "Alice Corp" and "Bob Inc"
- THEN the returned list contains ONLY orders belonging to those customers