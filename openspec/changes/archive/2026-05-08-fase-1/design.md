# Design: Fase 1 — Foundation (Auth + Scaffold)

> Architectural HOW for the OMS bootstrap phase. Focuses on decisions and rationale, not file enumeration (that lives in `tasks.md`).

## 1. Architecture Overview

### Backend — Hexagonal (Ports & Adapters), shallow

```
config/             ← Spring beans, properties, security wiring
domain/             ← pure Java; no framework annotations
  ├─ model/         (User, Customer, Order)
  └─ port/          (UserRepository — interface, no JPA)
application/        ← use cases (AuthenticateUserUseCase)
  └─ service/
infrastructure/
  ├─ persistence/   ← JPA entities, Spring Data repos, mappers, port impls
  ├─ security/      ← JwtService, JwtAuthenticationFilter, UserDetailsServiceImpl
  └─ web/           ← Controllers, DTOs, exception handler
```

**Dependency rule** (enforced by package layout, optionally by ArchUnit later):
`domain ← application ← infrastructure ← config`. Domain knows nobody. Application depends only on domain ports. Infrastructure adapts ports to JPA/Spring Security/MVC.

Fase 1 keeps this **shallow** — only `User` exercises the full vertical (domain model + port + JPA double + mapper + adapter). `Customer` and `Order` ship as domain models only; their persistence wiring lands in Fase 2 alongside CRUD.

### Frontend — Feature-based, standalone, Signals-first

```
src/app/
  app.config.ts          ← bootstrapApplication providers
  app.routes.ts          ← root route table (lazy-loads features)
  core/
    services/auth.service.ts
    services/auth.store.ts
    interceptors/jwt.interceptor.ts
    guards/auth.guard.ts
    models/user.model.ts
  shared/
    ui/layout/{layout,sidebar,header}.component.ts
  features/
    auth/{login.page,auth.routes}.ts
    orders/        (placeholder — Fase 2)
    customers/     (placeholder — Fase 2)
    dashboard/     (placeholder — Fase 3)
```

**Composition rule**: protected routes are children of a `LayoutComponent` parent route; `/login` is a sibling outside the shell.

---

## 2. ADRs (Architectural Decision Records)

### ADR-1 — JWT library: `io.jsonwebtoken:jjwt` (0.12.x)

**Decision**: use `jjwt-api` + `jjwt-impl` + `jjwt-jackson`, version 0.12.x.

**Rationale**:
- Builder API is the most ergonomic of the JVM JWT options for HS256-with-shared-secret (our case).
- 0.12.x split the API (`Jwts.builder()`, `Jwts.parser().verifyWith(SecretKey)`) so signature verification is type-safe.
- Tiny surface area — we need sign + parse + extract claims, nothing else. No JWE, no JWKS rotation, no OAuth2.
- Jackson is already on the classpath via Spring Web; no extra serializer.

**Rejected alternatives**:
- `nimbus-jose-jwt` — far more capable (JWE, JWKS, OAuth2 flows) but the API is verbose for plain HS256 and pulls in BouncyCastle behavior we do not need. Overkill for Fase 1.
- `auth0/java-jwt` — viable, but the maintained jjwt is more idiomatic in the Spring Security ecosystem and has clearer migration path to RS256 if we ever rotate.

**Tradeoffs**: if Fase 3+ needs JWKS-based rotation, we revisit. Switch cost is contained to `JwtService`.

---

### ADR-2 — Domain entity representation: **classes**, not records

**Decision**: domain entities are regular Java classes with private fields, validated constructors, and intention-revealing methods. Not `record`.

**Rationale**:
- Records are concise but force a public canonical constructor, expose every field via accessor, and make invariants awkward (you validate in compact constructor only). Domain modeling needs:
  - **Encapsulation of invariants** (e.g. `User.changePassword(String raw, PasswordHasher h)` enforces hashing — a record would have to expose `passwordHash` getter and let callers mutate via `with(...)`).
  - **Behavior beyond data** (DDD: entities are not DTOs).
  - **Identity-based equality** (records use value equality on all fields — wrong for entities; two `User` rows with same id are the same entity even if `lastLoginAt` differs).
