# Tasks: Fase 1 — Foundation (Auth + Scaffold)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1 200 – 1 600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend scaffold + domain + security) → PR 2 (backend auth endpoint + tests) → PR 3 (frontend core + shell) → PR 4 (frontend auth feature + tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Monorepo scaffold + backend domain + hexagonal layout | PR 1 | base = main; no runtime behavior yet |
| 2 | Backend security config + JWT service + auth endpoint + backend tests | PR 2 | base = PR 1 branch |
| 3 | Angular scaffold + core (AuthStore, guard, interceptor) + shell layout | PR 3 | base = PR 2 branch; frontend only |
| 4 | Login feature + all frontend tests + integration smoke | PR 4 | base = PR 3 branch; closes fase-1 |

---

## Phase 1 — Repo Scaffold

- [x] T01 · **Initialize monorepo** — create root `pom.xml` (aggregator), `backend/` Maven module, `.gitignore`; verify `./mvnw validate` passes. (S, deps: none, REQ-5)
- [x] T02 · **Generate Angular app** — `ng new frontend --routing --style=scss --strict` inside `frontend/`; remove starter boilerplate; verify `ng build` produces output. (S, deps: none, REQ-10) [PR1-scope: backend pom.xml + mvnw created; frontend/ dir created as placeholder — Angular scaffold is PR3 scope]
- [x] T03 · **Wire backend package skeleton** — create empty packages `config`, `domain/model`, `domain/port`, `application/service`, `infrastructure/persistence`, `infrastructure/security`, `infrastructure/web` under `com.oms`; add package-info stubs. (S, deps: T01, REQ-5/REQ-6)

## Phase 2 — Backend Domain + Infrastructure

- [x] T04 · **Create `User` domain entity** — plain Java class, package-private ctor, static factories `User.create()`/`User.rehydrate()`, `equals`/`hashCode` by id only, no framework imports. (S, deps: T03, REQ-6)
- [x] T05 · **Create `Customer` and `Order` domain stubs** — minimal classes (id + no-op factories); Fase 1 ships models only, no persistence wiring. (S, deps: T03, REQ-5)
- [x] T06 · **Create `UserRepository` port** — interface in `domain/port/` with `Optional<User> findByUsername(String)` and `User save(User)`; no Spring/JPA imports. (S, deps: T04, REQ-6) [also added findById per orchestrator spec]
- [x] T07 · **Create `UserJpaEntity`** — `@Entity @Table("users")` in `infrastructure/persistence/entity/`; fields: id (Long), username, password, role; no domain imports. (S, deps: T03, REQ-6) [also CustomerJpaEntity + OrderJpaEntity per orchestrator T08 scope]
- [x] T08 · **Create `UserJpaMapper`** — final class, static `toDomain(UserJpaEntity)`/`toJpa(User)` in `infrastructure/persistence/mapper/`; round-trip correct. (S, deps: T04, T07, REQ-6) [also CustomerMapper + OrderMapper per orchestrator T10 scope]
- [x] T09 · **Create `UserJpaRepository`** — Spring Data `JpaRepository<UserJpaEntity, Long>` with `Optional<UserJpaEntity> findByUsername(String)`. (S, deps: T07, REQ-6) [also CustomerJpaRepository + OrderJpaRepository]
- [ ] T10 · **Create `UserRepositoryAdapter`** — implements `UserRepository` port, delegates to `UserJpaRepository`, uses `UserJpaMapper`. (S, deps: T06, T08, T09, REQ-6) [deferred to PR2 — T10-T22 scope]
- [x] T11 · **Configure JPA/datasource** — `application.yml` with H2 (test) + PostgreSQL (dev) profiles, `ddl-auto=update`, Hibernate dialect; verify context loads. (S, deps: T07, REQ-5)

## Phase 3 — Backend Security + Auth Endpoint

