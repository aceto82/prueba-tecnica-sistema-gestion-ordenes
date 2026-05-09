# Proposal: Fase 4 — Hardening (Tests + Clean Code + Performance Audits)

## Intent

Cerrar las Fases 1–3 con una capa de **calidad y rigor de ingeniería** que vuelva al sistema *demo-ready* para la entrevista técnica. Lo construido funciona, pero falta el blindaje que separa un prototipo de un sistema mantenible: cobertura de tests significativa en ambas capas, una pasada de Clean Code que elimine deuda acumulada en sprints rápidos, y auditorías de performance Angular (`OnPush`, `trackBy`, lazy loading) que eviten re-renders innecesarios y aseguren que el bundle se carga por demanda.

Esta fase no agrega features nuevas. Es la fase donde un equipo senior demuestra que entiende **cuándo dejar de iterar y empezar a consolidar**.

### Why now

- Fases 1–3 ya entregaron el dominio funcional completo (auth, orders, customers, dashboard, RBAC, reactive search). El producto es visiblemente estable.
- Los reviewers de la prueba técnica miran cobertura, separación de responsabilidades y micro-optimizaciones de Angular como señales de seniority.
- Cada fase posterior sin esta consolidación duplica el costo de mantenimiento.

### Success looks like

- Backend: cobertura de líneas ≥ 75% en `application/` y ≥ 70% en `infrastructure/web/controller/` y `infrastructure/persistence/`.
- Frontend: cobertura ≥ 70% en `core/services/`, stores de feature, y guards/interceptors; componentes críticos (list, form, dashboard) con tests de render + interacción.
- Cero componentes Angular sin `ChangeDetectionStrategy.OnPush`.
- Cero `*ngFor` (template syntax) y cero `@for` (control flow) sin `trackBy` / `track` expression.
- Todas las rutas de features son lazy (`loadComponent` / `loadChildren`); ningún feature module se carga en el bundle inicial salvo el shell de layout.
- Una pasada de Clean Code documentada: métodos > 20 líneas extraídos, naming consistente (verbos en use cases, sustantivos en entities), DTOs separados por dirección (request vs response), eliminación de código muerto.

## Scope

### In Scope

**Backend testing**
- Service layer (`OrderService`, `CustomerService`, `AuthService` si existe) con JUnit 5 + Mockito sobre repositorios mockeados — happy path + error paths + reglas de negocio (transiciones de estado de Order, scoping por rol).
- Repository layer con `@DataJpaTest` contra H2 — verificación de queries custom (`OrderSpecification`, búsquedas paginadas).
- Controller layer con `@WebMvcTest` + `MockMvc` — validación de contratos (status codes, JSON shape, security rules por rol).
- Security: tests adicionales sobre `JwtAuthenticationFilter` y `SecurityConfig` para asegurar que las reglas RBAC de Fase 3 se cumplen end-to-end a nivel de filter chain.

**Frontend testing**
- Services HTTP (`OrderService`, `CustomerService`, `DashboardService`, `AuthService`) con `HttpClientTestingModule` — request shape, query params, error mapping.
- Stores con Signals — estado inicial, transiciones tras `load()` / `create()` / `update()` / `delete()`, `computed` derivados (ej. `isAdmin`, filtros).
- Guards e interceptors — `AuthGuard`, `RoleGuard` (si existe), `JwtInterceptor` adjuntando `Authorization` header.
- Componentes presentacionales y de página vía Angular Testing Library — render, interacción de formularios, emisión de eventos. Foco en `order-list`, `order-form`, `customer-list`, `dashboard`.

**Clean Code pass**
- Backend: extracción de métodos largos en services y controllers; renombrar variables y métodos ambiguos; eliminar imports y código muerto; revisar uso de `Optional` y manejo de excepciones consistente; verificar separación request DTO vs response DTO.
- Frontend: extraer lógica de plantillas largas a `computed` signals; consolidar mappers HTTP; eliminar `any` residual; asegurar que stores no expongan signals mutables (siempre `.asReadonly()`).