- Records are a good fit for **value objects** and **DTOs**. We will use them there (e.g. `LoginRequest`, `LoginResponse`, `Email` value object if introduced).

**Rejected alternatives**:
- Records for entities — fails identity equality and invariant enforcement.
- Lombok `@Data` — generates equals/hashCode on all fields (same problem as records) and hides constructors. Avoided.

**Tradeoffs**: more boilerplate per entity (constructor, getters, equals on id). Acceptable cost for correctness.

**Convention**: domain classes are package-private constructors + static factory `User.create(...)` for new aggregates and `User.rehydrate(...)` for reconstruction by the persistence adapter. Equality is `id`-based.

---

### ADR-3 — Mapper pattern: **stateless utility classes** with static methods, colocated with the JPA entity

**Decision**: each JPA entity has a sibling `XxxJpaMapper` final class with static `toDomain(JpaEntity)` and `toJpa(DomainEntity)` methods. Lives in `infrastructure/persistence/<aggregate>/`.

**Rationale**:
- Mappers are pure functions over data. No state, no dependencies → no need to be Spring beans.
- Static methods compose cleanly inside repository adapters (`return userJpaRepository.findById(id).map(UserJpaMapper::toDomain)`).
- Colocation with the JPA entity (same package) keeps the boundary obvious: when you change the JPA shape, the mapper is right there.
- No MapStruct — manual mappers are explicit, debuggable, and Fase 1 has 1 aggregate to map. Annotation processor cost is not worth it.

**Rejected alternatives**:
- Spring `@Component` mapper — adds DI ceremony for zero benefit; mappers don't need a lifecycle.
- Interface with `default` methods — Java's static-on-interface is fine, but a `final class` with private constructor is the canonical "utility" pattern and prevents accidental subclassing.
- MapStruct — revisit in Fase 2 if we end up with 5+ aggregates and repetitive mapping. Premature in Fase 1.

**Convention**:
```java
public final class UserJpaMapper {
  private UserJpaMapper() {}
  public static User toDomain(UserJpaEntity e) { ... }
  public static UserJpaEntity toJpa(User u) { ... }
}
```

---

### ADR-4 — `SecurityFilterChain` configuration

**Decision**: a single `SecurityFilterChain` bean in `config/SecurityConfig.java`. Stateless, CSRF off (API-only), CORS on, `JwtAuthenticationFilter` registered **before** `UsernamePasswordAuthenticationFilter`.

**Rationale**:
- One chain is sufficient for Fase 1 — there is no admin-only or anonymous-public surface beyond `/api/auth/**`.
- Placing the JWT filter before `UsernamePasswordAuthenticationFilter` is the canonical Spring Security 6 pattern: by the time the framework would try form-login, the JWT filter has already populated `SecurityContext` (or left it empty so the entry point returns 401).

**Configuration shape** (architectural, not a literal copy-paste):

```
http
  .cors(Customizer.withDefaults())
  .csrf(csrf -> csrf.disable())
  .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
  .authorizeHttpRequests(auth -> auth
      .requestMatchers("/api/auth/**").permitAll()
      .requestMatchers("/error").permitAll()
      .anyRequest().authenticated())
  .exceptionHandling(eh -> eh
      .authenticationEntryPoint(problemDetailsEntryPoint)   // 401 RFC-7807
      .accessDeniedHandler(problemDetailsAccessDeniedHandler)) // 403 RFC-7807
  .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
  .formLogin(AbstractHttpConfigurer::disable)
  .httpBasic(AbstractHttpConfigurer::disable);
```

`AuthenticationManager` exposed as a bean from `AuthenticationConfiguration.getAuthenticationManager()` so `AuthController` can authenticate the login request via `authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(...))`.

`PasswordEncoder` bean returns `BCryptPasswordEncoder()` (default strength 10).

`UserDetailsServiceImpl` is the bridge: takes the `UserRepository` port, returns `org.springframework.security.core.userdetails.User` built from the domain `User`'s username + password hash + a single `ROLE_USER` authority for Fase 1 (roles arrive in later phases).

