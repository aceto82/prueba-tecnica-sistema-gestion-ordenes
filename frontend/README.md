# OMS — Frontend

Frontend del **Order Management System**, una SPA de gestión de órdenes, clientes y usuarios construida con Angular 18 y componentes standalone.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 18.2 |
| Lenguaje | TypeScript 5.5 (strict mode) |
| Estado | Angular Signals + RxJS |
| HTTP | `HttpClient` con interceptores funcionales |
| Routing | Lazy-loading por feature, `withComponentInputBinding` |
| Forms | ReactiveFormsModule + CVA personalizados |
| Gráficos | Chart.js 4.5 |
| CSS | SCSS parciales + variables CSS + tema oscuro |
| Testing | Jest 29 + `jest-preset-angular` + jsdom |
| Build | Angular 18 application builder (Vite) |
| Package manager | npm / pnpm |

---

## Arquitectura: Feature-First con Componentes Standalone

La aplicación sigue una arquitectura de **componentes standalone** (sin NgModules) organizada por **dominios de negocio**. No hay NgRx ni librerías externas de estado — el estado se maneja con **Angular Signals** dentro de stores injectables.

```
┌──────────────────────────────────────────────────────────────┐
│                       APP SHELL                              │
│  main.ts → bootstrapApplication(AppComponent, appConfig)     │
│    ├─ provideRouter(appRoutes, withComponentInputBinding())  │
│    ├─ provideHttpClient(withInterceptors([jwtInterceptor]))  │
│    └─ APP_INITIALIZER (rehidrata auth + tema)                │
└──────────────────────────┬───────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  app.routes │  LayoutComponent (shell con sidebar + header)
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐────────────────┐
          ▼                ▼                ▼                ▼
     /orders          /customers        /users          /dashboard
     (lazy)           (lazy)           (lazy)           (lazy)
          │                │                │                │
          ▼                ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────┐
│                    FEATURE DOMAINS                           │
│                                                              │
│  ┌───────────────────┐   ┌───────────────────┐              │
│  │  OrderStore        │   │  CustomerStore     │  ...stores  │
│  │  (signal state)    │   │  (signal state)     │            │
│  └────────┬──────────┘   └────────┬──────────┘              │
│           │                       │                          │
│  ┌────────▼──────────┐   ┌────────▼──────────┐              │
│  │  OrderListPage     │   │  CustomerListPage  │  páginas    │
│  │  OrderFormPage     │   │  CustomerFormPage  │  (container)│
│  │  OrderDetailPage   │   │  CustomerDetailPage│            │
│  └───────────────────┘   └───────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    SHARED COMPONENTS                         │
│                                                              │
│  app-button · app-input · app-select · app-badge             │
│  app-card · app-table · app-pagination                       │
│  app-modal · app-confirm-dialog                              │
│  (todos OnPush, sin dependencias externas)                   │
└──────────────────────────────────────────────────────────────┘
```

### Capas y Responsabilidades

| Capa | Directorio | Responsabilidad |
|------|-----------|----------------|
| **Shell** | `src/app/` | `app.config.ts` (providers globales), `app.routes.ts` (configuración de rutas), `app.component.ts` (`<router-outlet>`) |
| **Core** | `core/` | Modelos, servicios HTTP, interceptores, guards, stores globales (tema). Sin componentes visuales. |
| **Features** | `features/` | Store por dominio + páginas (componentes contenedores). Separado por feature: `auth`, `orders`, `customers`, `users`, `dashboard`. |
| **Shared UI** | `shared/components/` | Componentes puramente presentacionales, reutilizables, sin inyección de servicios de dominio. |

---

## Core (`src/app/core/`)

Elementos transversales que no pertenecen a ningún dominio específico.

### Modelos (`core/models/`)

- `page.model.ts` — `Page<T>`: interfaz genérica que refleja la paginación de Spring Boot (`content`, `totalElements`, `totalPages`, `number`, `size`, `first`, `last`)
- `user.model.ts` — `User`, `CreateUserRequest`, `UpdateUserRequest`
- `customer.model.ts` — `Customer`, `CustomerSummary`, `CreateCustomerRequest`, `UpdateCustomerRequest`
- `order.model.ts` — `Order`, `CreateOrderRequest`, `UpdateOrderRequest`, `OrderStatus` (type alias), más mapas `ORDER_STATUS_LABELS` y `ORDER_STATUS_COLORS`

### Servicios HTTP (`core/services/`)

