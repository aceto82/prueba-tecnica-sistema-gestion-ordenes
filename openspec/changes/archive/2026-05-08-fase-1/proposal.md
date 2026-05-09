# Proposal: Fase 1 — Foundation (Auth + Scaffold)

## Intent

Bootstrap the Order Management System monorepo with the architectural skeleton required by every subsequent phase. We need authenticated access (JWT) and the layered structure (hexagonal backend, feature-based Angular) BEFORE business features (orders, customers, dashboard) can be built. Without this phase there is no entry point, no security boundary, and no shell to host any feature.

Success means: a developer can clone the repo, run backend + frontend, log in via `/api/auth/login`, receive a JWT, and land on a protected layout shell ready for Fase 2 features.

## Scope

### In Scope

**Backend (Spring Boot 3.x / Java 17+)**
- Maven/Gradle project scaffold with hexagonal package layout (`config`, `domain`, `application`, `infrastructure/{persistence,security,web}`)
- PostgreSQL connection via Spring Data JPA (`application.yml` profiles: dev, test)
- Pure domain entities (no JPA): `User`, `Customer`, `Order` + supporting value objects
- JPA entities + mappers in `infrastructure/persistence` (domain <-> persistence isolation)
- Spring Security config with stateless session policy + JWT filter chain
- `POST /api/auth/login` endpoint issuing a signed JWT (HS256, configurable secret + TTL)
- `JwtAuthenticationFilter` validating bearer tokens on protected routes
- `UserDetailsServiceImpl` backed by user repository
- Global exception handler returning RFC-7807 problem details for 401/403/400
- BCrypt password encoder bean

**Frontend (Angular 18)**
- Angular CLI scaffold, strict mode, standalone bootstrap (`bootstrapApplication`)
- Folder layout: `core/{services,interceptors,guards}`, `shared/{components,ui}`, `features/{auth,orders,customers,dashboard}` (feature dirs created empty for orders/customers/dashboard)
- Routing with lazy-loaded feature routes (`loadComponent` / `loadChildren`)
- `JwtInterceptor` (functional) attaching bearer header
- `AuthGuard` (functional) redirecting unauthenticated users to `/login`
- `AuthService` + `AuthStore` (Signals-based) holding token + current user
- Layout shell (`shared/ui`): `Sidebar`, `Header`, content `<router-outlet>` — all standalone, OnPush
- `features/auth`: login page (reactive forms, calls `/api/auth/login`, persists token)

**Cross-cutting**
- Repo structure: `backend/`, `frontend/`, root `README.md`
- `.env.example` / `application-dev.yml` documenting required env vars
- CORS config allowing the Angular dev server origin

### Out of Scope

- Order/Customer CRUD endpoints and UI (Fase 2)
- Refresh tokens, password reset, registration flow, role-based UI
- Dashboard widgets, charts, KPIs (Fase 3)
- E2E tests, CI/CD pipelines, Dockerization
- Production hardening (rate limiting, audit log, secrets manager)
- DB migrations tooling decision (Flyway/Liquibase) — deferred to Fase 2 when schema grows

## Capabilities

### New Capabilities
- `auth-jwt-backend`: stateless JWT auth on the Spring Boot side — login endpoint, token issuance, filter, user details service
- `auth-frontend`: Angular login feature, auth store, JWT interceptor, route guard
- `backend-scaffold`: hexagonal package layout, domain/persistence separation, Security config, PostgreSQL wiring
- `frontend-shell`: standalone bootstrap, layout shell (Sidebar/Header), feature-based folder layout, lazy-loaded routing

### Modified Capabilities
None — greenfield project.

## Approach

**Backend — hexagonal from day one.** Domain entities live in `domain/` as plain Java records/classes with NO JPA annotations. Infrastructure provides JPA `@Entity` doubles plus mappers. This pays off later when business rules grow: domain stays pure, swapping persistence is a mapper change, tests don't need a DB.

**Auth — stateless JWT, no sessions.** `SecurityFilterChain` uses `STATELESS` session policy, disables CSRF for the API, permits `/api/auth/login`, requires authentication elsewhere. `JwtAuthenticationFilter` extends `OncePerRequestFilter`, parses `Authorization: Bearer ...`, validates signature + expiry, populates `SecurityContext`. JWT secret + TTL injected via `@ConfigurationProperties`.