---

### ADR-5 — Angular `AuthStore` interface (Signals-based)

**Decision**: `AuthStore` is a `@Injectable({ providedIn: 'root' })` class. It owns auth state via private writable signals and exposes only readonly slices and computed flags. State mutations happen exclusively through methods.

**Public surface**:

```ts
@Injectable({ providedIn: 'root' })
export class AuthStore {
  // === Readonly state (signals exposed via .asReadonly()) ===
  readonly user: Signal<User | null>;
  readonly token: Signal<string | null>;
  readonly status: Signal<'idle' | 'loading' | 'authenticated' | 'error'>;
  readonly error: Signal<string | null>;

  // === Computed ===
  readonly isAuthenticated: Signal<boolean>; // computed(() => !!this.token() && !!this.user())

  // === Commands ===
  login(credentials: LoginRequest): Observable<void>;  // returns Observable for caller to subscribe; internally updates signals
  logout(): void;                                       // clears signals + localStorage, navigates to /login
  hydrateFromStorage(): void;                           // called once by APP_INITIALIZER or in constructor

  // === Internal helpers (private) ===
  // setAuthenticated(user, token), setError(msg), setLoading()
}
```

**Rationale**:
- Readonly signals are a hard contract — components cannot mutate state outside `login`/`logout`. This is the Signals-equivalent of the "no public BehaviorSubject" rule.
- `isAuthenticated` as `computed` means the guard, the layout shell, and the header all react automatically without re-deriving in each consumer.
- `login` returns an `Observable<void>` (not a Promise) so the `LoginPage` can chain side effects (router navigation, toast) using RxJS operators consistent with Angular's HTTP layer. Internal state updates happen via `tap`.
- `hydrateFromStorage` runs at startup to rehydrate from `localStorage`. Decoded JWT exp is checked; if expired, state stays empty and the token is purged.

**Rejected alternatives**:
- NgRx / NgRx SignalStore — overkill for a single auth slice in Fase 1. Revisit if Fase 3 introduces multiple shared state slices.
- BehaviorSubject-based store — works, but mixes paradigms with Signals-first project direction.
- Plain service with public mutable signals — leaks write access to every consumer.

---

### ADR-6 — Angular routing: `LayoutComponent` as parent route

**Decision**: protected routes live as children of a route whose `component` is `LayoutComponent`; `/login` is a sibling at the root level. The `AuthGuard` is attached to the **parent** protected route, so all children inherit it.

**Shape**:

```ts
// app.routes.ts
export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then(m => m.LoginPage),
  },
  {
    path: '',
    component: LayoutComponent,         // sidebar + header + <router-outlet/>
    canActivate: [authGuard],           // functional guard
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes) },
      // orders, customers — Fase 2
    ],
  },
  { path: '**', redirectTo: '' },
];
```

**Rationale**:
- The shell renders once and persists across child route changes — sidebar/header don't tear down on navigation.
- Single `canActivate` on the parent is DRY: every child is protected by construction. Forgetting to guard a new feature route is impossible.
- `/login` outside the shell means the login page renders without sidebar/header (correct UX).
- `authGuard` is functional (`CanActivateFn`) per Angular 18 guidance — no class guard.

**Rejected alternatives**:
- Guarding each feature route individually — error-prone, repetitive.
- Conditional rendering of sidebar inside `AppComponent` — couples auth state to template logic instead of routing.

---

### ADR-7 — CORS configuration

**Decision**: a single `CorsConfigurationSource` bean configured via `@ConfigurationProperties("app.cors")`. Allowed origins are profile-driven.

**Configuration**:

```yaml
# application-dev.yml
app:
  cors:
    allowed-origins: ["http://localhost:4200"]
    allowed-methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
    allowed-headers: ["*"]
    exposed-headers: ["Authorization"]
    allow-credentials: false
    max-age: 3600
```

```yaml
# application-test.yml
app:
  cors:
    allowed-origins: ["http://localhost:4200"]
    # rest inherited
```