Cada servicio es un `@Injectable({ providedIn: 'root' })` que inyecta `HttpClient` vía `inject()` y expone métodos tipados que devuelven `Observable<T>`.

| Servicio | Endpoints | Métodos |
|----------|-----------|---------|
| `AuthService` | `POST /api/auth/login` | `login(username, password)` |
| `OrderService` | `GET/POST/PUT/DELETE /api/orders[/:id]` | `list()`, `getById()`, `create()`, `update()`, `delete()` |
| `CustomerService` | `GET/POST/PUT /api/customers[/:id]` | `list()`, `getById()`, `create()`, `update()` |
| `UserService` | `GET/POST/PUT/DELETE /api/users[/:id]` | `list()`, `getById()`, `create()`, `update()`, `delete()` |

La URL base (`http://localhost:8080`) está hardcodeada en cada servicio.

### Interceptor JWT (`core/interceptors/jwt.interceptor.ts`)

Interceptor funcional que lee el token del `AuthStore` vía `inject()` y lo añade como `Bearer` en cada petición. Registrado en `app.config.ts` con `withInterceptors([jwtInterceptor])`.

### Guards (`core/guards/auth.guard.ts`)

`CanActivateFn` funcional que verifica `AuthStore.isAuthenticated()`. Redirige a `/login` si no hay sesión.

### Theme Store (`core/theme.store.ts`)

Gestiona el tema claro/oscuro con una señal `isDark`. Persiste en `localStorage` (clave `app_theme`). Inicializa desde localStorage o `prefers-color-scheme`. Sincroniza el atributo `data-theme` en `<html>` mediante un `effect()`.

---

## Features (`src/app/features/`)

Cada feature sigue una estructura consistente:

```
feature/
├── feature.store.ts          # Estado global del dominio (signals)
├── feature.routes.ts         # Rutas hijas lazy-loaded
├── pages/
│   ├── list/                 # Listado con tabla + paginación
│   ├── form/                 # Crear/editar con ReactiveForms
│   └── detail/               # Vista detalle
└── feature.component.ts      # Placeholder (no usado — las rutas cargan pages directamente)
```

### Auth (`features/auth/`)

- **`AuthStore`**: Store global de autenticación. Contiene:
  - `_token` (signal) y `_currentUser` (signal): estado interno
  - `token`, `currentUser`, `isAuthenticated`, `isAdmin`: señales públicas de solo lectura
  - `login()`: llama a `AuthService.login()`, decodifica el payload JWT (extrae `sub` y `role` del base64), persiste en `localStorage`
  - `logout()`: limpia señales y localStorage
  - `rehydrate()`: restaura token desde localStorage al iniciar la app (vía `APP_INITIALIZER`)
- **`LoginPageComponent`**: Formulario de login con `app-input` + `app-button`. Muestra errores con `@if`.

### Orders (`features/orders/`)

- **`OrderStore`**: Estado con lista paginada, filtros (status, fechas, búsqueda), loading, error. Métodos CRUD que devuelven `Observable<void>` para encadenamiento.
- **`OrderListComponent`**: Tabla con búsqueda por nombre de cliente (debounce 300ms + `switchMap`), filtro por status, paginación. Los usuarios `USER` ven solo sus órdenes (filtro server-side por `userId`).
- **`OrderFormComponent`**: Formulario con `customerId` (select) y `total` (input). En edición, `customerId` se deshabilita.
- **`OrderDetailComponent`**: Vista detalle con datos de orden y cliente más enlace a edición.

### Customers (`features/customers/`)

- **`CustomerStore`**: Mismo patrón que OrderStore (lista paginada + CRUD).
- **`CustomerListComponent`**: Tabla con paginación, cada fila enlaza al detalle.
- **`CustomerFormComponent`**: Formulario con nombre y email. Validación de email.
- **`CustomerDetailComponent`**: Placeholder ("coming soon").

### Users (`features/users/`)

- **`UserStore`**: CRUD completo de usuarios (solo ADMIN).
- **`UserListComponent`**: Tabla con paginación, botón de eliminar con confirmación (`confirm()` nativo).
- **`UserFormComponent`**: Crear (con contraseña requerida) y editar (contraseña opcional, `minLength(6)` si se proporciona).
- **`UserDetailComponent`**: Vista detalle con inline styles.

### Dashboard (`features/dashboard/`)