**Performance audits (Angular)**
- **OnPush audit**: confirmar `ChangeDetectionStrategy.OnPush` en los 13 componentes detectados. Si alguno no lo tiene, agregarlo y resolver fallouts (p.ej. `markForCheck()` tras subscripciones manuales).
- **trackBy audit**: actualmente NINGÚN `*ngFor` tiene `trackBy` (3 archivos lo usan). Agregar `trackBy` por id en cada uno (o migrar a `@for` con `track item.id` si el equipo prefiere control flow nuevo).
- **Lazy loading audit**: confirmar que `app.routes.ts` y los routes de feature usan `loadComponent`/`loadChildren` (verificación inicial muestra que ya es el caso). Verificar que no hay imports estáticos que rompan el code-splitting.

### Out of Scope

- Nuevas features de producto (no se agregan endpoints, pantallas ni reglas de negocio).
- Migración de `*ngFor`/`*ngIf` a `@for`/`@if` (control flow nuevo de Angular 17+) salvo que sea trivial — es estilístico, no funcional.
- E2E tests (Cypress/Playwright) — fuera de alcance del challenge; se cubre lo crítico vía integration tests con `MockMvc` y Angular Testing Library.
- Refactor arquitectónico mayor (mover código entre capas, introducir mediator/CQRS, etc.) — solo Clean Code de bajo riesgo.
- Optimizaciones de bundle más allá de lazy loading (tree-shaking manual, deferred views de Angular, preloading strategies).
- Cobertura 100% — el objetivo es cobertura **significativa** en código de negocio, no en getters/setters ni DTOs.

## Approach

### Estrategia general

Tres tracks paralelos pero ordenados por riesgo:

1. **Tests primero** (mayor red de seguridad). Sin tests, cualquier refactor de Clean Code es ciego.
2. **Clean Code después** (con red de seguridad activa). Refactor con confianza.
3. **Audits al final** (cambios mecánicos, fáciles de verificar). Una vez el código está limpio y testeado, las auditorías son de bajo riesgo.

Cada track produce commits atómicos por capa/feature para que la review sea digerible.

### Backend tests

- Reutilizar el patrón ya presente en `OrderServiceTest` y `CustomerServiceTest` como referencia.
- Usar fixtures/builders para entities (evitar `new Order(...)` repetido en cada test).
- Para `@DataJpaTest`, usar H2 en memoria con `application-test.properties` mínimo.
- Para `@WebMvcTest`, mockear el service layer y tests de seguridad con `@WithMockUser(roles = "ADMIN" | "USER")`.

### Frontend tests

- Reutilizar el patrón presente en `order.store.spec.ts`, `auth.store.spec.ts`, `dashboard.store.spec.ts`.
- Para componentes de página, mockear stores via `provide({...})` y verificar bindings.
- Para HTTP services, `HttpTestingController.expectOne(...)` y verificar URL + body + headers (incluido `Authorization` cuando aplique).

### Clean Code pass

Pasada incremental, archivo por archivo, dirigida por:
- IDE warnings (Java compiler + ESLint).
- Métodos > 20 líneas → extraer.
- Magic numbers / strings → constantes.
- Inconsistencias de naming → estandarizar (`fetch*` para HTTP, `load*` para store actions, `on*` para handlers).

### Performance audits

