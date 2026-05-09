# Tasks: user-management-crud

## Phases

### Phase 1 — Foundation (Backend) ✅

- [x] **Task 1.1** — Extend `UserRepository` port
  - Path: `backend/src/main/java/com/oms/domain/port/UserRepository.java`
  - Add `Page<User> findAll(Pageable pageable)` and `boolean existsByUsername(String username)`, `boolean existsByUsernameAndIdNot(String username, Long id)`, `void deleteById(Long id)`

- [x] **Task 1.2** — Add `existsByUsername` variants to `UserJpaRepository`
  - Path: `backend/src/main/java/com/oms/infrastructure/persistence/repository/UserJpaRepository.java`
  - Add `boolean existsByUsername(String username)` and `boolean existsByUsernameAndIdNot(String username, Long id)`

- [x] **Task 1.3** — Create `DuplicateUsernameException`
  - Path: `backend/src/main/java/com/oms/domain/exception/DuplicateUsernameException.java`
  - Mirrors `DuplicateEmailException` pattern

---

### Phase 2 — Core Backend ✅

- [x] **Task 2.1** — Create `CreateUserRequest` DTO
  - Path: `backend/src/main/java/com/oms/infrastructure/web/dto/CreateUserRequest.java`
  - Fields: `@NotBlank String username`, `@NotBlank String password`, `@NotNull Role role`

- [x] **Task 2.2** — Create `UpdateUserRequest` DTO
  - Path: `backend/src/main/java/com/oms/infrastructure/web/dto/UpdateUserRequest.java`
  - Fields: `@NotBlank String username`, `@NotNull Role role` (username and role are updatable)

- [x] **Task 2.3** — Create `UserResponse` DTO
  - Path: `backend/src/main/java/com/oms/infrastructure/web/dto/UserResponse.java`
  - Fields: `Long id`, `String username`, `Role role` (password excluded; `createdAt` omitted — User domain model lacks the field)

- [x] **Task 2.4** — Create `UserDtoMapper`
  - Path: `backend/src/main/java/com/oms/infrastructure/web/mapper/UserDtoMapper.java`
  - Static `toResponse(User)` method; mirrors `CustomerDtoMapper` pattern

- [x] **Task 2.5** — Create `UserService`
  - Path: `backend/src/main/java/com/oms/application/service/UserService.java`
  - Methods: `Page<User> findAll(Pageable)`, `User getById(Long)`, `User create(String username, String password, Role)`, `User update(Long id, String username, Role role)`, `void delete(Long id)`
  - BCrypt hashing on create (inject `PasswordEncoder`)
  - Duplicate username validation on create (call `existsByUsername`) → throw `DuplicateUsernameException`
  - Duplicate username validation on update (call `existsByUsernameAndIdNot`) → throw `DuplicateUsernameException`
  - 404 via `EntityNotFoundException` on get/update/delete with unknown id

- [x] **Task 2.6** — Create `UserController`
  - Path: `backend/src/main/java/com/oms/infrastructure/web/controller/UserController.java`
  - Annotate class with `@RestController`, `@RequestMapping("/api/users")`, `@PreAuthorize("hasRole('ADMIN')")`
  - Endpoints: `GET /api/users` (pagination), `GET /api/users/{id}`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`
  - Use `@Valid` on request bodies, `@PathVariable`, `@RequestParam` (Spring Pageable)
  - Return 201 on create, 204 on delete, 404 via `EntityNotFoundException`
  - Add duplicate-username handler to `GlobalExceptionHandler` for `DuplicateUsernameException` → HTTP 409
  - Follow existing `CustomerController` patterns exactly

---

### Phase 3 — Frontend Core

**Task 3.1** — Create `user.model.ts`
- Path: `frontend/src/app/core/models/user.model.ts`
- Interfaces: `User`, `CreateUserRequest`, `UpdateUserRequest` (mirrors `customer.model.ts`)

**Task 3.2** — Create `UserService`
- Path: `frontend/src/app/core/services/user.service.ts`
- Methods: `list(page, size, sort)`, `getById(id)`, `create(req)`, `update(id, req)`, `delete(id)`
- Uses `HttpClient`; follows `CustomerService` pattern
- Base URL: `http://localhost:8080`

**Task 3.3** — Create `UserStore`
- Path: `frontend/src/app/features/users/user.store.ts`
- Signals: `_users`, `_loading`, `_error`, `_selected`, `_params`, `_totalElements`, `_totalPages`
- Computed: `users`, `loading`, `error`, `selected`, `currentPage`, `hasNext`, `isEmpty`
- Methods: `load(patch?)`, `selectById(id)`, `create(req)`, `update(id, req)`, `deleteUser(id)`
- Follow `CustomerStore` patterns exactly (Observable-based, `tap` for state updates)

**Task 3.4** — Create `users.routes.ts`
- Path: `frontend/src/app/features/users/users.routes.ts`
- Lazy-loaded routes: `''` → `UserListComponent`, `'new'` → `UserFormComponent`, `':id'` → `UserDetailComponent`, `':id/edit'` → `UserFormComponent`

**Task 3.5** — Create `UserListComponent`
- Path: `frontend/src/app/features/users/pages/user-list/user-list.component.ts`
- Standalone, OnPush, imports `RouterLink`
- Table with columns: ID, Username, Role, Created At, Actions (Edit link)
- Uses `UserStore`; pagination controls; empty state; loading overlay; error state
- Mirror `CustomerListComponent` pattern

