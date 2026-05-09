# Smoke Test: Fase 2 — Orders & Customers CRUD (PR C + PR D)

## Prerequisites

1. Backend running on port 8080 (`.mvnw spring-boot:run` from `backend/`)
2. Frontend running on port 4200 (`npm start` from `frontend/`)
3. Database `oms_dev` created and accessible
4. Dev profile active (auto-seeds admin user + sample data)

## Test Steps

### 1. Health Check: Backend

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
```

Expected: `200` (or `302` redirect to login — not `5xx`)

### 2. Login

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: `{"token":"eyJ..."}` — a JWT string. Save the token for subsequent requests.

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
```

### 3. List Customers (Authenticated)

```bash
curl -s http://localhost:8080/api/customers \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200` with `{"content":[...], "totalElements":..., ...}`. Dev seed data should include customers if configured.

### 4. Create Customer

```bash
curl -s -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Smoke Test Customer","email":"smoke@test.com"}'
```

Expected: `201` with `{"id":...,"name":"Smoke Test Customer","email":"smoke@test.com"}`. Save the ID.

```bash
CUSTOMER_ID=$(curl -s -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Smoke Test Customer","email":"smoke@test.com"}' | sed 's/.*"id":\([0-9]*\).*/\1/')
```

### 5. Create Duplicate Customer (400)

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Smoke Test Customer","email":"smoke@test.com"}'
```

Expected: `409` (DuplicateEmailException)

### 6. Create Order

```bash
curl -s -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"customerId\":$CUSTOMER_ID,\"total\":99.99}"
```

Expected: `201` with `{"id":...,"status":"PENDING","total":99.99,...}`. Save the ID.

```bash
ORDER_ID=$(curl -s -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"customerId\":$CUSTOMER_ID,\"total\":99.99}" | sed 's/.*"id":\([0-9]*\).*/\1/')
```

### 7. List Orders with Filter

```bash
curl -s "http://localhost:8080/api/orders?customerName=Smoke" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200` with `{"content":[{"id":$ORDER_ID,...}],...}` — at least one result matching the customer name.

### 8. Transition Order Status (PENDING → PROCESSING)

```bash
curl -s -X PUT "http://localhost:8080/api/orders/$ORDER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"PROCESSING"}'
```

Expected: `200` with `{"status":"PROCESSING",...}`

### 9. Verify Illegal Transition (PROCESSING → PENDING)

```bash
curl -s -o /dev/null -w "%{http_code}" -X PUT "http://localhost:8080/api/orders/$ORDER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"PENDING"}'
```

Expected: `400` (InvalidOrderStatusTransitionException — cannot go back to PENDING)

### 10. Frontend Smoke

1. Navigate to `http://localhost:4200` — should redirect to `/login`
2. Log in with `admin` / `admin123`
3. Should land on `/orders` with the order list (or empty state)
4. Click **Customers** in sidebar — should see customer list (or empty state)
5. Click **New Customer** — should show form
6. Create a customer — should navigate back to list with new customer visible
7. Click **Orders** in sidebar — should show order list
8. Click **New Order** — should show form with customer dropdown
9. Click **View** on an order — should show order detail
10. Click **Dashboard** in sidebar — should show dashboard placeholder

Expected: All navigation works; data displays correctly; forms validate and submit.