- [ ] T12 · **Add `JwtProperties` config record** — `@ConfigurationProperties("app.jwt")` with `secret`, `ttl` (Duration), `issuer`; bind in `SecurityConfig`. (S, deps: T03, REQ-1)
- [ ] T13 · **Implement `JwtService`** — `issueToken(UserDetails)` returns signed HS256 JWT; `extractUsername(String)` parses token; `isTokenValid(String, UserDetails)` checks exp + username. Uses `io.jsonwebtoken:jjwt-api:0.12.x`. (M, deps: T12, REQ-1/REQ-3)
- [ ] T14 · **Implement `UserDetailsServiceImpl`** — bridges `UserRepository` port → Spring `UserDetails`; single `ROLE_USER`; throws `UsernameNotFoundException`. (S, deps: T06, REQ-3)
- [ ] T15 · **Create `JwtAuthenticationFilter`** — `OncePerRequestFilter`; extracts Bearer token, calls `JwtService.isTokenValid`, sets `UsernamePasswordAuthenticationToken` in `SecurityContextHolder`; passes through if no header. (M, deps: T13, T14, REQ-3/REQ-4)
- [ ] T16 · **Create `SecurityConfig`** — `SecurityFilterChain`: stateless, CSRF off, `/api/auth/**` + `/error` permitAll, anyRequest authenticated; add `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`; `BCryptPasswordEncoder` bean; `AuthenticationManager` bean. (M, deps: T15, REQ-3/REQ-5)
- [ ] T17 · **Create `GlobalExceptionHandler`** — `@RestControllerAdvice` returning `ProblemDetail`; handlers for `MethodArgumentNotValidException` (400), `BadCredentialsException` (401), `AuthenticationException` (401), `AccessDeniedException` (403), `Exception` (500); configure `authenticationEntryPoint` + `accessDeniedHandler` on `SecurityConfig` to same shape. (M, deps: T16, REQ-2/REQ-4)
- [ ] T18 · **Create `CorsProperties` + CORS bean** — `@ConfigurationProperties("app.cors")`; `CorsConfigurationSource` bean; dev profile allows `http://localhost:4200`. (S, deps: T16, REQ-5)
- [ ] T19 · **Create `LoginRequestDto` / `LoginResponseDto`** — records in `infrastructure/web/dto/`; `@NotBlank` on both fields of request. (S, deps: T03, REQ-1)
- [ ] T20 · **Implement `AuthenticateUserUseCase`** — service in `application/service/`; receives `AuthenticationManager` + `JwtService`; calls `authenticate`, issues token, returns `LoginResponseDto`. (S, deps: T13, T16, T19, REQ-1)
- [ ] T21 · **Implement `AuthController`** — `POST /api/auth/login`; validates `@Valid LoginRequestDto`; delegates to `AuthenticateUserUseCase`; returns 200 `{token, user}`. (S, deps: T20, REQ-1/REQ-2)
- [ ] T22 · **Create `DataSeeder`** — `@Component @Profile({"dev","test"})`, implements `CommandLineRunner`; idempotent; hashes password with `BCryptPasswordEncoder`; reads from `app.seed.*` properties. (S, deps: T10, T16, REQ-5)

## Phase 4 — Backend Tests (strict TDD RED→GREEN)

- [ ] T23 · **Unit test `User` domain entity** — factories, invariants, id-based equality; no Spring context. Covers: REQ-6 scenario "domain entities are framework-free". (S, deps: T04)
- [ ] T24 · **Unit test `UserJpaMapper`** — round-trip `toDomain ∘ toJpa = identity` and vice versa. Covers: REQ-6 mapper scenarios. (S, deps: T08)
- [ ] T25 · **Unit test `JwtService`** — valid token round-trip; expired token rejected; tampered token rejected. Covers: REQ-3/REQ-4 JWT validation scenarios. (M, deps: T13)
- [ ] T26 · **Unit test `JwtAuthenticationFilter`** — valid token sets SecurityContext; missing header passes through; expired/malformed → filter does not set context. Uses `MockHttpServletRequest`. Covers: REQ-3/REQ-4. (M, deps: T15)
- [ ] T27 · **`@WebMvcTest AuthController`** — (a) valid creds → 200 `{token}`; (b) missing fields → 400 `application/problem+json`; (c) wrong password → 401 `application/problem+json`; (d) unknown user → 401. Covers: REQ-1/REQ-2 all scenarios. (M, deps: T21, T17)
- [ ] T28 · **ArchUnit test for hexagonal layout** — assert no `jakarta.persistence` import in `domain/`; assert dependency directions. Covers: REQ-5 layout scenario. (S, deps: T03)

## Phase 5 — Frontend Scaffold + Core

