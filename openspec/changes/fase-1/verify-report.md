# Verify Report: Fase 1 — Foundation (Auth + Scaffold)

**Date**: 2026-05-08
**Verdict**: PASS WITH WARNINGS
**Backend tests**: 16/16 PASS (BUILD SUCCESS)
**Frontend tests**: 15/15 PASS (4 suites)

---

## Requirement Results

### REQ-1: POST /api/auth/login returns signed JWT — PASS
- `AuthController.java:33` — `@PostMapping("/login")` under `/api/auth`
- `JwtService.java:26-31` — HS256 via `Keys.hmacShaKeyFor`, configurable secret and TTL
- Response: `{ token }` — matches spec

### REQ-2: Invalid credentials → 401 RFC-7807 — PASS (with WARNING-1 and WARNING-2)
- `GlobalExceptionHandler.java:13-17` — `@ExceptionHandler(BadCredentialsException)` returns `ProblemDetail.forStatusAndDetail(UNAUTHORIZED, ...)`
- Spring 6 `ProblemDetail` serializes as `application/problem+json` natively
- BadCredentialsException thrown inside `AuthController.login()` is caught by the advice
- See WARNING-1: security filter 401s (no token) do not return ProblemDetail
- See WARNING-2: no `MethodArgumentNotValidException` handler for 400 path

### REQ-3: JwtAuthenticationFilter validates bearer on every request — PASS
- `JwtAuthenticationFilter.java:18` — extends `OncePerRequestFilter`
- `SecurityConfig.java:45` — `.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`
- Sets `SecurityContextHolder` on valid token

### REQ-4: Missing/expired/malformed token → 401 — CRITICAL-1 + WARNING-1
- Missing header: filter passes through → Spring Security returns 401 (raw, not RFC-7807)
- **CRITICAL**: malformed/expired token → `extractUsername()` calls `parseClaims()` which throws `JwtException` — NO try/catch at `JwtAuthenticationFilter.java:42`. Exception propagates unhandled → 500 in production

### REQ-5: Hexagonal layout enforced; no JPA in domain/ — PASS
- `rg @Entity|@Table|@Id|@Column` in `domain/` → NO MATCHES
- `ArchitectureTest.java` — 3 ArchUnit rules pass: domain isolation, no JPA annotations on domain, mappers not Spring beans

### REQ-6: Domain entities plain Java; JPA entities in infrastructure/ — PASS
- `User.java`, `Customer.java`, `Order.java` — zero framework imports, package-private constructors, static factories, identity `equals`
- `UserJpaEntity.java` — `@Entity @Table(users)` in `infrastructure/persistence/entity/`
- `UserMapper.java` — `final` class, `private` constructor, static `toDomain`/`toJpa`, null-safe

### REQ-7: Login stores token in localStorage, routes to shell — PASS
- `login-page.component.ts:174` — calls `authStore.login({username, password})`
- `auth.store.ts:39` — `localStorage.setItem('auth_token', token)`
- `login-page.component.ts:177` — `router.navigate(['/'])` on success

### REQ-8: AuthGuard redirects unauthenticated; JwtInterceptor attaches bearer — WARNING-3
- `auth.guard.ts` — functional `CanActivateFn`, redirects to `/login` when not authenticated
- `jwt.interceptor.ts` — functional `HttpInterceptorFn`
- **WARNING**: interceptor skips `/api/auth/login` (line 9: `!req.url.includes('/api/auth/login')`). Spec says interceptor MUST NOT skip based on URL.

### REQ-9: AuthStore rehydrates from localStorage on app init — PASS
- `auth.store.ts:51-61` — `rehydrate()` reads `auth_token`, decodes JWT, sets signals
- `app.config.ts:13-18` — `APP_INITIALIZER` calls `authStore.rehydrate()`

### REQ-10: Layout shell — standalone, OnPush; lazy-loaded routes — PASS
- `layout.component.ts` — `standalone: true`, `ChangeDetectionStrategy.OnPush`
- `sidebar.component.ts` — `standalone: true`, `OnPush`
- `header.component.ts` — `standalone: true`, `OnPush`
- `app.routes.ts` — `/login` uses `loadComponent`; children `/orders`, `/customers`, `/dashboard` use `loadComponent`
- `app.routes.ts:17` — `canActivate: [authGuard]` on the shell parent route