**Rationale**:
- Profile-driven origins prevent the dev URL from leaking into prod-like profiles. Production profile (Fase later) will set origins via env var.
- `allow-credentials: false` because tokens travel in the `Authorization` header, not cookies. Combined with `localStorage` storage (per proposal), this is consistent.
- `Authorization` exposed so the frontend can read it from responses if ever returned in a header (defensive, not strictly needed for login since token is in body).
- Single bean, registered via `http.cors(Customizer.withDefaults())` in the security chain — Spring picks it up automatically.

**Tradeoffs**: switching to cookie-based auth in the future requires `allow-credentials: true` AND replacing `*` with explicit allowed headers. Documented in Fase 1 README.

---

### ADR-8 — Seeded test user: `CommandLineRunner`, idempotent

**Decision**: a `DataSeeder` `@Component` implementing `CommandLineRunner` runs on the `dev` profile only and inserts a single test user if it does not already exist.

**Rationale**:
- `data.sql` has two killers: it runs **before** Hibernate creates the schema with `ddl-auto=update` (ordering footgun), and the password would be a literal BCrypt hash hard-coded in SQL — opaque and rotation-unfriendly.
- A `CommandLineRunner` bean runs **after** the context is up and the schema exists. It can use the real `PasswordEncoder` bean to hash on the fly, so the seed value lives in YAML/env and is rotatable.
- `@Profile("dev")` (and `test`) means production will not auto-seed.
- Idempotency: `if (userRepository.findByUsername(seed.username()).isEmpty()) { ... }`.

**Configuration shape**:

```yaml
app:
  seed:
    enabled: true
    username: admin
    password: admin123    # dev only; documented in README
    email: admin@oms.local
```

```java
@Component
@Profile({"dev","test"})
@RequiredArgsConstructor   // or manual constructor
public class DataSeeder implements CommandLineRunner {
  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final SeedProperties props;

  @Override public void run(String... args) {
    if (!props.enabled()) return;
    if (users.findByUsername(props.username()).isPresent()) return;
    var u = User.create(props.username(), props.email(), encoder.encode(props.password()));
    users.save(u);
  }
}
```

**Rejected alternatives**:
- `data.sql` — ordering and hash-in-SQL problems.
- Flyway migration with seed insert — Flyway is explicitly out of scope (Fase 2).
- Manual `psql` step — terrible DX, breaks "clone and run" success criterion.

---

### ADR-9 — RFC-7807 error response shape

**Decision**: a `@RestControllerAdvice` `GlobalExceptionHandler` returns Spring's built-in `ProblemDetail` (`org.springframework.http.ProblemDetail`) for every handled exception. Spring 6 already serializes it as `application/problem+json`.

**Standard fields** (per RFC 7807):

| Field | Source | Example |
|---|---|---|
| `type` | URI identifying the error class; `about:blank` if generic | `https://oms.local/errors/validation` |
| `title` | Short, human, stable across instances | `"Validation failed"` |
| `status` | HTTP status code | `400` |
| `detail` | Human-readable, instance-specific | `"Field 'username' must not be blank"` |
| `instance` | URI of the failing request | `/api/auth/login` |

**Extension fields** (custom, allowed by RFC):

| Field | Purpose |
|---|---|
| `timestamp` | ISO-8601 instant (`Instant.now()`) — supports debugging |
| `errors` | Array of `{field, message}` for `MethodArgumentNotValidException` only |
| `traceId` | Request correlation id (placeholder for now; wired in Fase 3 with proper observability) |

**Mapped exceptions for Fase 1**:

| Exception | Status | `title` | `type` slug |
|---|---|---|---|
| `MethodArgumentNotValidException` | 400 | "Validation failed" | `/errors/validation` |
| `BadCredentialsException` | 401 | "Invalid credentials" | `/errors/authentication` |
| `AuthenticationException` (other) | 401 | "Authentication required" | `/errors/authentication` |
| `AccessDeniedException` | 403 | "Access denied" | `/errors/authorization` |
| `EntityNotFoundException` (custom domain) | 404 | "Resource not found" | `/errors/not-found` |
| `Exception` (fallback) | 500 | "Internal server error" | `/errors/internal` |

