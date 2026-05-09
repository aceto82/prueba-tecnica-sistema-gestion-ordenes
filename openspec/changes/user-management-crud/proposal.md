# Proposal: User Management CRUD

## Intent

Enable ADMIN users to manage system user accounts (create, read, update, delete) via REST API and Angular UI. Currently, users are only created through `DevDataSeeder` — no self-service or admin tooling exists.

## Scope

### In Scope
- Backend: `UserService`, `UserController`, DTOs (`CreateUserRequest`, `UpdateUserRequest`, `UserResponse`), `UserDtoMapper`
- Backend: Extend `UserRepository` port with `findAll(Pageable)` and `deleteById`
- Backend: BCrypt password hashing on create; duplicate username validation
- Backend: ADMIN-only access enforced via `@PreAuthorize` on all endpoints
- Frontend: `UserService`, `UserStore` with signals, lazy-loaded route `/users`
- Frontend: `UserListComponent`, `UserDetailComponent`, `UserFormComponent` (standalone, OnPush)
- Follow existing Customer CRUD pattern exactly

### Out of Scope
- Self-management (users editing own profile)
- Password change/reset flows
- Email notifications
- Auditing or timestamp tracking

## Capabilities

### New Capabilities
- `users-management`: Full ADMIN CRUD for system user accounts — create, list (paginated), get-by-id, update (username, role), delete. Covers both backend REST API and Angular frontend.

### Modified Capabilities
- None

## Approach

Mirrors the proven `CustomerController` + `CustomerService` + `CustomerStore` pattern. Backend: REST endpoints under `/api/users` (ADMIN-only), BCrypt on create, `DataIntegrityViolationException` → HTTP 409 on duplicate username. Frontend: `UserStore` with signals, list/detail/form components, lazy-loaded at `/users`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/main/java/.../domain/User.java` | New | User domain model already exists; Role enum already exists |
| `backend/src/main/java/.../domain/UserRepository.java` | Modified | Add `findAll(Pageable)`, `deleteById` |
| `backend/src/main/java/.../application/UserService.java` | New | Business logic: create, list, get, update, delete |
| `backend/src/main/java/.../application/dto/` | New | CreateUserRequest, UpdateUserRequest, UserResponse |
| `backend/src/main/java/.../application/mapper/UserDtoMapper.java` | New | Domain ↔ DTO mapping |
| `backend/src/main/java/.../infrastructure/web/UserController.java` | New | REST endpoints, `@PreAuthorize("hasRole('ADMIN')")` |
| `frontend/src/app/features/users/` | New | Feature module with list/detail/form components |
| `frontend/src/app/features/users/user-store.ts` | New | Signal-based store following AuthStore pattern |
| `frontend/src/app/app.routes.ts` | Modified | Add lazy-loaded `/users` route |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Duplicate username edge case (create vs update) | Low | `existsByUsername` check in service before save |
| Role enum mismatch (frontend/backend) | Low | Share enum or use string literal — follow Customer pattern |

## Rollback Plan

1. Delete `backend/.../application/UserService.java`, `UserController.java`, all new DTOs/mappers
2. Revert `UserRepository.java` to previous interface (remove new methods)
3. Delete `frontend/src/app/features/users/` directory
4. Remove `/users` route entry from `app.routes.ts`
5. No database migration needed (no schema changes — `username` unique constraint already exists)

## Dependencies

- Spring Security `@PreAuthorize` already configured from Fase 1
- Existing `User` domain entity, `UserRepository` port, JPA entity, and BCrypt encoder all in place

## Success Criteria

- [ ] `GET /api/users?page=0&size=10` returns paginated user list (ADMIN only)
- [ ] `POST /api/users` creates user with BCrypt-hashed password; duplicate username returns 409
- [ ] `PUT /api/users/{id}` updates username and role; unknown id returns 404
- [ ] `DELETE /api/users/{id}` removes user; unknown id returns 404
- [ ] All endpoints return 403 for non-ADMIN users
- [ ] Angular `/users` list page renders paginated table via `UserStore`
- [ ] Angular create/edit form creates and updates users via API
- [ ] `./mvnw test` passes; frontend `npm test` passes