**Task 3.6** — Create `UserListComponent` spec
- Path: `frontend/src/app/features/users/pages/user-list/user-list.component.spec.ts`
- Smoke tests: renders, displays heading "Users", shows table with headers

**Task 3.7** — Create `UserDetailComponent`
- Path: `frontend/src/app/features/users/pages/user-detail/user-detail.component.ts`
- Standalone, OnPush; displays user id, username, role, createdAt
- Use `ActivatedRoute` to get id, load user via `UserStore.selectById()`
- Mirror `CustomerDetailComponent` pattern (currently placeholder)

**Task 3.8** — Create `UserFormComponent`
- Path: `frontend/src/app/features/users/pages/user-form/user-form.component.ts`
- Standalone, OnPush, imports `ReactiveFormsModule`
- Fields: username (text, required), password (only on create), role (select with ADMIN/USER options)
- Read `editId` from route params; `isEditMode` hides password field when editing
- On submit: call `store.create()` or `store.update()`; navigate to `/users` on success
- Mirror `CustomerFormComponent` pattern

**Task 3.9** — Create `UserFormComponent` spec
- Path: `frontend/src/app/features/users/pages/user-form/user-form.component.spec.ts`
- Smoke tests: renders, displays heading (New User / Edit User), form with submit button

**Task 3.10** — Create `UserStore` spec
- Path: `frontend/src/app/features/users/user.store.spec.ts`
- Tests: `load()` sets users and pagination signals, `load()` sets error on failure, `create()` prepends user, `update()` replaces user in list, `deleteUser()` removes from list

---

### Phase 4 — Tests ✅

- [x] **Task 4.1** — Create `UserServiceTest`
  - Path: `backend/src/test/java/com/oms/application/service/UserServiceTest.java`
  - 7 tests: create success, create duplicate, update success, update to taken username, getById not found, delete existing, delete not found
  - `@ExtendWith(MockitoExtension.class)`, `@Mock`/`@InjectMocks`

- [x] **Task 4.2** — Create `UserControllerTest`
  - Path: `backend/src/test/java/com/oms/infrastructure/web/controller/UserControllerTest.java`
  - `@WebMvcTest(UserController.class)` excluding security auto-config
  - 10 tests covering all CRUD endpoints

- [x] **Task 4.3** — Create `UserControllerSecurityTest`
  - Path: `backend/src/test/java/com/oms/infrastructure/web/controller/UserControllerSecurityTest.java`
  - `@WebMvcTest` importing `SecurityConfig` and `JwtAuthenticationFilter`
  - Tests: unauthenticated → 401; USER role → 403; ADMIN with blank fields → 400

---

### Phase 5 — Routing

**Task 5.1** — Wire `/users` in `app.routes.ts`
- Path: `frontend/src/app/app.routes.ts`
- Add lazy-loaded child route under layout: `{ path: 'users', loadChildren: () => import('./features/users/users.routes').then(m => m.USER_ROUTES) }`
- Follow existing customers/orders pattern exactly

---

## Backend Complete ✅

Backend-only implementation finished. 21 tests added (7 service + 10 controller + 4 security). Total backend: 129 tests, 0 failures.

| Slice | Status | Files | Tests |
|-------|--------|-------|-------|
| Foundation | ✅ Done | UserRepository, UserJpaRepository, UserRepositoryAdapter, DuplicateUsernameException | — |
| Core Backend | ✅ Done | DTOs (3), UserDtoMapper, UserService, UserController, GlobalExceptionHandler, SecurityConfig | 21 new (129 total) |

**Deviation**: `UserResponse` omits `createdAt` — the User domain model and JPA entity don't have a createdAt field. Spec should be updated.

## Remaining — Frontend

Phases 3 (frontend core) and 5 (routing) still pending. Estimated ~840 lines.

## Review Workload Guard

**Original estimate**: ~1,461 lines across all phases

```
Backend (new):  UserService (~70) + UserController (~110) + DTOs (3×~12) + UserDtoMapper (~15) + DuplicateUsernameException (~10) + UserRepository modifications (~6)
Backend tests:  UserServiceTest (~100) + UserControllerTest (~130) + UserControllerSecurityTest (~90)
Frontend (new): user.model (~25) + user.service (~40) + user.store (~110) + user.store.spec (~120) + users.routes (~35) + user-list (~170) + user-list.spec (~60) + user-detail (~10) + user-form (~200) + user-form.spec (~60)
Frontend (mod): app.routes.ts (~8)
Total: ~1,461 lines
```

**Decision needed before apply: Yes**

The forecasted change size (~1,461 lines) significantly exceeds the ~400-line threshold. Given the `ask-on-risk` delivery strategy, the reviewer should confirm whether to:
- Proceed with a single large PR
- Split into chained PRs (e.g., backend-only first, then frontend)
- Reduce scope (e.g., implement backend-only or frontend-only first)

---

## Phase Order

1 → 2 → 3 → 4 → 5

All phases are sequential dependencies: Frontend (Phase 3) needs the API contract defined by Phase 2; tests (Phase 4) depend on Phase 2. No parallelization recommended without breaking changes.