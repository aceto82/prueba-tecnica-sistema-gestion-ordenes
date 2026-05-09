# Spec: frontend-role-gating (Fase 3)

## Purpose

Conditional UI rendering in Angular based on user role (ADMIN vs USER) using AuthStore signals.

---

## Requirement: AuthStore Exposes isAdmin Computed Signal

The `AuthStore` MUST expose a computed signal `isAdmin` that returns `true` when the current user's role from the JWT payload is `ADMIN`, and `false` otherwise.

#### Scenario: isAdmin returns true for ADMIN user

- GIVEN the current user's JWT contains `role: "ADMIN"`
- WHEN `AuthStore.isAdmin()` is computed
- THEN the returned value is `true`

#### Scenario: isAdmin returns false for USER

- GIVEN the current user's JWT contains `role: "USER"`
- WHEN `AuthStore.isAdmin()` is computed
- THEN the returned value is `false`

#### Scenario: isAdmin handles missing role claim

- GIVEN the JWT payload has no `role` claim (legacy tokens)
- WHEN `AuthStore.isAdmin()` is computed
- THEN the returned value is `false`

---

## Requirement: Sidebar Conditionally Renders Admin Section

The `SidebarComponent` MUST conditionally display an "Admin" section (containing admin-only navigation items) only when `AuthStore.isAdmin()` is `true`.

#### Scenario: ADMIN sees admin section in sidebar

- GIVEN the current user has `isAdmin: true`
- WHEN `SidebarComponent` renders
- THEN the admin navigation section is visible

#### Scenario: USER does not see admin section in sidebar

- GIVEN the current user has `isAdmin: false`
- WHEN `SidebarComponent` renders
- THEN the admin navigation section is NOT rendered

---

## Requirement: Order List Conditionally Renders Delete Button

The orders list UI (template) MUST conditionally render the delete action/button for each order only when `AuthStore.isAdmin()` is `true`.

#### Scenario: ADMIN sees delete button on each order row

- GIVEN the current user has `isAdmin: true`
- WHEN the orders list component renders
- THEN each order row displays a delete button

#### Scenario: USER does not see delete button

- GIVEN the current user has `isAdmin: false`
- WHEN the orders list component renders
- THEN no delete button is rendered on any order row

---

## Requirement: Role-Based Navigation Guards (Optional Enhancement)

The application MAY implement route-level guards for admin-only routes. If implemented, such routes MUST redirect non-admin users to a suitable fallback page (e.g., home or unauthorized page).