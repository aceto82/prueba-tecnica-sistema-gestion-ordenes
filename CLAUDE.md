# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fullstack monorepo: Order Management System (OMS) for a technical interview challenge.

- **Backend**: Java + Spring Boot + Spring Security (JWT) + JPA/Hibernate + PostgreSQL
- **Frontend**: Angular 18 with Signals, RxJS, feature-based standalone components

---

## Commands

### Backend (`/backend`)

```bash
./mvnw spring-boot:run          # Run dev server
./mvnw test                     # Run all tests
./mvnw test -Dtest=OrderServiceTest  # Run single test class
./mvnw package -DskipTests      # Build JAR
```

### Frontend (`/frontend`)

```bash
npm start                       # Dev server (ng serve)
npm test                        # Run Jest tests
npm test -- --testPathPattern=orders  # Run tests matching pattern
npm run build                   # Production build
npm run lint                    # ESLint
```

### Docker (full stack)

```bash
docker compose up               # Start PostgreSQL + backend + frontend
docker compose down -v          # Stop and clean volumes
```

---

## Architecture

### Backend — Hexagonal / Layered

```
backend/src/main/java/
  config/           # SecurityConfig, JwtConfig, WebMvcConfig
  domain/           # Pure entities: Order, Customer, User (no Spring deps)
  application/      # Use cases / services (OrderService, CustomerService)
  infrastructure/
    persistence/    # JPA repositories + mappers
    security/       # JwtFilter, UserDetailsServiceImpl
    web/            # REST controllers + DTOs
```

Key decisions:
- Domain entities have no JPA annotations — mapped via infrastructure mappers
- JWT issued on `/api/auth/login`, validated via `JwtFilter` on every request
- Roles: `ADMIN` (full access) and `USER` (read + own orders)

### Frontend — Feature-Based Angular 18

```
frontend/src/app/
  core/
    services/       # HttpClient wrappers (AuthService, etc.)
    interceptors/   # JwtInterceptor (attaches Bearer token)
    guards/         # AuthGuard, RoleGuard
  shared/
    components/     # Button, Input, Table, Modal, Badge (pure presentational)
    ui/             # Layout shell (Sidebar + Header)
  features/
    auth/           # Login page
    orders/         # List, detail, create/edit — owns OrderStore
    customers/      # CRUD — owns CustomerStore
    dashboard/      # Stats + bar chart (no external chart lib)
```

Key decisions:
- All components are **standalone** (no NgModules)
- State via **Signals** inside injectable stores (`OrderStore`, `CustomerStore`)
- RxJS used for async ops: search debounce (`switchMap + debounceTime`), HTTP cancellation
- `ChangeDetectionStrategy.OnPush` on every component
- Lazy-loaded routes per feature module

### State pattern (stores)

```ts
@Injectable({ providedIn: 'root' })
export class OrderStore {
  private _orders = signal<Order[]>([]);
  private _loading = signal(false);

  orders = this._orders.asReadonly();
  loading = this._loading.asReadonly();

  load() { /* sets signals, calls API */ }
}
```

### Order lifecycle

`PENDING → PROCESSING → COMPLETED | CANCELLED`

---

## API Contracts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | public | Returns JWT |
| GET | `/api/orders` | USER | Paginated list with filters |
| POST | `/api/orders` | USER | Create order |
| PUT | `/api/orders/:id` | USER | Edit order |
| GET | `/api/customers` | USER | Customer list |
| POST | `/api/customers` | ADMIN | Create customer |
| GET | `/api/dashboard/stats` | USER | Order counts by status |

---

## Testing

- **Backend**: JUnit 5 + Mockito. Service layer tested with mocks; repository layer with `@DataJpaTest` against H2.
- **Frontend**: Jest + Angular Testing Library. Services tested with `HttpClientTestingModule`; components via `TestBed`.

---

## Git Workflow

```
main
develop
feature/<name>    # e.g. feature/orders-module
```

PRs target `develop`; `develop` merges to `main` on milestones.

---

## Build Phases

| Phase | Deliverables |
|-------|-------------|
| 1 | Backend auth + entities; Angular scaffold + layout shell |
| 2 | Orders CRUD + API integration |
| 3 | RxJS search/filter; Signals state |
| 4 | Customers module; Dashboard stats |
| 5 | Test coverage; Clean Code pass |
| 6 | OnPush + trackBy + lazy loading audit |
