# Spec: Fase 1 — Foundation (Auth + Scaffold)

## Purpose

Delta spec for `fase-1`. All capabilities are NEW (greenfield project, no existing specs).
Covers: `auth-jwt-backend`, `auth-frontend`, `backend-scaffold`, `frontend-shell`.

---

## Capability: auth-jwt-backend

### Requirement: Login Endpoint Issues JWT

The system MUST expose `POST /api/auth/login` accepting `{ email, password }` and returning a signed HS256 JWT with configurable secret and TTL. The endpoint MUST be publicly accessible (no auth required).

#### Scenario: Valid credentials return JWT

- GIVEN a user exists in the database with a BCrypt-hashed password
- WHEN `POST /api/auth/login` is called with matching email and password
- THEN the response is HTTP 200 with `{ token: "<jwt>" }` in the body
- AND the JWT signature uses HS256 with the configured secret
- AND the JWT `exp` claim equals `now + configured TTL`

#### Scenario: Invalid password returns 401

- GIVEN a user exists in the database
- WHEN `POST /api/auth/login` is called with correct email and wrong password
- THEN the response is HTTP 401
- AND the body conforms to RFC-7807 (`type`, `title`, `status`, `detail`)

#### Scenario: Unknown email returns 401

- GIVEN no user exists for the provided email
- WHEN `POST /api/auth/login` is called
- THEN the response is HTTP 401 with RFC-7807 body
- AND the response MUST NOT disclose whether the email exists

#### Scenario: Malformed request body returns 400

- GIVEN the request body is missing `email` or `password`
- WHEN `POST /api/auth/login` is called
- THEN the response is HTTP 400 with RFC-7807 body listing the invalid fields

---

### Requirement: JWT Filter Guards Protected Routes

The system MUST validate bearer tokens on every request to routes other than `POST /api/auth/login`. Valid tokens MUST populate the Spring `SecurityContext`. Invalid or absent tokens MUST be rejected before reaching the controller.

#### Scenario: Request with valid JWT reaches protected endpoint

- GIVEN a valid JWT (correct signature, not expired)
- WHEN a request is sent to any protected endpoint with `Authorization: Bearer <token>`
- THEN the request proceeds to the controller and returns HTTP 200 (or appropriate business response)
- AND `SecurityContextHolder` contains the authenticated principal

#### Scenario: Request without token returns 401

- GIVEN no `Authorization` header is present
- WHEN a request is sent to any protected endpoint
- THEN the response is HTTP 401 with RFC-7807 body

#### Scenario: Request with expired JWT returns 401

- GIVEN a JWT whose `exp` claim is in the past
- WHEN a request is sent with `Authorization: Bearer <expired-token>`
- THEN the response is HTTP 401 with RFC-7807 body

#### Scenario: Request with malformed JWT returns 401

- GIVEN an `Authorization` header with a value that is not a valid JWT
- WHEN a request is sent to a protected endpoint
- THEN the response is HTTP 401 with RFC-7807 body

---

### Requirement: Global Exception Handler Produces RFC-7807 Responses

The system MUST handle `401`, `403`, and `400` errors through a global handler that always returns RFC-7807 Problem Details format (`application/problem+json`). Raw Spring error responses MUST NOT be returned to clients.

#### Scenario: Unauthorized access is RFC-7807

- GIVEN a request that triggers a Spring Security 401
- WHEN the response is formed
- THEN `Content-Type` is `application/problem+json`
- AND the body contains `type`, `title`, `status: 401`, `detail`

#### Scenario: Validation error is RFC-7807

- GIVEN a request body that fails `@Valid` constraints
- WHEN the controller rejects it
- THEN the response is HTTP 400 `application/problem+json` with a `detail` listing each invalid field

---

## Capability: backend-scaffold

### Requirement: Hexagonal Package Layout

The backend source tree MUST conform to the hexagonal layout. No JPA, Spring, or framework annotations MUST appear in the `domain` package.

#### Scenario: Domain entities are framework-free

- GIVEN the compiled `domain` package
- WHEN each class is inspected for annotations
- THEN no class carries `@Entity`, `@Table`, `@Column`, `@Id`, or any `javax.persistence` / `jakarta.persistence` annotation

#### Scenario: Package layout matches specification

- GIVEN the backend source tree
- WHEN the top-level package is inspected
- THEN subdirectories `config`, `domain`, `application`, `infrastructure/persistence`, `infrastructure/security`, `infrastructure/web` all exist

---

### Requirement: Persistence Layer Provides Mappers

The system MUST map between pure domain entities and JPA entities within `infrastructure/persistence`. No domain-level object MUST hold a reference to its JPA counterpart and vice versa.

#### Scenario: Mapper converts JPA entity to domain entity

- GIVEN a JPA entity retrieved from the database
- WHEN the mapper is called
- THEN a domain entity is returned with no JPA annotations or persistence-layer imports

#### Scenario: Mapper converts domain entity to JPA entity for save

- GIVEN a pure domain entity
- WHEN the mapper is called before persistence
- THEN a JPA entity is returned ready for the repository save call

---

### Requirement: Spring Security Stateless Session Policy