- **`DashboardService`**: `GET /api/dashboard/stats` — total de órdenes, órdenes por status, revenue total.
- **`DashboardStore`**: Carga stats al inicializar (`loadStats()`), expone `stats`, `loading`, `error` como signals.
- **`DashboardComponent`**: KPIs y gráfico de barras con Chart.js (`totalOrders`, `ordersByStatus`, `totalRevenue`).

---

## Shared UI (`src/app/shared/components/`)

Todos los componentes son standalone, `OnPush`, sin dependencias de dominio.

| Componente | Selector | Props de entrada | Salidas |
|-----------|----------|-----------------|---------|
| **Button** | `<app-button>` | `variant` (primary/secondary/danger/ghost/outline/link), `size` (sm/md/lg), `disabled`, `loading`, `type` | `clicked` |
| **Input** | `<app-input>` | `label`, `type`, `placeholder`, `error`, `disabled`, `id` | CVA |
| **Select** | `<app-select>` | `label`, `options`, `placeholder`, `error`, `disabled`, `id` | CVA |
| **Badge** | `<app-badge>` | `variant` (success/warning/danger/info/neutral) | — |
| **Card** | `<app-card>` | `padding` (sm/md/lg), `shadow` (sm/md/lg) | `<ng-content>` |
| **Table** | `<app-table>` | `columns`, `data`, `loading`, `error`, `emptyMessage`, `trackBy` | `@ContentChild('cell')` |
| **Pagination** | `<app-pagination>` | `currentPage`, `totalPages`, `totalElements` | `pageChange` |
| **Modal** | `<app-modal>` | `open`, `title`, `size` (sm/md/lg) | `closed` |
| **ConfirmDialog** | `<app-confirm-dialog>` | `open`, `title`, `message`, `confirmLabel`, `cancelLabel`, `variant` | `confirmed`, `cancelled` |

Los componentes **Input** y **Select** implementan `ControlValueAccessor` (`NG_VALUE_ACCESSOR`) para integrarse con ReactiveForms mediante `formControlName`.

---

## Sistema de Diseño

### Variables CSS (`src/styles/`)

El diseño se basa en variables CSS personalizadas definidas en SCSS parciales:

| Archivo | Contenido |
|---------|-----------|
| `_variables.scss` | Tokens de diseño: colores, fuentes, espaciado, radios, sombras, transiciones |
| `_typography.scss` | Estilos de encabezados (h1-h6) + utilidades de texto (muted, secondary, truncate) |
| `_buttons.scss` | Sistema de botones: 6 variantes × 3 tamaños, estados hover/active/disabled/loading |
| `_layout.scss` | Utilidades de layout: `.page-header`, `.form-card`, `.form-actions`, `.detail-grid` |
| `_components.scss` | Estilos para tabla, paginación, badge, modal, confirm-dialog |
| `_theme.scss` | Overrides `[data-theme="dark"]`: todas las variables de color con variantes oscuras |

### Tema oscuro

- Alternancia vía `ThemeStore` que sincroniza `data-theme="dark"` en `<html>`
- Persistencia en `localStorage` (clave `app_theme`)
- Fallback inicial a `prefers-color-scheme: dark`
- Cobertura completa de todos los componentes vía overrides CSS

---

## Gestión de Estado con Signals

El proyecto usa **Angular Signals** como única fuente de verdad, sin NgRx ni librerías externas.

### Patrón general de un Store

```typescript
@Injectable({ providedIn: 'root' })
export class OrderStore {
  // Estado mutable privado
  private readonly _orders = signal<Order[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // API pública de solo lectura
  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Derivaciones computadas
  readonly isEmpty = computed(() => !this._loading() && this._orders().length === 0);

  // Métodos que devuelven Observable para encadenamiento
  load(params?: Partial<OrderListParams>): Observable<void> { ... }
  create(req: CreateOrderRequest): Observable<Order> { ... }
}
```

### RxJS para flujos asíncronos

- Las peticiones HTTP usan `switchMap` con debounce (300ms) en el buscador de órdenes
- `tap()` actualiza las signals al completar o fallar
- Componentes se suscriben en `ngOnInit()` y limpian con `takeUntil` o suscripción gestionada por Angular

---

## Testing

```bash
npm test             # Ejecutar tests (Jest)
npm run test:watch   # Modo watch
```

### Configuración

- **Preset**: `jest-preset-angular`
- **Entorno**: jsdom
- **Setup**: `setup-jest.ts` — polyfills para `<dialog>`, mock de `matchMedia`
- **Path aliases**: `@core`, `@shared`, `@features` mapeados vía `moduleNameMapper`
- **Cobertura**: recoge `src/app/**/*.ts`, excluye `*.module.ts`