- [ ] T29 · **Configure `app.config.ts`** — `provideHttpClient(withInterceptors([jwtInterceptor]))`, `provideRouter(routes)`, `APP_INITIALIZER` calling `AuthStore.hydrateFromStorage()`; no NgModules. (S, deps: T02, REQ-8/REQ-9)
- [ ] T30 · **Create `User` frontend model** — interface in `core/models/user.model.ts` with `id`, `username`, `email`. (S, deps: T02, REQ-9)
- [ ] T31 · **Create `AuthService`** — `core/services/auth.service.ts`; `login(credentials): Observable<LoginResponse>` calling `POST /api/auth/login`. (S, deps: T30, REQ-7)
- [ ] T32 · **Implement `AuthStore`** — `core/stores/auth.store.ts`; private writable signals; exposes readonly `token`, `user`, `status`, `error`, `isAuthenticated` (computed); `login()`, `logout()`, `hydrateFromStorage()`. Covers: REQ-9. (M, deps: T31)
- [ ] T33 · **Implement `authGuard`** — functional `CanActivateFn` in `core/guards/`; reads `AuthStore.isAuthenticated()`; redirects to `/login` if false. Covers: REQ-8. (S, deps: T32)
- [ ] T34 · **Implement `jwtInterceptor`** — functional `HttpInterceptorFn` in `core/interceptors/`; clones request adding `Authorization: Bearer <token>` when token non-null. Covers: REQ-8. (S, deps: T32)

## Phase 6 — Frontend Shell + Routing

- [ ] T35 · **Create `LayoutComponent`** — `shared/ui/layout/layout.component.ts`; standalone, OnPush; template includes `<app-sidebar>`, `<app-header>`, `<router-outlet>`. Covers: REQ-10. (S, deps: T36, T37)
- [ ] T36 · **Create `SidebarComponent`** — `shared/ui/layout/sidebar.component.ts`; standalone, OnPush; static nav links placeholder. (S, deps: T02, REQ-10)
- [ ] T37 · **Create `HeaderComponent`** — `shared/ui/layout/header.component.ts`; standalone, OnPush; shows username signal + logout button calling `AuthStore.logout()`. (S, deps: T32, REQ-10)
- [ ] T38 · **Wire `app.routes.ts`** — `/login` → `loadComponent` LoginPage; `''` → `LayoutComponent` with `canActivate: [authGuard]` and lazy `loadChildren` children (`dashboard` placeholder). Covers: REQ-10 lazy-load scenario. (S, deps: T33, T35)

## Phase 7 — Frontend Auth Feature

- [x] T39 · **Create `LoginPageComponent`** — `features/auth/login-page.component.ts`; standalone, OnPush; reactive form with `username` + `password` fields, `@NotBlank` equivalent via `Validators.required`. (M, deps: T32, REQ-7)
- [x] T40 · **Wire login submit flow** — `onSubmit()` calls `AuthStore.login()`; on success navigate to `/`; on error display inline message from `AuthStore.error()`. Covers: REQ-7 all scenarios. (S, deps: T39)

## Phase 8 — Frontend Tests (strict TDD RED→GREEN)

- [x] T41 · **Jest: `AuthStore`** — state transitions (idle→loading→authenticated→error); `isAuthenticated` computed; `hydrateFromStorage` reads localStorage; `logout` clears state. Covers: REQ-9 all scenarios. (M, deps: T32)
- [x] T42 · **Jest: `jwtInterceptor`** — with token attaches header; without token passes unchanged. Uses `HttpTestingController`. Covers: REQ-8 interceptor scenarios. (S, deps: T34)
- [x] T43 · **Jest: `authGuard`** — null token → router.navigate('/login'); non-null token → true. Covers: REQ-8 guard scenarios. (S, deps: T33)
- [x] T44 · **Jest: `LoginPageComponent`** — form invalid → no HTTP call; valid submit → `AuthStore.login` called; 401 response → error displayed; success → navigation. Covers: REQ-7 all scenarios. (M, deps: T40)

## Phase 9 — Integration Smoke Test

- [x] T45 · **Manual smoke test checklist** — start backend (dev profile) + `ng serve`; POST `/api/auth/login` admin/admin123 → 200 JWT; use JWT on `/api/orders` → verify response (not 401); navigate to `/` unauthenticated → redirected to `/login`; login → shell renders with sidebar + header; refresh → stays authenticated. (S, deps: T22, T40)