**Frontend — standalone + Signals.** No NgModules. `bootstrapApplication(AppComponent, { providers: [...] })` wires router, HTTP with functional interceptors, and the auth provider. `AuthStore` is an `@Injectable({ providedIn: 'root' })` class exposing `signal<User|null>` and `signal<string|null>` for the token. Persistence to `localStorage` happens inside the store. All components use `ChangeDetectionStrategy.OnPush`. Routes lazy-load feature components — Fase 1 only ships `auth/login`, the rest are placeholder route entries.

**Layout shell as a presentational composition.** `LayoutComponent` (in `shared/ui/layout`) hosts `<app-sidebar>`, `<app-header>`, `<router-outlet>`. The auth-protected routes render inside this shell; `/login` renders without it. This is the screaming architecture seed for Fase 2+.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/pom.xml` (or `build.gradle`) | New | Spring Boot, Security, JPA, PostgreSQL, jjwt deps |
| `backend/src/main/java/.../config/` | New | `SecurityConfig`, `JwtProperties`, `WebMvcConfig` (CORS) |
| `backend/src/main/java/.../domain/` | New | `User`, `Customer`, `Order` pure entities |
| `backend/src/main/java/.../infrastructure/persistence/` | New | JPA entities + repos + mappers |
| `backend/src/main/java/.../infrastructure/security/` | New | `JwtAuthenticationFilter`, `JwtService`, `UserDetailsServiceImpl` |
| `backend/src/main/java/.../infrastructure/web/` | New | `AuthController`, `LoginRequest`/`LoginResponse` DTOs |
| `backend/src/main/resources/application*.yml` | New | DB + JWT config |
| `frontend/src/app/app.config.ts` | New | Standalone bootstrap providers |
| `frontend/src/app/app.routes.ts` | New | Lazy-loaded route table |
| `frontend/src/app/core/` | New | `AuthService`, `JwtInterceptor`, `AuthGuard` |
| `frontend/src/app/shared/ui/layout/` | New | `LayoutComponent`, `SidebarComponent`, `HeaderComponent` |
| `frontend/src/app/features/auth/` | New | `LoginPageComponent`, `AuthStore` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Domain/persistence separation feels like overhead in Fase 1 | Med | Keep mappers minimal; the payoff lands in Fase 2 — document the rationale in code comments |
| JWT secret committed to repo by accident | Med | Use `application-dev.yml` placeholder + `.env.example`; never commit real secret |
| CORS misconfiguration blocks the Angular dev server | High | Explicit allowed origin in `WebMvcConfig`; test login from Angular before closing the phase |
| Standalone-only Angular catches devs unfamiliar with v18 | Low | README snippet showing the pattern; no NgModules anywhere reinforces consistency |
| OnPush + Signals interaction subtleties (forgetting `signal()` reads inside templates) | Low | Lint rule + code review; Signals re-render automatically when read in template |
| No DB migrations tool means manual schema management | Med | Use `spring.jpa.hibernate.ddl-auto=update` for Fase 1 only; pick Flyway in Fase 2 |
| Token in `localStorage` is XSS-exposed | Med | Acceptable for the test scope; document the tradeoff; future phase can move to httpOnly cookie |

## Rollback Plan

Greenfield repo — rollback is `git reset` / branch deletion. No migrations to revert, no production traffic to drain. If JWT design proves wrong mid-phase, the swap is contained to `infrastructure/security/` + `core/interceptors/` + `AuthStore`.

## Dependencies

- PostgreSQL 14+ available locally (Docker compose acceptable but not required this phase)
- Java 17 JDK
- Node 20+ and Angular CLI 18

## Success Criteria

- [ ] `mvn spring-boot:run` (or gradle equivalent) starts the backend against PostgreSQL with no errors
- [ ] `ng serve` boots the frontend on port 4200 without compilation warnings
- [ ] `POST /api/auth/login` with seeded credentials returns a valid JWT
- [ ] Hitting any non-auth endpoint without `Authorization` header returns 401
- [ ] Hitting it WITH a valid bearer token returns 200 (even if endpoint is a placeholder)
- [ ] Angular login page authenticates against the backend, stores token, and routes the user to a protected layout shell
- [ ] Reloading the page while authenticated keeps the user logged in (token rehydrated from `localStorage`)
- [ ] Backend folder layout matches `config / domain / application / infrastructure/{persistence,security,web}`
- [ ] Frontend folder layout matches `core / shared / features` with placeholder feature dirs
- [ ] No JPA annotations exist in any file under `domain/`
- [ ] All Angular components are standalone and use `ChangeDetectionStrategy.OnPush`
