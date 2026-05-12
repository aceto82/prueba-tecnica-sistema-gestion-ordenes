# Tasks: Fix empty form fields on edit (CVA + OnPush)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~6 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|-----|-------|
| 1 | Fix InputComponent + SelectComponent | PR 1 | Single PR, ~6 lines changed |

## Phase 1: Fix CVA markForCheck

- [x] 1.1 `input.component.ts`: Inject `ChangeDetectorRef`, call `this.cdr.markForCheck()` in `writeValue()`
- [x] 1.2 `select.component.ts`: Inject `ChangeDetectorRef`, call `this.cdr.markForCheck()` in `writeValue()`

## Phase 2: Verify

- [x] 2.1 Run `npm test` — all existing tests pass (31 suites, 106 tests)
- [ ] 2.2 Confirm form fields populate on edit without clicking (requires manual verification)
