# Design: Fase 2 — Orders & Customers CRUD

## Technical Approach

Extend the Fase 1 hexagonal layout. Each resource follows the same shape:
domain entity (plain Java) → port (`domain/port/`) → JPA entity + adapter
(`infrastructure/persistence/`) → service (`application/service/`) → controller +
DTOs (`infrastructure/web/`). Order list uses `@EntityGraph` + JPA Specifications.
Status transitions are enforced as a method on the `Order` domain entity. Frontend
mirrors `AuthStore` with one signal-based store per resource; RxJS lives in the
component that owns the search input, pushing param objects into the store.

## Architecture Decisions

### Decision 1 — N+1 prevention: `@EntityGraph` over `JOIN FETCH`

| Option | Tradeoff | Decision |
|---|---|---|
| `@EntityGraph(attributePaths = "customer")` on the repo method | Declarative, reusable across `findAll(Specification, Pageable)`, composable with Specifications | Chosen |
| JPQL `JOIN FETCH` | Forces a custom query string, breaks Specification composition for filters, harder to reuse | Rejected |

Rationale: filters use Specifications; only `@EntityGraph` composes with
`findAll(Specification<T>, Pageable)` without losing the dynamic predicates.

### Decision 2 — `OrderJpaEntity` uses `@ManyToOne` to `CustomerJpaEntity` (LAZY)

| Option | Tradeoff | Decision |
|---|---|---|
| `@ManyToOne(fetch = LAZY)` to `CustomerJpaEntity` + keep `customerId` derivable via `customer.getId()` | Lets `@EntityGraph` work, native FK constraint, JPA validates customer existence on flush | Chosen |
| Plain `Long customerId`, manual second query in mapper | Forces N+1 or hand-written join; defeats the purpose of using JPA Specifications | Rejected |

Domain `Order` keeps only `customerId: Long` (no JPA leak). The persistence
mapper reads `entity.getCustomer().getId()`. Domain → JPA mapping uses
`entityManager.getReference(CustomerJpaEntity.class, order.getCustomerId())`
inside the adapter (no extra SELECT).

### Decision 3 — Status transition rules live on `Order` domain entity

```java
// domain/model/Order.java
public void transitionTo(OrderStatus next) {
    if (!status.canTransitionTo(next)) {
        throw new InvalidOrderStatusTransitionException(this.status, next);
    }
    this.status = next;
}
```

Rules encoded once on `OrderStatus` enum (`canTransitionTo`). `OrderService`
calls `order.transitionTo(...)`; controller stays thin. Rejected: static
validator in service (forces anemic domain).

### Decision 4 — Pageable response: pass-through `Page<T>` JSON

Spring serializes `Page<T>` to:
```json
{ "content": [...], "totalElements": 42, "totalPages": 3,
  "number": 0, "size": 20, "first": true, "last": false }
```
Frontend consumes it as-is. Rejected: custom wrapper — no value, breaks
`PageableHandlerMethodArgumentResolver` defaults.

### Decision 5 — `OrderSpecification` static factory

```java
public final class OrderSpecifications {
    public static Specification<OrderJpaEntity> withFilters(
            OrderStatus status, LocalDate from, LocalDate to, String customerName) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (status != null) p.add(cb.equal(root.get("status"), status));
            if (from != null)   p.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            if (to != null)     p.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (customerName != null && !customerName.isBlank()) {
                Join<?,?> c = root.join("customer");
                p.add(cb.like(cb.lower(c.get("name")), "%" + customerName.toLowerCase() + "%"));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
    }
}
```

### Decision 6 — `CustomerSummary` is a top-level record

`infrastructure/web/dto/CustomerSummary.java` — reused by `OrderResponse`
and `OrderListItem`. Not nested: prevents duplication and keeps DTOs flat for
the frontend client model.

### Decision 7 — Bean Validation on request DTOs

```java
public record CreateOrderRequest(
    @NotNull @Positive Long customerId,
    @NotNull @DecimalMin(value = "0.01") BigDecimal total) {}

public record CreateCustomerRequest(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Email @Size(max = 180) String email) {}

public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {}
```

`GlobalExceptionHandler` already handles `MethodArgumentNotValidException`.
Add handlers for `EntityNotFoundException` (404), `InvalidOrderStatusTransitionException` (409),
`DataIntegrityViolationException` on duplicate email (409).

## Frontend Design

### Decision 8 — `OrderStore` shape

```typescript
interface OrderListParams {
  page: number; size: number; sort: string;
  status?: OrderStatus; dateFrom?: string; dateTo?: string; q?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly _orders = signal<OrderListItem[]>([]);
  private readonly _params = signal<OrderListParams>({ page: 0, size: 20, sort: 'createdAt,desc' });
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selected = signal<OrderDetail | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly params = this._params.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = computed(() => this._params().page);
  readonly hasNext = computed(() => this._params().page < this._totalPages() - 1);

  load(patch: Partial<OrderListParams>): Observable<void> { /* merge, http, set */ }
  create(req: CreateOrderRequest): Observable<Order> { ... }
  updateStatus(id: number, status: OrderStatus): Observable<Order> { ... }
  cancel(id: number): Observable<void> { ... } // DELETE → CANCELLED
  selectById(id: number): Observable<OrderDetail> { ... }
}
```

`CustomerStore` mirrors the same shape minus filters.

### Decision 9 — RxJS wiring: component owns the `Subject`

