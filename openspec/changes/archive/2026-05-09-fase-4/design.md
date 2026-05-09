# Design: Fase 4 (Hardening — Tests + Clean Code + Angular Audits)

**What**: Technical design for Fase 4. Three sequential PRs, no new features.

**Why**: Lock in Fases 1–3 with a real test net, mechanical Clean Code pass, and verified Angular perf hygiene before any new feature work.

---

## Key Decisions (ADRs)

- **ADR-1**: Sequential tracks Tests → Clean Code → Audits (refactor with safety net)
- **ADR-2**: Backend test layering — Mockito for services, @DataJpaTest for repos, @WebMvcTest for controllers, plain JUnit for domain
- **ADR-3**: Frontend test patterns — HttpTestingController for services, TestBed + mocked service for stores, Angular Testing Library smoke specs for components
- **ADR-4**: Coverage target ~70-75% on business code; exclude DTOs/getters/config/main
- **ADR-5**: Clean Code rules — extract > 20 lines or > 2 nesting, no abbreviations, constants at top, no console.log, no `any`
- **ADR-6**: OnPush audit is verification-only (all 13 components already declare OnPush)
- **ADR-7**: trackBy via class methods (not inline arrows). 4 *ngFor instances need it: customer-list, order-list (status + rows), order-form
- **ADR-8**: Lazy-loading audit is one-line confirmation — app.routes.ts already fully lazy

---

## Delivery Slicing

- **PR A (~700 LOC)**: all new tests (backend + frontend). Optional split into A1/A2 if reviewer requests
- **PR B (~250 LOC)**: Clean Code pass, requires PR A merged
- **PR C (~80 LOC)**: trackBy adds + audit confirmations

---

## Confirmed Gaps in Current Code

- 4 *ngFor without trackBy: customer-list:127, order-list:164 + 187, order-form:111
- 1 console.log: order-list.component.ts:268 (delete placeholder)
- All 13 components already have ChangeDetectionStrategy.OnPush
- app.routes.ts already uses loadComponent/loadChildren on every feature

---

## Risks

- Coverage chase trap (mitigated by exclusion list + heuristic)
- OnPush silent stale renders (manual verification per route)
- PR A size — may need auto-chain split
- Smoke-test scope creep (capped at "renders + click")
- No lint enforcement this phase (acceptable; future follow-up)

---

## Implementation Approach

### Backend tests
- Reutilizar el patrón ya presente en OrderServiceTest y CustomerServiceTest
- Usar fixtures/builders para entities
- Para @DataJpaTest, usar H2 en memoria
- Para @WebMvcTest, mockear el service layer y tests de seguridad con @WithMockUser

### Frontend tests
- Reutilizar el patrón en order.store.spec.ts, auth.store.spec.ts
- Para componentes de página, mockear stores via provide({...})
- Para HTTP services, HttpTestingController.expectOne(...) y verificar URL + body + headers

### Clean Code pass
- IDE warnings (Java compiler + ESLint) como driver
- Métodos > 20 líneas → extraer
- Magic numbers/strings → constantes
- Inconsistencias de naming → estandarizar

### Performance audits
- OnPush: grep + verificar uno por uno
- trackBy: agregar función trackById reutilizable
- Lazy loading: ya está aplicado, solo verificación