### Inventario de tests (30 spec files)

| Categoría | Archivos |
|-----------|----------|
| **Servicios** | `AuthService`, `OrderService`, `CustomerService`, `DashboardService` |
| **Stores** | `AuthStore`, `OrderStore`, `CustomerStore`, `UserStore`, `DashboardStore`, `ThemeStore` |
| **Core** | `JwtInterceptor`, `AuthGuard` |
| **Shared components** | `Button`, `Input`, `Select`, `Badge`, `Card`, `Table`, `Pagination`, `Modal`, `ConfirmDialog` |
| **Páginas** | `LoginPage`, `OrderList`, `OrderForm`, `OrderDetail`, `CustomerList`, `CustomerForm`, `CustomerDetail`, `UserList`, `UserForm`, `UserDetail`, `Dashboard` |

### Patrones de test

- **Servicios**: `provideHttpClientTesting()` + `HttpTestingController`
- **Stores**: Inyección del store + `httpMock.flush()` para controlar respuestas
- **Componentes presentacionales**: Test host con configuración de inputs
- **Componentes página**: Mocks tipados de stores + `TestBed`

---

## Routing

| Ruta | Componente | Lazy | Guard | Descripción |
|------|-----------|------|-------|-------------|
| `/login` | `LoginPageComponent` | Sí | — | Login |
| `/` | `LayoutComponent` | No | `authGuard` | Shell de la app |
| `/orders` | `OrderListComponent` | Sí | authGuard | Listado de órdenes |
| `/orders/new` | `OrderFormComponent` | Sí | authGuard | Crear orden |
| `/orders/:id` | `OrderDetailComponent` | Sí | authGuard | Detalle de orden |
| `/orders/:id/edit` | `OrderFormComponent` | Sí | authGuard | Editar orden |
| `/customers` | `CustomerListComponent` | Sí | authGuard | Listado de clientes |
| `/customers/new` | `CustomerFormComponent` | Sí | authGuard | Crear cliente |
| `/customers/:id` | `CustomerDetailComponent` | Sí | authGuard | Detalle de cliente |
| `/customers/:id/edit` | `CustomerFormComponent` | Sí | authGuard | Editar cliente |
| `/users` | `UserListComponent` | Sí | authGuard | Gestión de usuarios (ADMIN) |
| `/users/new` | `UserFormComponent` | Sí | authGuard | Crear usuario (ADMIN) |
| `/users/:id` | `UserDetailComponent` | Sí | authGuard | Detalle de usuario (ADMIN) |
| `/users/:id/edit` | `UserFormComponent` | Sí | authGuard | Editar usuario (ADMIN) |
| `/dashboard` | `DashboardComponent` | Sí | authGuard | Dashboard |

Todas las rutas hijas son **lazy-loaded** via `loadComponent` o `loadChildren`.

---

## Flujo de Inicio

```
main.ts
  └─ bootstrapApplication(AppComponent, appConfig)
       └─ provideRouter(appRoutes, withComponentInputBinding())
       └─ provideHttpClient(withInterceptors([jwtInterceptor]))
       └─ APP_INITIALIZER
            ├─ authStore.rehydrate()   → restaura token desde localStorage
            └─ themeStore.init()       → aplica tema guardado o prefers-color-scheme

AppComponent renderiza <router-outlet>
  └─ ¿hay token? → authGuard permite acceso → LayoutComponent (sidebar + header)
  └─ ¿sin token? → redirige a /login
```

---

## Convenciones del Proyecto

- **Standalone components**: 100% del código, cero NgModules
- **OnPush**: todos los componentes usan `ChangeDetectionStrategy.OnPush`
- **Inline templates**: todos los templates están en línea (sin archivos `.html`)
- **Control flow**: Angular 17+ `@if`, `@for`, `@empty` en lugar de `*ngIf`, `*ngFor`
- **Barrel exports**: `shared/components/index.ts` exporta todos los componentes compartidos
- **Injección funcional**: `inject()` en lugar de inyección por constructor en stores y servicios

---

## Ejecución

```bash
npm install        # o: pnpm install
npm start          # ng serve — http://localhost:4200
npm run build      # Build de producción en dist/oms-frontend
npm test           # Tests con Jest
npm run lint       # ESLint
```

> La API backend debe estar corriendo en `http://localhost:8080`.
