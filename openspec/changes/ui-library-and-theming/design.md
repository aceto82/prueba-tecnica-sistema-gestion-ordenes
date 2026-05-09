# Design: UI Library + SCSS Architecture + Dark/Light Theming

## Technical Approach

Tres capas independientes pero integradas:

1. **SCSS Architecture** — CSS Custom Properties globales en partials, importados desde `styles.scss`. Sin dependencia de build tools externas.
2. **Shared Components** — Atomic design: primitives (Button, Input, Select, Badge) → composed (Card, Table, Pagination) → compound (Modal, ConfirmDialog). Todos standalone + OnPush.
3. **Theme System** — `ThemeStore` con signal que persiste en localStorage. Aplica `data-theme` attribute en `<html>`. CSS Custom Properties reaccionan automáticamente.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Theming mechanism | CSS Custom Properties via `data-theme` attr | Angular service + class binding | CSS custom properties son nativas, no requieren JS para re-render, funcionan con OnPush, y permiten transiciones CSS |
| Component architecture | Standalone presentacionales con @Input() | NgModule library | El proyecto ya es 100% standalone; crear un NgModule sería inconsistente |
| CSS naming | BEM modificado (clases cortas: `btn`, `btn--primary`) | BEM estricto (`.button__icon--large`) | El proyecto actual usa clases cortas; mantener consistencia reduce fricción |
| Theme persistence | localStorage + ThemeStore signal | CSS-only `prefers-color-scheme` | `prefers-color-scheme` es útil para initial load, pero el usuario debe poder togglear y persistir |
| Modal implementation | HTML `<dialog>` element | Angular CDK Overlay | `<dialog>` es nativo, accesible, no requiere dependencias. Polyfill no necesario en browsers modernos |

## Data Flow (Theming)

```
User clicks toggle in Header
  → ThemeStore.toggle()
    → signal updated (isDark)
    → localStorage.setItem('theme', 'dark'|'light')
    → effect() sets document.documentElement.dataset.theme
      → CSS Custom Properties swap automáticamente
        → Todos los componentes se actualizan sin re-render
```

## Component Contracts

### ButtonComponent
```typescript
@Input() variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' = 'primary';
@Input() size: 'sm' | 'md' | 'lg' = 'md';
@Input() disabled = false;
@Input() loading = false;
@Input() type: 'button' | 'submit' = 'button';
@Output() clicked = new EventEmitter<void>();
```

### InputComponent
```typescript
@Input() label: string;
@Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
@Input() placeholder: string;
@Input() error: string | null;
@Input() disabled = false;
// ReactiveForms via control binding (control: ControlValueAccessor)
```

### SelectComponent
```typescript
@Input() label: string;
@Input() options: { value: string | number; label: string }[];
@Input() placeholder: string;
@Input() error: string | null;
@Input() disabled = false;
// ControlValueAccessor for reactive forms
```

### BadgeComponent
```typescript
@Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'default';
@Input() size: 'sm' | 'md' = 'md';
```

### CardComponent
```typescript
@Input() padding: 'sm' | 'md' | 'lg' = 'md';
@Input() shadow: 'sm' | 'md' | 'lg' = 'md';
// Content via <ng-content>
```

### TableComponent
```typescript
@Input() columns: { key: string; label: string; sortable?: boolean }[];
@Input() data: any[];
@Input() loading = false;
@Input() emptyMessage = 'No data found';
// Template for cell rendering via ng-template or column definition
```

### PaginationComponent
```typescript
@Input() currentPage: number;
@Input() totalPages: number;
@Input() totalElements: number;
@Output() pageChange = new EventEmitter<number>();
```

### ModalComponent
```typescript
@Input() open = false;
@Input() title: string;
@Input() size: 'sm' | 'md' | 'lg' = 'md';
@Output() closed = new EventEmitter<void>();
// Uses native <dialog>
```

### ConfirmDialogComponent
```typescript
@Input() title = 'Confirm';
@Input() message: string;
@Input() confirmLabel = 'Confirm';
@Input() cancelLabel = 'Cancel';
@Input() variant: 'primary' | 'danger' = 'primary';
@Output() confirmed = new EventEmitter<void>();
@Output() cancelled = new EventEmitter<void>();
```

