# Tasks: Fase 4 — Hardening (Tests + Clean Code + Angular Audits)

## Summary

30 total tasks across 4 PRs (A1, A2, B, C). All tasks completed as of 2026-05-09.

| PR  | Name | Tasks | Status | LOC |
|-----|------|-------|--------|-----|
| A1  | Backend Tests | F4-T01 through F4-T07 (7 tasks) | ALL COMPLETE | ~380 |
| A2  | Frontend Tests | F4-T08 through F4-T18 (11 tasks) | ALL COMPLETE | ~320 |
| B   | Clean Code | F4-T19 through F4-T24 (6 tasks) | ALL COMPLETE | ~90 |
| C   | Angular Audits | F4-T25 through F4-T30 (6 tasks) | ALL COMPLETE | ~70 |

---

## PR A1 — Backend Tests (7 tasks)

- [x] F4-T01: OrderServiceTest — add role-scoping scenarios (USER vs ADMIN)
- [x] F4-T02: OrderRepositoryAdapterTest (NEW) — @DataJpaTest: find by status, by username, paginated
- [x] F4-T03: JwtServiceTest — add tampered token + role extraction scenarios; added extractRole() to JwtService
- [x] F4-T04: OrderControllerSecurityTest — 401/403/400 scenarios via new dedicated security test file
- [x] F4-T05: CustomerControllerSecurityTest — 401/403/400 scenarios via new dedicated security test file
- [x] F4-T06: DashboardControllerTest (NEW) — @WebMvcTest: 200 with stats, 401 without JWT
- [x] F4-T07: GlobalExceptionHandlerTest (NEW) — unit test all 7 exception handlers → ProblemDetail

**Result**: 28 new test methods added; 100 total backend tests passing.

---

## PR A2 — Frontend Tests (11 tasks)

- [x] F4-T08: OrderStore.spec — add update() replaces order scenario
- [x] F4-T09: CustomerStore.spec — HTTP 500 sets error signal (pre-existing, verified)
- [x] F4-T10: dashboard.service.spec (NEW) — GET /api/dashboard/stats
- [x] F4-T11: auth.service.spec (NEW) — POST /api/auth/login
- [x] F4-T12: order-list.component.spec (NEW) — smoke spec
- [x] F4-T13: order-form.component.spec (NEW) — smoke spec
- [x] F4-T14: order-detail.component.spec (NEW) — smoke spec
- [x] F4-T15: customer-list.component.spec (NEW) — smoke spec
- [x] F4-T16: customer-form.component.spec (NEW) — smoke spec
- [x] F4-T17: customer-detail.component.spec (NEW) — smoke spec
- [x] F4-T18: dashboard.component.spec (NEW) — smoke spec; fixed Signal.subscribe() bug in production code

**Result**: 27 new test methods across 9 files; 65 total frontend tests passing.

---

## PR B — Clean Code (6 tasks)

- [x] F4-T19: Remove console.log in order-list.component.ts:268
- [x] F4-T20: OrderStore readonly audit — all already compliant
- [x] F4-T21: CustomerStore readonly audit — all already compliant
- [x] F4-T22: AuthStore readonly audit — all already compliant
- [x] F4-T23: Frontend dead imports removed — OrderListParams, CurrencyPipe, signal (3 items)
- [x] F4-T24: Java unused variable audit — application/ and infrastructure/web/ are clean

**Result**: 1 console.log removed, 3 dead imports removed, zero refactoring needed (code was already clean).

---

## PR C — Angular Audits (6 tasks)

- [x] F4-T25: trackBy on customer-list *ngFor (customer rows) — trackById class method
- [x] F4-T26: trackBy on order-list *ngFor (status options) — trackByStatus class method
- [x] F4-T27: trackBy on order-list *ngFor (order rows) — trackById class method
- [x] F4-T28: trackBy on order-form *ngFor (customer options) — trackById class method
- [x] F4-T29: OnPush audit — 14/14 components now compliant (added to AppComponent)
- [x] F4-T30: Lazy loading audit — app.routes.ts fully lazy; no eager feature imports

**Result**: 4 *ngFor instances with trackBy methods, AppComponent OnPush added, lazy loading confirmed.

---

## Task Dependencies

A1 || A2 → B → C

A1 and A2 can be written in parallel. PR B requires either A1 or A2 merged first. PR C requires PR B merged.

---

## Commits Summary

### PR A1
- a957b6b: test(backend): add OrderService and CustomerService unit tests
- 478377a: test(backend): add OrderRepositoryAdapter @DataJpaTest
- aa8daae: test(backend): add JwtService unit tests
- 5851817: test(backend): add OrderController, CustomerController, DashboardController, and GlobalExceptionHandler @WebMvcTest

### PR A2
- 279fc21: test(frontend): add OrderStore update(), DashboardService and AuthService unit tests
- 46a39a0: test(frontend): add smoke specs for all 7 page components

### PR B
- 8cc7f2c: refactor(frontend): extract long methods, remove console.log and dead code

### PR C
- c793676: perf(frontend): add trackBy to all *ngFor — prevent unnecessary DOM re-renders
- 6d92bd0: chore(frontend): verify OnPush on all 14 components and lazy loading in app.routes.ts

### Post-Verification
- 3a8b7c9: test(backend): add DashboardController 401 test and OrderController 403 scenario

---

## Status: ALL 30 TASKS COMPLETE ✓
