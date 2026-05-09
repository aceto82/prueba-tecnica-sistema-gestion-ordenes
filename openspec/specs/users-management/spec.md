# Users Management Specification

## Purpose

Enable ADMIN users to manage system user accounts (create, list, view, update, delete) via a REST API secured with role-based access control, and a corresponding Angular UI with signal-based state management.

## Requirements

### Requirement: ADMIN Authorization

All `/api/users` endpoints MUST reject requests from non-ADMIN users with HTTP 403.

#### Scenario: ADMIN gets user list

- GIVEN an authenticated user with role ADMIN
- WHEN they call `GET /api/users`
- THEN the request succeeds and a paginated user list is returned

#### Scenario: Non-ADMIN denied

- GIVEN an authenticated user with role USER
- WHEN they call `GET /api/users`
- THEN the server returns HTTP 403

---

### Requirement: List Users

`GET /api/users` MUST return a paginated list of all users, sorted by `id` ascending, with `id`, `username`, `role`, and `createdAt` fields.

#### Scenario: Paginated list

- GIVEN an authenticated ADMIN user
- WHEN they request `GET /api/users?page=0&size=10`
- THEN the server returns HTTP 200 with a Spring `Page` containing up to 10 users

#### Scenario: Empty page

- GIVEN an authenticated ADMIN user
- WHEN they request `GET /api/users?page=999`
- THEN the server returns HTTP 200 with an empty page

---

### Requirement: Get User by ID

`GET /api/users/{id}` MUST return the user with the given ID, or HTTP 404 if not found.

#### Scenario: Existing user

- GIVEN an authenticated ADMIN user and a user with ID `5` exists
- WHEN they call `GET /api/users/5`
- THEN the server returns HTTP 200 with that user's `id`, `username`, `role`, and `createdAt`

#### Scenario: Unknown ID

- GIVEN an authenticated ADMIN user and no user with ID `999` exists
- WHEN they call `GET /api/users/999`
- THEN the server returns HTTP 404

---

### Requirement: Create User

`POST /api/users` MUST create a new user with a BCrypt-hashed password. The request body MUST contain `username`, `password`, and `role`. Duplicate usernames MUST return HTTP 409.

#### Scenario: Create successfully

- GIVEN an authenticated ADMIN user and no user with username "alice" exists
- WHEN they post `{ "username": "alice", "password": "Pass123", "role": "USER" }`
- THEN the server returns HTTP 201 with the created user's `id`, `username`, `role`, and `createdAt` — password is NOT returned

#### Scenario: Duplicate username

- GIVEN an authenticated ADMIN user and a user with username "alice" already exists
- WHEN they post `{ "username": "alice", "password": "Pass123", "role": "USER" }`
- THEN the server returns HTTP 409

#### Scenario: Missing required field

- GIVEN an authenticated ADMIN user
- WHEN they post `{ "username": "alice" }` (no password or role)
- THEN the server returns HTTP 400

---

### Requirement: Update User

`PUT /api/users/{id}` MUST update the `username` and/or `role` of an existing user. Unknown IDs MUST return HTTP 404. Duplicate usernames on update MUST return HTTP 409.

#### Scenario: Update username and role

- GIVEN an authenticated ADMIN user and a user with ID `3` exists
- WHEN they PUT `{ "username": "newalice", "role": "ADMIN" }` to `/api/users/3`
- THEN the server returns HTTP 200 with the updated user data

#### Scenario: Update non-existent user

- GIVEN an authenticated ADMIN user and no user with ID `999` exists
- WHEN they PUT `{ "username": "name", "role": "USER" }` to `/api/users/999`
- THEN the server returns HTTP 404

#### Scenario: Update to existing username

- GIVEN an authenticated ADMIN user, user `3` with username "bob", and user `7` with username "alice"
- WHEN they PUT `{ "username": "alice", "role": "USER" }` to `/api/users/3`
- THEN the server returns HTTP 409

---

### Requirement: Delete User

`DELETE /api/users/{id}` MUST remove the user with the given ID, or return HTTP 404 if not found.

#### Scenario: Delete existing user

- GIVEN an authenticated ADMIN user and a user with ID `3` exists
- WHEN they call `DELETE /api/users/3`
- THEN the server returns HTTP 204 and the user no longer exists

#### Scenario: Delete non-existent user

- GIVEN an authenticated ADMIN user and no user with ID `999` exists
- WHEN they call `DELETE /api/users/999`
- THEN the server returns HTTP 404

---

### Requirement: Frontend User Store

The Angular `UserStore` MUST use signal-based state, expose `users` (signal array), `loading` (signal), `error` (signal), and provide `loadUsers()`, `createUser()`, `updateUser()`, and `deleteUser()` methods that call `UserService`. Store operations MUST be guarded by auth role checks.

#### Scenario: Load users

- GIVEN an authenticated ADMIN user navigates to `/users`
- WHEN the `UserListComponent` mounts and calls `userStore.loadUsers()`
- THEN `userStore.loading()` becomes `true`, then `false` when the request resolves, and `userStore.users()` contains the user list

#### Scenario: Create user from form

- GIVEN an authenticated ADMIN user fills and submits the `UserFormComponent`
- WHEN `userStore.createUser(data)` is called with valid data
- THEN `UserService.post('/api/users', data)` is invoked and the store updates its `users` signal
