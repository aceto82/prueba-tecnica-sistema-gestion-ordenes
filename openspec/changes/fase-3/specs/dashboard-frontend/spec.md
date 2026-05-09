# Spec: dashboard-frontend (Fase 3)

## Purpose

Dashboard UI component with KPI cards and Chart.js visualization for order statistics.

---

## Requirement: DashboardComponent Renders KPI Cards

The `DashboardComponent` MUST display 4 KPI cards showing:
- Total Orders (count)
- Pending Orders (count)
- Processing Orders (count)
- Completed Orders (count)

The component MUST be standalone with `OnPush` change detection. Data MUST flow through `DashboardStore` using signals.

#### Scenario: Dashboard loads and displays KPI cards

- GIVEN `DashboardStore.stats()` signal contains valid data
- WHEN `DashboardComponent` renders
- THEN 4 KPI cards are visible with correct counts

#### Scenario: KPI cards show loading state initially

- GIVEN the dashboard endpoint is being fetched
- WHEN the component renders before data arrives
- THEN a loading indicator is displayed in each KPI card

#### Scenario: KPI cards handle empty data

- GIVEN `DashboardStore.stats()` returns null or zero values
- WHEN the component renders
- THEN each card displays "0" appropriately

---

## Requirement: DashboardComponent Displays Chart.js Bar Chart

The dashboard MUST include a bar chart showing order count by status. The chart MUST use Chart.js integrated with Angular, with `ChangeDetectorRef.markForCheck()` called after async data to avoid ExpressionChangedAfterItHasBeenCheckedError.

#### Scenario: Bar chart renders with status distribution

- GIVEN `DashboardStore.stats().byStatus` contains data
- WHEN the component receives non-null stats
- THEN a Chart.js bar chart is displayed with 4 bars (PENDING, PROCESSING, COMPLETED, CANCELLED)

#### Scenario: Chart updates when new data arrives

- GIVEN a bar chart is already displayed
- WHEN `DashboardStore.stats()` updates to new values
- THEN the chart re-renders with updated bar heights

#### Scenario: Chart handles zero values

- GIVEN no orders exist for a particular status
- WHEN the chart renders
- THEN the bar for that status shows height 0 (not missing)

---

## Requirement: DashboardStore Fetches and Exposes Stats

The `DashboardStore` (signal store) MUST:
- Expose a `stats` signal holding `DashboardStatsDto | null`
- Call `GET /api/dashboard/stats` on initialization
- Expose a `loading` signal for UI loading states
- Expose an `error` signal for error states

#### Scenario: Store fetches stats on initialization

- GIVEN the application navigates to the dashboard route
- WHEN `DashboardStore` is instantiated
- THEN `GET /api/dashboard/stats` is called automatically

#### Scenario: Store exposes loading signal

- GIVEN the HTTP request is pending
- WHEN `DashboardStore.loading()` is read
- THEN the value is `true`

#### Scenario: Store exposes error on failure

- GIVEN the HTTP request fails with 500
- WHEN `DashboardStore.error()` is read
- THEN it contains the error message