The system MUST configure `SecurityFilterChain` with `SessionCreationPolicy.STATELESS` and CSRF disabled for the API. Passwords MUST be encoded with BCrypt.

#### Scenario: No session is created on authenticated request

- GIVEN a request with a valid JWT
- WHEN the request is processed
- THEN no HTTP session is created or returned in the response

---

## Capability: auth-frontend

### Requirement: Login Page Authenticates and Persists Token

The Angular login feature MUST provide a reactive form that posts credentials to `/api/auth/login`, stores the returned JWT in `localStorage`, and navigates to the protected shell on success.

#### Scenario: Successful login stores token and redirects

- GIVEN the user is on `/login`
- WHEN the user submits valid credentials
- THEN `AuthStore` token signal is set to the received JWT
- AND the token is written to `localStorage` under key `auth_token`
- AND the router navigates the user to the protected shell route

#### Scenario: Failed login shows error message

- GIVEN the user is on `/login`
- WHEN the user submits invalid credentials and the API returns 401
- THEN an inline error message is displayed
- AND the token signal and localStorage remain unchanged

#### Scenario: Form validation prevents submission

- GIVEN the user is on `/login` with empty or malformed fields
- WHEN the user attempts to submit
- THEN the form is marked invalid and the HTTP call is NOT made

---

### Requirement: AuthGuard Blocks Unauthenticated Navigation

The `AuthGuard` (functional) MUST redirect unauthenticated users to `/login` when they attempt to access any protected route.

#### Scenario: Unauthenticated user is redirected to login

- GIVEN the `AuthStore` token signal is `null`
- WHEN the user navigates to a protected route
- THEN the router redirects to `/login`
- AND the protected route component is NOT rendered

#### Scenario: Authenticated user accesses protected route

- GIVEN the `AuthStore` token signal holds a non-null JWT
- WHEN the user navigates to a protected route
- THEN navigation proceeds and the route component renders

---

### Requirement: JwtInterceptor Attaches Bearer Header

The `JwtInterceptor` (functional) MUST clone every outgoing HTTP request and attach `Authorization: Bearer <token>` when a token is present. Requests to `/api/auth/login` MUST also pass through (the server ignores the header; the interceptor MUST NOT skip it based on URL).

#### Scenario: Authenticated request includes bearer header

- GIVEN the `AuthStore` token signal holds a JWT
- WHEN any HTTP request is made by the Angular app
- THEN the cloned request includes `Authorization: Bearer <token>`

#### Scenario: Unauthenticated request has no authorization header

- GIVEN the `AuthStore` token signal is `null`
- WHEN an HTTP request is made
- THEN the request is forwarded unchanged (no `Authorization` header added)

---

### Requirement: AuthStore Rehydrates Token on Application Start

The `AuthStore` MUST read `localStorage` during initialization and restore the token signal if a stored token exists, so a page reload does not require re-login.

#### Scenario: Reload while authenticated keeps user logged in

- GIVEN the user authenticated and `auth_token` exists in `localStorage`
- WHEN the Angular application is loaded (e.g. page refresh)
- THEN the `AuthStore` token signal is set to the stored value
- AND `AuthGuard` allows access to protected routes without re-login

#### Scenario: No stored token results in null signal

- GIVEN `localStorage` has no `auth_token` key
- WHEN the Angular application is loaded
- THEN the `AuthStore` token signal remains `null`

---

## Capability: frontend-shell

### Requirement: Layout Shell Composes Sidebar, Header, and Router Outlet

The `LayoutComponent` MUST be a standalone, OnPush component that composes `SidebarComponent` and `HeaderComponent` (both standalone, OnPush) with a `<router-outlet>`. The `/login` route MUST render outside the layout shell.

#### Scenario: Protected route renders inside layout shell

- GIVEN an authenticated user navigating to a protected route
- WHEN the route resolves
- THEN `LayoutComponent` is rendered containing `SidebarComponent`, `HeaderComponent`, and the routed component inside `<router-outlet>`

#### Scenario: Login route renders without layout shell

- GIVEN a user navigating to `/login`
- WHEN the route resolves
- THEN `LoginPageComponent` is rendered directly, without `LayoutComponent` wrapping it

---

### Requirement: All Components Are Standalone and OnPush

Every Angular component created in `fase-1` MUST declare `standalone: true` and `changeDetection: ChangeDetectionStrategy.OnPush`. NgModules MUST NOT be created.

#### Scenario: Component metadata conformance

- GIVEN any component file under `src/app/`
- WHEN the `@Component` decorator is inspected
- THEN `standalone: true` is present
- AND `changeDetection: ChangeDetectionStrategy.OnPush` is present

---

### Requirement: Feature Routes Are Lazy-Loaded

The root route table MUST use `loadComponent` or `loadChildren` for every feature. No feature component MUST be eagerly imported in `app.routes.ts`.

#### Scenario: Auth feature is lazy-loaded

- GIVEN the Angular app boots
- WHEN the router processes the route table
- THEN the `features/auth` chunk is NOT included in the initial bundle
- AND it is downloaded only when the user navigates to `/login`