- **OnPush**: grep + verificar uno por uno. Cambio mecánico.
- **trackBy**: agregar función `trackById` reutilizable (o usar `track item.id` directo si se migra a `@for`).
- **Lazy loading**: ya está aplicado, solo verificación + asegurar que `npm run build` muestra chunks separados por feature.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/test/java/**` | Expanded | Nuevos tests para controllers (`@WebMvcTest`), repositorios (`@DataJpaTest`), y completar gaps en services |
| `backend/src/main/java/com/oms/application/**` | Refactor | Clean Code: extraer métodos, renombrar, eliminar duplicación |
| `backend/src/main/java/com/oms/infrastructure/web/**` | Refactor | Clean Code: separar request/response DTOs, simplificar mappers |
| `frontend/src/app/**/*.spec.ts` | Expanded | Cobertura de stores, services, guards, interceptors, componentes |
| `frontend/src/app/**/*.component.ts` | Audit | Verificar/agregar `OnPush`; refactor de templates largos |
| `frontend/src/app/**/*.component.html` | Audit | Agregar `trackBy` a todos los `*ngFor` |
| `frontend/src/app/app.routes.ts` + `**/*.routes.ts` | Audit only | Verificar lazy loading (no se anticipan cambios) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Clean Code refactor introduce regresiones sutiles | Medium | Hacer la pasada DESPUÉS de tener tests; un refactor por commit; correr suite completa entre commits |
| Cobertura mínima alcanzada con tests poco significativos (tests "de cumplimiento") | Medium | Code review interno de cada PR de tests: ¿el test fallaría si la lógica está mal? Si no, no cuenta |
| Agregar `OnPush` a un componente legacy rompe su rendering por subscripciones manuales sin `markForCheck` | Low-Medium | Por componente: agregar OnPush + correr la app + tests; si rompe, agregar `markForCheck()` o `async` pipe |
| `trackBy` con función inline crea nueva referencia en cada CD cycle (anti-pattern) | Low | Usar `trackById` como método de clase, no arrow function inline en el template |
| `@DataJpaTest` con H2 no replica comportamiento de PostgreSQL (ej. funciones SQL específicas) | Low | El proyecto usa JPA estándar + Specification API; no hay SQL nativo |
| Tiempo subestimado — la fase es ancha (3 tracks × 2 stacks) | High | Priorizar: 1) tests de service layer backend + stores frontend, 2) controllers + components, 3) Clean Code, 4) audits. Si se acaba el tiempo, los audits son los más rápidos y deben quedar SÍ o SÍ |

## Tradeoffs

- **Cobertura vs profundidad**: priorizamos tests significativos sobre porcentaje. Un 70% de cobertura con tests que verifiquen reglas de negocio vale más que 90% de tests triviales.
- **Refactor agresivo vs estabilidad**: Clean Code se limita a lo que mejora legibilidad sin alterar contratos. Cualquier cambio que afecte API pública (endpoints, signatures de stores) queda fuera.
- **Migración `@for` vs no migración**: `*ngFor` con `trackBy` y `@for` con `track` son funcionalmente equivalentes. Mantenemos `*ngFor` para no inflar el diff; quien quiera migrar lo hace en una fase futura.

## Rollback Plan

- **Tests**: aditivos por naturaleza — si un test falla por bug real descubierto, se arregla el bug; si falla por test mal escrito, se revierte solo ese test.
- **Clean Code**: cada refactor en commit separado → revert quirúrgico.
- **Audits**: cambios mecánicos y locales (decorador OnPush, atributo trackBy) → revert por archivo.

## Dependencies

- Suite de tests existente debe pasar en `main` antes de empezar (baseline verde).
- `H2` ya está en el classpath de test del backend (heredado de Spring Boot starter test).
- `@testing-library/angular` debe estar instalado en frontend (verificar `package.json`).
- No hay dependencias externas nuevas.

## Success Criteria

- [ ] `./mvnw test` pasa con > 75% de cobertura en `application/` (verificable con JaCoCo si está configurado, o por inspección)
- [ ] `npm test` pasa con > 70% de cobertura en `core/services/` y stores de feature
- [ ] Todos los componentes Angular tienen `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Todos los `*ngFor` tienen `trackBy` apuntando a un método de clase (no arrow inline)
- [ ] `npm run build --configuration production` produce chunks separados por feature (orders, customers, dashboard, auth)
- [ ] Clean Code pass: ningún método > 30 líneas en services y controllers; ningún `any` residual en frontend salvo justificado
- [ ] CHANGELOG / release notes de Fase 4 documentan la pasada de hardening (sin features nuevas)