**Rationale**:
- `ProblemDetail` is the Spring-native, framework-supported approach. No custom DTO. Less code, more conformance.
- Stable `title` + variable `detail` is the RFC's design — clients dispatch on `type`/`title`, humans read `detail`.
- Authentication and authorization failures must go through the **security entry point / access denied handler** (configured in `SecurityConfig`), not the exception advice — these fire before the dispatcher servlet. Both delegate to the same `ProblemDetail` builder for shape consistency.
- `errors[]` only on validation; not present on other shapes. Optional extension fields are fine per RFC 7807 §3.2.

**Example wire format**:

```json
{
  "type": "https://oms.local/errors/validation",
  "title": "Validation failed",
  "status": 400,
  "detail": "One or more fields are invalid",
  "instance": "/api/auth/login",
  "timestamp": "2026-05-09T01:30:00Z",
  "errors": [
    { "field": "username", "message": "must not be blank" }
  ]
}
```

---

## 3. Component Map & Data Flow

### Backend login flow

```
Client                                    Spring                                          DB
  │                                          │                                              │
  │── POST /api/auth/login {user,pass} ─────►│ AuthController                               │
  │                                          │   ├─ validate DTO (Jakarta Validation)       │
  │                                          │   └─ authenticationManager.authenticate(...) │
  │                                          │        │                                     │
  │                                          │        └► UserDetailsServiceImpl            │
  │                                          │              └─ UserRepository.findByUsername─►│
  │                                          │              ◄── User (domain) ───────────────│
  │                                          │        ◄── UserDetails (Spring sec)          │
  │                                          │   ├─ DaoAuthenticationProvider.matches(BCrypt)│
  │                                          │   └─ JwtService.issueToken(authentication)   │
  │◄──── 200 OK { token, user } ─────────────│                                              │
  │                                          │                                              │
  │── GET /api/anything (Bearer ...) ───────►│ JwtAuthenticationFilter                      │
  │                                          │   ├─ parse Authorization header              │
  │                                          │   ├─ JwtService.parse() → Claims             │
  │                                          │   ├─ load UserDetails by username (cached)   │
  │                                          │   └─ SecurityContextHolder.set(auth)         │
  │                                          │                                              │
  │                                          │ Controller handles request normally          │
  │◄──── 200 OK ─────────────────────────────│                                              │
```

**Key invariants**:
- Domain `User` never reaches the controller layer; the controller talks to `Authentication` and a `LoginResponseDto`.
- `JwtService` is in `infrastructure/security`, not `application` — it is an adapter detail.
- `SecurityContext` is cleared per request because session policy is `STATELESS`.

### Frontend login flow

```
LoginPage.onSubmit()
  └─► AuthStore.login(credentials)
        ├─ status.set('loading')
        └─► AuthService.login(credentials)         [HttpClient.post('/api/auth/login')]
              └─ JwtInterceptor passes through (no token yet)
              ◄─ { token, user }
        ├─ localStorage.setItem('oms.token', token)
        ├─ user.set(user); token.set(token); status.set('authenticated')
        └─► Router.navigate(['/'])
              └─► AuthGuard checks isAuthenticated() → true → renders LayoutComponent
                    └─► child route renders inside <router-outlet/>

Subsequent requests:
  Component → HttpClient.get(...)
    └─► JwtInterceptor reads AuthStore.token() → adds 'Authorization: Bearer ...'
    └─► server validates, responds
    └─► on 401 (token expired): AuthStore.logout() → /login
```

### Integration points

