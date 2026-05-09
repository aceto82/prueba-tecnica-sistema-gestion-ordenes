# Fase 1 — Integration Smoke Test Checklist

**Change**: fase-1 (Full-stack Auth + Scaffold)  
**Last updated**: 2026-05-08  
**Purpose**: Manual end-to-end verification that all moving parts work together

---

## Prerequisites

- Docker (or local PostgreSQL 15+) available and running
- Java 17+ on `$PATH` (or JAVA_HOME set)
- Node.js 20+ and npm on `$PATH`
- Ports 4200 and 8080 free

---

## Step-by-step Checklist

### 1. Start PostgreSQL

```bash
# Option A — Docker
docker run --rm -d \
  --name oms-db \
  -e POSTGRES_DB=oms \
  -e POSTGRES_USER=oms \
  -e POSTGRES_PASSWORD=oms \
  -p 5432:5432 \
  postgres:15-alpine

# Option B — local psql (ensure DB "oms" exists and user "oms" has access)
```

**Expected**: Container starts (or local service responds). No port conflicts.

---

### 2. Start the backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**Expected**: Console prints `Started OmsApplication in X.XXX seconds`. No errors.  
**Also expected**: DevDataSeeder logs `Seeded admin user` (first run only).

---

### 3. Start the frontend

```bash
cd frontend
npm start
```

**Expected**: Angular compiler prints `Compiled successfully`. Browser does NOT open automatically (or opens to `http://localhost:4200`). No TS compilation errors.

---

### 4. Navigate to the app root

Open `http://localhost:4200` in a browser.

**Expected**: Browser is immediately redirected to `http://localhost:4200/login`.  
**Verification**: URL bar shows `/login`, login form is visible with "Order Management System" title.

---

### 5. Submit login form with wrong credentials

Fill in:
- Username: `wrong`
- Password: `wrongpass`

Click **Log in**.

**Expected**: Error message "Invalid username or password" appears below the form. User stays on `/login`. No console errors.

---

### 6. Submit login form with correct credentials

Fill in:
- Username: `admin`
- Password: `admin123`

Click **Log in**.

**Expected**: 
- Browser redirects to `http://localhost:4200/orders` (or `/`).
- Shell layout is visible: **Sidebar** on the left with navigation links (Orders, Customers, Dashboard) and **Header** at the top showing `admin` username with a Logout button.
- `auth_token` is stored in `localStorage` (verify via DevTools → Application → Local Storage).

---

### 7. Verify session rehydration on refresh

While on `/orders` (or any protected route), press **F5** or reload the browser.

**Expected**: User stays logged in. No redirect to `/login`. Shell layout remains visible. JWT is re-read from `localStorage`.

---

### 8. Logout

Click the **Logout** button in the header.

**Expected**: Browser redirects to `http://localhost:4200/login`. `auth_token` is removed from `localStorage` (verify via DevTools). Navigating to `http://localhost:4200/orders` redirects back to `/login`.

---

### 9. Verify backend login endpoint directly

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | python3 -m json.tool
```

**Expected response** (HTTP 200):
```json
{
  "token": "eyJ..."
}
```

The `token` value is a valid JWT (three base64url segments separated by dots).

---

### 10. Verify protected endpoint rejects unauthenticated request

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/orders
```

**Expected**: HTTP status `401`.

With verbose output to see ProblemDetail body:
```bash
curl -s http://localhost:8080/api/orders
```

**Expected response body** (RFC-7807 ProblemDetail):
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  ...
}
```

---

## Result

| Step | Pass | Notes |
|------|------|-------|
| 1. PostgreSQL starts | ☐ | |
| 2. Backend starts | ☐ | |
| 3. Frontend compiles | ☐ | |
| 4. Root → /login redirect | ☐ | |
| 5. Wrong creds error | ☐ | |
| 6. Correct creds → shell | ☐ | |
| 7. Rehydration on refresh | ☐ | |
| 8. Logout clears session | ☐ | |
| 9. Backend login 200 + token | ☐ | |
| 10. Unauth GET → 401 ProblemDetail | ☐ | |

All 10 steps must pass before closing Fase 1.

---

## Known Deferred Items (Not in Fase 1)

- **Flyway migrations**: Currently using `ddl-auto=update`. Flyway scripts are out of scope for Fase 1.
- **Refresh tokens**: JWT is single-use; no refresh endpoint. Out of scope.
- **E2E tests (Playwright/Cypress)**: Manual smoke test only for Fase 1. E2E automation is a future task.
- **Orders/Customers/Dashboard features**: Placeholder components only. Feature work is in future phases.
