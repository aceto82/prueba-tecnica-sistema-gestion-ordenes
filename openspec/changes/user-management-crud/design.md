# Design: User Management CRUD

## Technical Approach

Mirrors the proven `CustomerController` + `CustomerService` + `CustomerStore` pattern. Backend uses REST endpoints under `/api/users` with `@PreAuthorize("hasRole('ADMIN')")`. Frontend uses signal-based `UserStore` with lazy-loaded route `/users`.

---

## Architecture Decisions

### ADR-1: UserService Layer

**Decision**: Create `UserService` with `findAll(Pageable)`, `create()`, `update()`, `delete()` methods.

**Rationale**: Follows existing `CustomerService` pattern. Service encapsulates business logic, handles duplicate username validation, and manages BCrypt password hashing.

**Implementation**:
```java
@Service
public class UserService {
    public Page<User> findAll(Pageable pageable) { ... }
    public User create(String username, String password, Role role) { ... }
    public User update(Long id, String username, Role role) { ... }
    public void delete(Long id) { ... }
}
```

---

### ADR-2: UserController REST Endpoints

**Decision**: Expose REST API under `/api/users` with ADMIN-only access via `@PreAuthorize`.

**Rationale**: Consistent with `CustomerController`. Spring Security method-level security handles 403 for non-ADMIN users.

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users?page=0&size=10` | Paginated user list |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/{id}` | Update username/role |
| DELETE | `/api/users/{id}` | Delete user |

---

### ADR-3: UserDtoMapper — Static Mapper, Password Excluded

**Decision**: Create static `UserDtoMapper` with `toResponse()` method that excludes password.

**Rationale**: Follows `CustomerDtoMapper` pattern. Password never leaks to clients.

**Implementation**:
```java
public static UserResponse toResponse(User user) {
    return new UserResponse(user.getId(), user.getUsername(), user.getRole());
}
```

---

### ADR-4: Frontend UserStore — Signals, Follows CustomerStore

**Decision**: Create `UserStore` with signals for `users`, `loading`, `error`, plus `loadUsers()`, `createUser()`, `updateUser()`, `deleteUser()` methods.

**Rationale**: Matches `CustomerStore` structure. Signals provide reactive state management with Angular's latest patterns.

**State**:
```typescript
private readonly _users = signal<User[]>([]);
private readonly _loading = signal(false);
private readonly _error = signal<string | null>(null);
```

---

### ADR-5: Route Design — Lazy-loaded `/users`

**Decision**: Add lazy-loaded route `/users` via `app.routes.ts`, using feature route file.

**Rationale**: Matches customers feature pattern. Enables code splitting.

**Structure**:
```
/users          → UserListComponent
/users/new      → UserFormComponent
/users/:id      → UserDetailComponent
/users/:id/edit → UserFormComponent
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/.../application/UserService.java` | New | Business logic service |
| `backend/.../infrastructure/web/UserController.java` | New | REST controller, ADMIN-only |
| `backend/.../application/dto/CreateUserRequest.java` | New | DTO for create |
| `backend/.../application/dto/UpdateUserRequest.java` | New | DTO for update |
| `backend/.../application/dto/UserResponse.java` | New | DTO for response |
| `backend/.../application/mapper/UserDtoMapper.java` | New | Static mapper |
| `backend/.../domain/exception/DuplicateUsernameException.java` | New | Duplicate exception |
| `backend/.../domain/port/UserRepository.java` | Modified | Add `findAll(Pageable)`, `deleteById` |
| `frontend/src/app/core/services/user.service.ts` | New | HTTP client |
| `frontend/src/app/features/users/user.store.ts` | New | Signal-based store |
| `frontend/src/app/features/users/users.routes.ts` | New | Feature routes |
| `frontend/src/app/features/users/pages/user-list/` | New | List component |
| `frontend/src/app/features/users/pages/user-detail/` | New | Detail component |
| `frontend/src/app/features/users/pages/user-form/` | New | Create/edit form |
| `frontend/src/app/app.routes.ts` | Modified | Add `/users` lazy route |

---

## Testing Strategy

**Backend**:
- Unit tests for `UserService` — verify duplicate username handling, password hashing, 404 on missing ID
- Integration tests for `UserController` — verify 403 for non-ADMIN, 409 on duplicate username, pagination
- Use H2 test database (existing pattern)

**Frontend**:
- Unit tests for `UserStore` — verify state updates on load/create/update/delete
- Unit tests for components — verify render, form validation, error handling

---

## API Contract

| Endpoint | Auth | Request Body | Response | Status Codes |
|----------|------|--------------|-----------|---------------|
| `GET /api/users` | ADMIN | — | Page\<UserResponse\> | 200, 403 |
| `GET /api/users/{id}` | ADMIN | — | UserResponse | 200, 403, 404 |
| `POST /api/users` | ADMIN | CreateUserRequest | UserResponse | 201, 400, 403, 409 |
| `PUT /api/users/{id}` | ADMIN | UpdateUserRequest | UserResponse | 200, 400, 403, 404, 409 |
| `DELETE /api/users/{id}` | ADMIN | — | — | 204, 403, 404 |

**Note**: Duplicate username returns 409 Conflict.