---

## CRITICAL Issues (blockers for archive)

**CRITICAL-1**: `JwtAuthenticationFilter` does not wrap `extractUsername()` in try/catch.

- File: `backend/src/main/java/com/oms/infrastructure/security/JwtAuthenticationFilter.java` line 42
- A malformed or expired bearer token causes `JwtException` to propagate unhandled through the filter chain → 500, not 401.
- `isTokenValid()` catches `JwtException` (in `JwtService.java:44`) but is never reached because `extractUsername()` throws first.
- Fix: wrap lines 41–57 in:
  ```java
  try {
      String username = jwtService.extractUsername(token);
      // ... rest of logic
  } catch (JwtException | IllegalArgumentException e) {
      filterChain.doFilter(request, response);
      return;
  }
  ```

---

## WARNING Issues (non-blocking)

**WARNING-1**: `SecurityConfig` has no custom `authenticationEntryPoint`.
- Unauthenticated requests (no/invalid token passing through the filter) hit Spring's default entry point → raw 401, not RFC-7807 `ProblemDetail`.
- File: `backend/src/main/java/com/oms/config/SecurityConfig.java`

**WARNING-2**: `GlobalExceptionHandler` has no `MethodArgumentNotValidException` handler. `LoginRequest` also lacks `@NotBlank` constraints and `AuthController` lacks `@Valid`.
- Spec scenario "Malformed request body → 400 RFC-7807 with field list" is entirely unreachable.
- Files: `GlobalExceptionHandler.java`, `LoginRequest.java`, `AuthController.java`

**WARNING-3**: `JwtInterceptor` skips header attachment for `/api/auth/login`.
- File: `frontend/src/app/core/interceptors/jwt.interceptor.ts` line 9
- Spec says "MUST NOT skip based on URL." Practical impact: zero (no token during login), but it's an explicit spec violation.

**WARNING-4**: `isAuthenticated` computed checks only token, not user.
- `auth.store.ts:26` — `computed(() => this._token() !== null)`. Design spec: `computed(() => !!token() && !!user())`.

---

## SUGGESTIONS

1. **setup-jest.ts**: replace deprecated `import 'jest-preset-angular/setup-jest'` with `setupZoneTestEnv()`.
2. **ArchitectureTest**: extend domain JPA rule to cover `@Id`, `@Column`, `@Enumerated` (currently only checks `@Entity`, `@Table`).
3. **DevDataSeeder**: add a `@SpringBootTest` with `"dev"` profile to verify it boots without error.
4. **OmsApplicationTest**: consider `webEnvironment=RANDOM_PORT` for broader smoke coverage.

---

## Overall Verdict

**PASS WITH WARNINGS** — 1 CRITICAL, 4 WARNINGS, 4 SUGGESTIONS.

The critical issue (unhandled `JwtException` in filter) must be fixed before archive. All other requirements are met or have acceptable workarounds for Fase 1 scope.

**Next recommended**: `sdd-apply` (fix CRITICAL-1), then re-run `sdd-verify`, then `sdd-archive`.

---

## Re-Verify — 2026-05-08 (After Fixes)

**Verdict**: PASS
**Backend tests**: 18/18 PASS (BUILD SUCCESS) — 2 new tests added vs first verify
**Frontend tests**: 15/15 PASS (4 suites)

### FIX-1: JwtAuthenticationFilter try/catch — RESOLVED
- File: `backend/src/main/java/com/oms/infrastructure/security/JwtAuthenticationFilter.java`
- Lines 44–61: full try/catch wraps the token-processing block (`extractUsername` → load user → validate → set auth context).
- Catch clause: `catch (JwtException | IllegalArgumentException e)` — correct exception types.
- `filterChain.doFilter(request, response)` is called at line 63, OUTSIDE the try/catch — executes on both happy-path and catch-path. Correct.
- REQ-3/REQ-4 regression check: valid token path is unaffected — try block runs to completion, authentication is set, filter continues.

