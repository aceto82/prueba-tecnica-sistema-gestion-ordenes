# Proposal: Fix empty form fields on edit (CVA + OnPush)

## Intent

Al editar Customers o Users, los campos del formulario aparecen vacíos. Los valores solo se muestran después de hacer clic en cada campo. Es un bug de UI que rompe la experiencia de edición.

## Scope

### In Scope
- Agregar `ChangeDetectorRef.markForCheck()` en `InputComponent.writeValue()`
- Agregar `ChangeDetectorRef.markForCheck()` en `SelectComponent.writeValue()`

### Out of Scope
- Cambios en la lógica de negocio o formularios
- Refactors en el store o servicios
- Otros componentes CVA (ninguno se vio afectado)

## Capabilities

### New Capabilities
None — bug fix puro, sin cambios de spec.

### Modified Capabilities
None — no cambia comportamiento a nivel spec.

## Approach

Inyectar `ChangeDetectorRef` en `InputComponent` y `SelectComponent`, y llamar `this.cdr.markForCheck()` dentro de `writeValue()` después de asignar `this.value`. Esto asegura que Angular detecte el cambio en el template binding `[value]="value"` cuando el formulario padre llama a `patchValue()` desde un callback asincrónico.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/app/shared/components/input/input.component.ts` | Modified | + cdr injection, + markForCheck en writeValue |
| `frontend/src/app/shared/components/select/select.component.ts` | Modified | + cdr injection, + markForCheck en writeValue |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| markForCheck excesivo degradando rendimiento | Low | Solo se llama en writeValue, que ocurre cuando el form control cambia — no hay loop |
| Breaking change en tests de Input/Select | Low | markForCheck no afecta el comportamiento funcional |

## Rollback Plan

`git revert` de los commits en esta rama. Cambio acotado a 2 archivos.

## Dependencies

Ninguna.

## Success Criteria

- [ ] Al editar un Customer, los campos name y email aparecen poblados al cargar la página
- [ ] Al editar un User, los campos username y role aparecen poblados al cargar la página
- [ ] Los tests existentes de InputComponent y SelectComponent siguen pasando
- [ ] `npm test` pasa sin errores