| Boundary | Contract |
|---|---|
| Frontend ↔ Backend | `POST /api/auth/login` accepts `{username:string, password:string}`; returns `{token:string, user:{id,username,email}}` on 200, `ProblemDetail` on 4xx/5xx |
| Domain ↔ Persistence | `UserRepository` port (domain interface): `Optional<User> findByUsername(String)`, `User save(User)`. Implemented by `UserRepositoryAdapter` in `infrastructure/persistence` wrapping Spring Data |
| Application ↔ Security | `AuthController` uses `AuthenticationManager` (Spring) — no direct port; `JwtService` is injected as a Spring bean |
| Frontend State ↔ Storage | `AuthStore.hydrateFromStorage()` reads `oms.token` from `localStorage` at app init; `logout()` removes it |

---

## 4. Configuration Properties (typed)

### Backend `@ConfigurationProperties`

```java
@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, Duration ttl, String issuer) {}

@ConfigurationProperties("app.cors")
public record CorsProperties(
    List<String> allowedOrigins,
    List<String> allowedMethods,
    List<String> allowedHeaders,
    List<String> exposedHeaders,
    boolean allowCredentials,
    long maxAge) {}

@ConfigurationProperties("app.seed")
public record SeedProperties(boolean enabled, String username, String password, String email) {}
```

Records ARE used here — these are immutable config DTOs, no behavior, no identity. Perfect record use case (consistent with ADR-2).

`@EnableConfigurationProperties({JwtProperties.class, CorsProperties.class, SeedProperties.class})` on `SecurityConfig` (or a dedicated `AppPropertiesConfig`).

---

## 5. Testing Strategy (Fase 1, strict TDD)

| Layer | Test type | Scope |
|---|---|---|
| Domain (`User`) | unit (JUnit 5) | invariants, factory methods, equality by id |
| Mappers (`UserJpaMapper`) | unit | round-trip toDomain/toJpa preserves fields |
| `JwtService` | unit | sign + parse round-trip, expired token rejected, tampered signature rejected |
| `AuthController` | `@WebMvcTest` slice | login happy path, 400 on missing fields, 401 on bad creds, response shape conforms to RFC-7807 |
| `JwtAuthenticationFilter` | unit with `MockHttpServletRequest` | populates SecurityContext on valid bearer; leaves empty on missing/invalid |
| Frontend `AuthStore` | Jest | state transitions, isAuthenticated computed, hydrateFromStorage with valid/expired/missing token |
| Frontend `JwtInterceptor` | Jest with `HttpTestingController` | adds Authorization header when token present; passes through when null |
| Frontend `AuthGuard` | Jest | redirects to /login when unauthenticated; allows when authenticated |
| Frontend `LoginPage` | Jest | submits valid form, calls store, navigates on success, shows error on failure |

**No DB integration test in Fase 1** — `@DataJpaTest` for `UserJpaRepository` is acceptable but optional; defer to Fase 2 when CRUD lands.

Strict TDD order applies: red → green → refactor for every component above.

---

## 6. Risks & Open Questions

| Item | Status | Notes |
|---|---|---|
| JWT secret rotation strategy | Deferred | Fase 1 uses static HS256 secret from env. Rotation = restart. Acceptable for test scope. |
| `ddl-auto=update` drift | Accepted | Fase 1 only. Flyway in Fase 2 will baseline from current schema. |
| `localStorage` XSS exposure | Accepted | Documented in proposal. Mitigation requires CSP + httpOnly cookie strategy → Fase 4 hardening. |
| `traceId` field placeholder | Open | Returns `null` in Fase 1. Will be wired in Fase 3 with MDC + observability. |
| ArchUnit enforcement of hex layering | Optional | Strongly recommended but not blocking for Fase 1. Add in Fase 2 once aggregates multiply. |
| `User.role` field | Open | Domain `User` has implicit `ROLE_USER` for Fase 1. Multi-role design lives in Fase 3 (RBAC). |

---

## 7. Out-of-Scope Confirmation

This design intentionally does **not** cover:
- Refresh-token rotation, sliding sessions, idle timeout
- Password reset flow, registration UI
- Order / Customer aggregates wiring (domain models exist, persistence + endpoints come Fase 2)
- Dashboard widgets, role-based menu rendering
- E2E tests, Docker, CI/CD pipelines
- Production deployment topology, secrets manager, observability stack

These are explicitly Fase 2/3/4 territory per the proposal.