### FIX-2: SecurityConfig authenticationEntryPoint — RESOLVED
- File: `backend/src/main/java/com/oms/config/SecurityConfig.java`
- Lines 45–53: `.exceptionHandling(ex -> ex.authenticationEntryPoint(...))` wired.
- Entry point sets `SC_UNAUTHORIZED` (401), `Content-Type: application/problem+json`, and writes RFC-7807 body.

### FIX-3: Validation — @NotBlank + @Valid + handler — RESOLVED
- `LoginRequest.java`: `@NotBlank(message = "Username is required")` on `username` and `@NotBlank(message = "Password is required")` on `password`.
- `AuthController.java` line 35: `@Valid @RequestBody LoginRequest` — `@Valid` is present.
- `GlobalExceptionHandler.java` lines 14–21: `@ExceptionHandler(MethodArgumentNotValidException.class)` returns `ProblemDetail` HTTP 400 with field errors list.
- `backend/pom.xml` line 41: `spring-boot-starter-validation` dependency confirmed present.

### FIX-4: JwtInterceptor URL-skip condition removed — RESOLVED
- File: `frontend/src/app/core/interceptors/jwt.interceptor.ts`
- No `includes('/api/auth/login')` condition anywhere in the file.
- Logic: if token is non-null → clone request with `Authorization: Bearer <token>` and forward — regardless of URL.
- Test at `jwt.interceptor.spec.ts` line 53–61: "should attach Authorization header for login request when token exists" — explicitly verifies token is attached to `/api/auth/login` when token is set. PASSES.

### FIX-5: isAuthenticated checks both signals — RESOLVED
- File: `frontend/src/app/features/auth/auth.store.ts` line 26.
- `readonly isAuthenticated = computed(() => this._token() !== null && this._currentUser() !== null);`
- Both conditions required. `auth.store.spec.ts` tests cover: false initially (neither set), true after login (both set), false after error (neither set), true after rehydrate (both set by rehydrate()), false after logout (both cleared).

### Regression Check

| Requirement | Status | Evidence |
|-------------|--------|----------|
| REQ-1: Login endpoint returns JWT | NO REGRESSION | AuthController unchanged; 18 backend tests PASS |
| REQ-2: Invalid creds → 401 RFC-7807 | NO REGRESSION | BadCredentialsException handler unchanged; entryPoint now also RFC-7807 |
| REQ-3: Filter sets SecurityContext on valid token | NO REGRESSION | try block is unchanged for valid-token path; doFilter still called after |
| REQ-4: Missing/expired/malformed → 401 | NO REGRESSION (FIXED) | try/catch now catches malformed; entryPoint serves 401+RFC-7807 |
| REQ-5: Hexagonal layout / domain purity | NO REGRESSION | ArchUnit 3/3 still pass |
| REQ-6: Domain entities plain Java | NO REGRESSION | No changes to domain classes |
| REQ-7: Login stores token + navigates | NO REGRESSION | login() still sets both signals + localStorage; no changes to login-page |
| REQ-8: AuthGuard + JwtInterceptor | NO REGRESSION (IMPROVED) | Interceptor now spec-compliant; guard unchanged |
| REQ-9: Rehydrate sets both signals | NO REGRESSION | rehydrate() sets `_token` AND `_currentUser`; isAuthenticated now requires both |
| REQ-10: Shell standalone OnPush; lazy routes | NO REGRESSION | No changes to layout or routing |

### Remaining Issues

None. All 5 fixes verified. No regressions detected.

### Overall Verdict After Re-Verify

**PASS** — 0 CRITICAL, 0 WARNING, 4 SUGGESTIONS (unchanged from first verify; suggestions are non-blocking).

Suggestions still open (non-blocking):
1. `setup-jest.ts`: replace deprecated `import 'jest-preset-angular/setup-jest'` with `setupZoneTestEnv()`.
2. `ArchitectureTest`: extend domain JPA rule to cover `@Id`, `@Column`, `@Enumerated`.
3. `DevDataSeeder`: add `@SpringBootTest` with `"dev"` profile.
4. `OmsApplicationTest`: consider `webEnvironment=RANDOM_PORT`.

**Next recommended**: `sdd-archive`
