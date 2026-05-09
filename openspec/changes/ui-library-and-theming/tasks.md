# Tasks: UI Library + SCSS Architecture + Dark/Light Theming

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,115 (new: ~820, modified: ~295) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR-A (Infrastructure: SCSS + ThemeStore + shared components) → PR-B (Migration: migrate 14 components) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (same branch) |

Decision needed before apply: No (user chose chained PRs)
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

## Phase 1: SCSS Architecture ✅ (PR-A)

- [x] 1.1 Create `frontend/src/styles/_variables.scss` with CSS Custom Properties
- [x] 1.2 Create `frontend/src/styles/_typography.scss` with type scale
- [x] 1.3 Create `frontend/src/styles/_buttons.scss` with `.btn` system
- [x] 1.4 Create `frontend/src/styles/_layout.scss` with layout utilities
- [x] 1.5 Create `frontend/src/styles/_components.scss` with table, pagination, badge, form-control
- [x] 1.6 Create `frontend/src/styles/_theme.scss` with `[data-theme="dark"]` overrides
- [x] 1.7 Modify `frontend/src/styles.scss` to import all partials
- [x] 1.8 Modify `frontend/angular.json` — add stylePreprocessorOptions

## Phase 2: ThemeStore ✅ (PR-A)

- [x] 2.1 Create `frontend/src/app/core/theme.store.ts`
- [x] 2.2 Wire `ThemeStore.init()` in `app.config.ts`

## Phase 3: Shared Components ✅ (PR-A)

- [x] 3.1 Create `ButtonComponent` — 5 variants + 3 sizes
- [x] 3.2 Create `InputComponent` — ControlValueAccessor
- [x] 3.3 Create `SelectComponent` — ControlValueAccessor
- [x] 3.4 Create `BadgeComponent` — 6 variants
- [x] 3.5 Create `CardComponent` — padding + shadow props
- [x] 3.6 Create `TableComponent` — columns, data, loading, empty
- [x] 3.7 Create `PaginationComponent` — pageChange output
- [x] 3.8 Create `ModalComponent` — native `<dialog>`
- [x] 3.9 Create `ConfirmDialogComponent` — wraps Modal
- [x] 3.10 Create barrel export `index.ts`

## Phase 4: Component Migration ⏳ (PR-B — pending)

- [ ] 4.1 Modify `HeaderComponent` — add theme toggle button
- [ ] 4.2 Modify `SidebarComponent` — use CSS var colors
- [ ] 4.3 Modify `LoginPageComponent` — use Card, Input, Button
- [ ] 4.4 Modify `OrderListComponent` — use Button, Table, Pagination, Badge, Input, Select
- [ ] 4.5 Modify `OrderFormComponent` — use Card, Input, Select, Button
- [ ] 4.6 Modify `OrderDetailComponent` — use Card, Badge, Button
- [ ] 4.7 Modify `CustomerListComponent` — use Button, Table, Pagination
- [ ] 4.8 Modify `CustomerFormComponent` — use Card, Input, Button
- [ ] 4.9 Modify `DashboardComponent` — use Card, CSS var colors
- [ ] 4.10 Modify `UserListComponent` — use Button, Table, Pagination, Badge
- [ ] 4.11 Modify `UserFormComponent` — use Card, Input, Select, Button

## Phase 5: Verify ⏳

- [ ] 5.1 Run `npm test` — verify all tests pass
- [ ] 5.2 Run `npm run build` — verify production build succeeds
- [ ] 5.3 Manual visual check: login, order list, order form, customer list, dashboard in both themes
