# Proposal: Fase 4 — Hardening (Tests + Clean Code + Performance Audits)

## Intent

Cerrar las Fases 1–3 con una capa de **calidad y rigor de ingeniería** que vuelva al sistema *demo-ready* para la entrevista técnica. Lo construido funciona, pero falta el blindaje que separa un prototipo de un sistema mantenible: cobertura de tests significativa en ambas capas, una pasada de Clean Code que elimine deuda acumulada en sprints rápidos, y auditorías de performance Angular (`OnPush`, `trackBy`, lazy loading) que eviten re-renders innecesarios y aseguren que el bundle se carga por demanda.

Esta fase no agrega features nuevas. Es la fase donde un equipo senior demuestra que entiende **cuándo dejar de iterar y empezar a consolidar**.

## Success Criteria

- Backend: cobertura de líneas ≥ 75% en `application/` y ≥ 70% en `infrastructure/web/controller/` y `infrastructure/persistence/`.
- Frontend: cobertura ≥ 70% en `core/services/`, stores de feature, y guards/interceptors; componentes críticos (list, form, dashboard) con tests de render + interacción.
- Cero componentes Angular sin `ChangeDetectionStrategy.OnPush`.
- Cero `*ngFor` (template syntax) y cero `@for` (control flow) sin `trackBy` / `track` expression.
- Todas las rutas de features son lazy (`loadComponent` / `loadChildren`); ningún feature module se carga en el bundle inicial salvo el shell de layout.
- Una pasada de Clean Code documentada: métodos > 20 líneas extraídos, naming consistente, DTOs separados por dirección, eliminación de código muerto.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/test/java/**` | Expanded | Nuevos tests para controllers, repositorios, y completar gaps en services |
| `backend/src/main/java/com/oms/application/**` | Refactor | Clean Code: extraer métodos, renombrar, eliminar duplicación |
| `backend/src/main/java/com/oms/infrastructure/web/**` | Refactor | Clean Code: separar request/response DTOs, simplificar mappers |
| `frontend/src/app/**/*.spec.ts` | Expanded | Cobertura de stores, services, guards, interceptors, componentes |
| `frontend/src/app/**/*.component.ts` | Audit | Verificar/agregar `OnPush`; refactor de templates largos |
| `frontend/src/app/**/*.component.html` | Audit | Agregar `trackBy` a todos los `*ngFor` |
| `frontend/src/app/app.routes.ts` + `**/*.routes.ts` | Audit only | Verificar lazy loading |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Clean Code refactor introduce regresiones sutiles | Medium | Hacer la pasada DESPUÉS de tener tests; un refactor por commit |
| Cobertura mínima alcanzada con tests poco significativos | Medium | Code review: ¿el test fallaría si la lógica está mal? |
| Agregar OnPush rompe rendering por subscripciones manuales | Low-Medium | Por componente: agregar OnPush + correr app + tests |
| trackBy con función inline (anti-pattern) | Low | Usar trackById como método de clase |
| Tiempo subestimado | High | Priorizar: tests → controllers + components → Clean Code → audits |

## Rollback Plan

- **Tests**: aditivos — si falla un test, se arregla el bug o se revierte el test.
- **Clean Code**: cada refactor en commit separado → revert quirúrgico.
- **Audits**: cambios mecánicos (decorador OnPush, atributo trackBy) → revert por archivo.
