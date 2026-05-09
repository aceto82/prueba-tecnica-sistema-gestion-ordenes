# Proposal: UI Library + SCSS Architecture + Dark/Light Theming

## Intent

Eliminar la duplicación masiva de estilos inline en 14 componentes Angular y agregar un sistema de tema dark/light. Hoy cada componente redefine `.btn`, `.form-control`, `.table`, `.badge` etc. — ~400 líneas de CSS duplicado que dificultan mantenimiento y hacen imposible un cambio de tema global.

## Scope

### In Scope
- SCSS partials con CSS Custom Properties (colores, spacing, typography, shadows)
- Tema claro (por defecto) + oscuro con `[data-theme="dark"]`
- Shared presentational components: Button, Input, Select, Badge, Card, Table, Pagination, Modal, ConfirmDialog
- ThemeStore con signal + localStorage para persistir preferencia
- Theme toggle en HeaderComponent
- Migración de 14 componentes existentes para usar shared components + variables CSS
- Actualizar/verificar tests existentes

### Out of Scope
- DatePicker, Dropdown, Autocomplete u otros componentes no existentes
- Migrar Chart.js del dashboard
- Cambiar lógica de negocio, stores o routing
- Animaciones complejas

## Capabilities

### New Capabilities
- `shared-ui-components`: Componentes presentacionales standalone + OnPush con inputs/outputs tipados
- `scss-architecture`: SCSS partials + CSS Custom Properties para theming
- `theme-system`: Dark/light mode con ThemeStore, toggle y persistencia

### Modified Capabilities
None

## Approach

1. **SCSS**: CSS Custom Properties en `:root` (light) y `[data-theme="dark"]` (dark), organizadas en partials por responsabilidad
2. **Components**: Atomic design — primitives (Button, Input, Select, Badge) → composed (Card, Table, Pagination) → compound (Modal, ConfirmDialog)
3. **ThemeStore**: Signal + localStorage, expone `isDark: Signal<boolean>` y `toggle()`
4. **Header**: Agrega botón de theme toggle (icono sol/luna)
5. **Migración**: 1 componente a la vez, tests después de cada uno

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/styles/` | New | 6 SCSS partials |
| `frontend/src/styles.scss` | Modify | Import partials |
| `frontend/src/app/shared/components/` | New | Button, Input, Select, Badge, Card, Table, Pagination, Modal, ConfirmDialog |
| `frontend/src/app/core/theme.store.ts` | New | ThemeStore signal + localStorage |
| `frontend/src/app/shared/ui/layout/header/` | Modify | Add theme toggle |
| `frontend/src/app/features/*/pages/*` | Modify | Replace inline styles with shared components |
| `frontend/src/app/shared/ui/layout/sidebar/` | Modify | Same |
| `frontend/angular.json` | Modify | Add stylePreprocessorOpts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regresión visual | Medium | Migrar 1 componente a la vez, verificar tests |
| Tests rotos por cambio de selectores | Medium | Usar queries semánticas (getByRole, getByText) |
| Scope creep | Medium | Limitar al inventory existente |

## Rollback

Eliminar `styles/`, `shared/components/`, `theme.store.ts`, revertir cambios en componentes y `styles.scss`.

## Success Criteria

- [ ] 78 tests frontend existentes siguen pasando
- [ ] Cero estilos duplicados de button/input/table/badge/pagination
- [ ] Tema oscuro funcional con persistencia
- [ ] `npm run build` compila sin errores
