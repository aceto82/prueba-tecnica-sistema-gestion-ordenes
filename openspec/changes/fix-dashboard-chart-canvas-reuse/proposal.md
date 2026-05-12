# Proposal: Fix Chart.js canvas reuse error in Dashboard

## Intent

El dashboard lanza el error "Canvas is already in use. Chart with ID '0' must be destroyed before the canvas with ID '' can be reused". El componente crea un nuevo Chart sin destruir el anterior, y nunca limpia al destruirse.

## Scope

### In Scope
- Destruir el chart existente antes de crear uno nuevo en `createChart()`
- Agregar `ngOnDestroy()` para destruir el chart al salir del componente

### Out of Scope
- Migrar a ng2-charts u otra librería
- Cambios en el store o servicio
- Refactor del dashboard

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

## Approach

1. En `createChart()`: agregar `this.chart?.destroy()` al inicio
2. Implementar `OnDestroy`: agregar `ngOnDestroy()` con `this.chart?.destroy()`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/app/features/dashboard/dashboard.component.ts` | Modified | +destroy previo, +ngOnDestroy |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| destroy en null/undefined chart | Low | Optional chaining (`this.chart?.destroy()`) |

## Rollback Plan

Revert commit, o comentar las dos líneas agregadas.

## Dependencies

Ninguna.

## Success Criteria

- [ ] Navegar al dashboard no lanza error de canvas en consola
- [ ] Salir y volver al dashboard funciona sin errores
- [ ] `npm test` pasa sin errores