The component owns the search `Subject<string>` and applies
`debounceTime(300) + distinctUntilChanged() + switchMap(q => store.load({ q, page: 0 }))`.
Rationale: keeps the store framework-agnostic (signals only); RxJS noise stays at
the edge. Filter `select`/`datepicker` changes call `store.load(...)` directly
(no debounce needed). Cancellation is implicit via `switchMap`.

### Decision 10 — Routing: nested feature routes

```typescript
// app.routes.ts → orders branch
{
  path: 'orders',
  loadChildren: () => import('./features/orders/orders.routes').then(m => m.ORDER_ROUTES),
},
```
```typescript
// features/orders/orders.routes.ts
export const ORDER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/order-list/order-list.component').then(m => m.OrderListComponent) },
  { path: 'new', loadComponent: () => import('./pages/order-form/order-form.component').then(m => m.OrderFormComponent) },
  { path: ':id', loadComponent: () => import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./pages/order-form/order-form.component').then(m => m.OrderFormComponent) },
];
```
Mirror for customers.

### Decision 11 — Angular `OrderService` is a thin HTTP wrapper

Only HTTP + `HttpParams` building. The store decides which params to send and
holds state. Rationale: keeps the service trivially mockable; param shape is
business state, not HTTP detail.

```typescript
list(params: OrderListParams): Observable<Page<OrderListItem>> {
  let p = new HttpParams()
    .set('page', params.page).set('size', params.size).set('sort', params.sort);
  if (params.status)   p = p.set('status', params.status);
  if (params.dateFrom) p = p.set('dateFrom', params.dateFrom);
  if (params.dateTo)   p = p.set('dateTo', params.dateTo);
  if (params.q)        p = p.set('q', params.q);
  return this.http.get<Page<OrderListItem>>(`${API}/api/orders`, { params: p });
}
```

## Data Flow (Order list)

```
OrderListComponent ── searchSubject (debounce 300) ──┐
        │ filter selects ────────────────────────────┤
        ▼                                            ▼
   OrderStore.load(params) ──► OrderService.list ──► HTTP GET /api/orders
        ▲                                                       │
        │ signals (orders, totalPages, loading)                  ▼
        │                                              OrderController
        │                                                       │
        │                                              OrderService
        │                                                       │
        │                                       OrderRepositoryAdapter
        │                                  (Specification + EntityGraph)
        └─────────── OrderJpaRepository.findAll(spec, pageable) ◄┘
```

## File Changes (high level)

| Layer | New / Modified |
|---|---|
| `domain/model/` | `Order.transitionTo(...)`, `OrderStatus.canTransitionTo(...)`, `InvalidOrderStatusTransitionException` |
| `domain/port/` | `OrderRepository`, `CustomerRepository` |
| `application/service/` | `OrderService`, `CustomerService` |
| `infrastructure/persistence/entity/` | `OrderJpaEntity` add `@ManyToOne CustomerJpaEntity customer` (drop raw `customerId`) |
| `infrastructure/persistence/repository/` | `OrderJpaRepository extends JpaRepository + JpaSpecificationExecutor` with `@EntityGraph` on `findAll`, `CustomerJpaRepository` (already exists, extend) |
| `infrastructure/persistence/specification/` | `OrderSpecifications` |
| `infrastructure/persistence/` | `OrderRepositoryAdapter`, `CustomerRepositoryAdapter` |
| `infrastructure/persistence/mapper/` | extend `OrderMapper` (uses `EntityManager` for `getReference`) |
| `infrastructure/web/controller/` | `OrderController`, `CustomerController`; extend `GlobalExceptionHandler` |
| `infrastructure/web/dto/` | `CustomerSummary`, `OrderResponse`, `OrderListItem`, `CreateOrderRequest`, `UpdateOrderStatusRequest`, `CustomerResponse`, `CreateCustomerRequest` |
| `config/SecurityConfig.java` | permit `/api/orders/**` and `/api/customers/**` for authenticated |
| Frontend | `core/models/{order,customer,page}.model.ts`, `core/services/{order,customer}.service.ts`, `features/orders/{orders.routes.ts, order.store.ts, pages/*}`, mirror customers, replace `app.routes.ts` lazy entries |

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit (domain) | `Order.transitionTo` legal/illegal pairs (every PENDING/PROCESSING/COMPLETED/CANCELLED combo) | JUnit |
| Unit (service) | `OrderService` invokes domain transition, maps not-found → `EntityNotFoundException` | Mockito |
| Repo integration | `OrderRepositoryAdapter` + `OrderSpecifications` filter combos; assert SQL count for list (no N+1) via `@DataJpaTest` + Hibernate stats | `@DataJpaTest`, H2 |
| Controller | `OrderController` happy + 400/404/409 paths | `@WebMvcTest` |
| Frontend store | `OrderStore.load` patches params, sets signals; cancel/create paths | Jasmine + `HttpTestingController` |
| Frontend component | search debounce calls `store.load` once after 300ms | fakeAsync + tick |

## Migration / Rollout

DB schema for `orders` and `customers` already exists from Fase 1. Adding
`@ManyToOne` on `OrderJpaEntity` requires no schema change (column
`customer_id` already there). Hibernate `ddl-auto: update` (dev) handles it.

## Open Questions

- None blocking. Soft confirmation needed at apply time: `EntityManager` injection
  in `OrderRepositoryAdapter` for `getReference` — alternative is fetching the
  customer once per save (acceptable, tiny cost).
