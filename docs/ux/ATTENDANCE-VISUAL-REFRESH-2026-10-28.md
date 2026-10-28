# Attendance visual refresh — 2026-10-28

## Scope

The Attendance dashboard now uses the existing complete attendance-summary response for four named-check-in charts (members/visitors, category, gender, source) and two separately labelled reported-headcount charts. The trend uses the existing report grant. Basic charts do not require advanced Analytics. Unknown categories remain visible; null demographic subtotals are not turned into supplied zeroes. The reported age/gender dimensions describe the same total and are never added together or to named check-ins.

The automatic dashboard range starts 29 days before today and includes the final day through 23:59:59.999Z, matching the existing API calendar-date contract. HQ uses permitted church-wide scope; branch users send their assigned branch. KPI cards, recent-record/event lists and dashboard filters were removed, including their unnecessary queries. Compact task links retain their individual permissions. Summary and trend failures load and retry independently.

Check-in, records, reports, service directories/details and service forms opt into the Members neutral/teal presentation through Attendance wrappers. Category and status badges have text labels. Service administration lives under More options; archive/restore/delete confirmations and mutation handlers remain intact. Forms retain their fields, schemas, defaults and unsaved-change guards. Shared headcount dialogs accept an optional presentation class with unchanged defaults for events/departments/cell groups.

Records retain visible branch/service/date filters and move category/reset into More filters. Report exports now include the selected branch as well as dates. Named and reported-headcount exports stay within their respective tabs. Reports emphasize charts and explicitly identify the per-service chart as a maximum-200-loaded-record sample; export fetches all matching pages.

No API, database, subscription, route, or permission-seed changes. Dedicated Analytics is unchanged.

## Verification

- Unit suite, targeted lint, TypeScript, production build and Attendance browser regressions; see final implementation report for results.
- New mocked browser coverage checks summary-only/report access, denied access, HQ/branch scope, inclusive dashboard dates, missing demographics, empty states, independent failures/retry, record/report export filters, service lifecycle controls and responsive chart layouts.
- Existing roster/session regressions navigate the existing Attendance tab on department/cell-group detail pages.
- Mock-data previews are saved outside the repository at `/tmp/churchos-attendance-previews/` (desktop/mobile and dark views, check-in, records, services, service form, service detail and reports). These are local test fixtures, not live church data.

## Release

Web-only deployment through the repository's normal process. No deployment or live writes were performed during this implementation; the public Vercel site changes only after the web release.