## CSS Custom Properties Architecture

```scss
// _variables.scss — design tokens
:root {
  // Colors (light theme — default)
  --color-primary: #1976d2;
  --color-primary-hover: #1565c0;
  --color-danger: #d32f2f;
  --color-success: #4caf50;
  --color-warning: #ff9800;
  --color-info: #2196f3;
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-text: #212121;
  --color-text-secondary: #555;
  --color-text-muted: #888;
  --color-border: #ccc;
  --color-border-light: #e0e0e0;
  
  // Spacing
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  // Border radius
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 999px;
  
  // Shadows
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.08);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.12);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.16);
  
  // Typography
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-sm: 0.75rem;
  --font-size-base: 0.875rem;
  --font-size-lg: 1rem;
  --font-size-xl: 1.25rem;
}

// _theme.scss — dark overrides
[data-theme="dark"] {
  --color-primary: #90caf9;
  --color-primary-hover: #64b5f6;
  --color-danger: #ef5350;
  --color-success: #66bb6a;
  --color-warning: #ffa726;
  --color-info: #42a5f5;
  --color-bg: #121212;
  --color-surface: #1e1e1e;
  --color-text: #e0e0e0;
  --color-text-secondary: #aaa;
  --color-text-muted: #777;
  --color-border: #444;
  --color-border-light: #333;
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.3);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.4);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.5);
}
```

## File Changes

| File | Action |
|------|--------|
| `frontend/src/styles/_variables.scss` | Create |
| `frontend/src/styles/_typography.scss` | Create |
| `frontend/src/styles/_buttons.scss` | Create |
| `frontend/src/styles/_layout.scss` | Create |
| `frontend/src/styles/_components.scss` | Create |
| `frontend/src/styles/_theme.scss` | Create |
| `frontend/src/styles.scss` | Modify — import partials |
| `frontend/src/app/core/theme.store.ts` | Create |
| `frontend/src/app/shared/components/button/button.component.ts` | Create |
| `frontend/src/app/shared/components/input/input.component.ts` | Create |
| `frontend/src/app/shared/components/select/select.component.ts` | Create |
| `frontend/src/app/shared/components/badge/badge.component.ts` | Create |
| `frontend/src/app/shared/components/card/card.component.ts` | Create |
| `frontend/src/app/shared/components/table/table.component.ts` | Create |
| `frontend/src/app/shared/components/pagination/pagination.component.ts` | Create |
| `frontend/src/app/shared/components/modal/modal.component.ts` | Create |
| `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts` | Create |
| `frontend/src/app/shared/components/index.ts` | Create — barrel export |
| `frontend/src/app/shared/ui/layout/header/header.component.ts` | Modify — add theme toggle |
| `frontend/src/app/features/orders/pages/order-list/order-list.component.ts` | Modify |
| `frontend/src/app/features/orders/pages/order-form/order-form.component.ts` | Modify |
| `frontend/src/app/features/orders/pages/order-detail/order-detail.component.ts` | Modify |
| `frontend/src/app/features/customers/pages/customer-list/customer-list.component.ts` | Modify |
| `frontend/src/app/features/customers/pages/customer-form/customer-form.component.ts` | Modify |
| `frontend/src/app/features/auth/login-page/login-page.component.ts` | Modify |
| `frontend/src/app/features/dashboard/dashboard.component.ts` | Modify |
| `frontend/src/app/features/users/pages/user-list/user-list.component.ts` | Modify |
| `frontend/src/app/features/users/pages/user-form/user-form.component.ts` | Modify |
| `frontend/src/app/shared/ui/layout/sidebar/sidebar.component.ts` | Modify |
| `frontend/angular.json` | Modify — add stylePreprocessorOpts |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit (ThemeStore) | toggle, init, persistence, dark mode detection | Jest + localStorage mock |
| Component (shared) | Render variants, events, disabled/loading states | Jest + Testing Library |
| Component (migrated) | Smoke tests — same behavior after migration | Existing tests must pass |
| Visual regresión | No tool — manual check per component | Migrate one by one |

## Open Questions

None — design is complete.
