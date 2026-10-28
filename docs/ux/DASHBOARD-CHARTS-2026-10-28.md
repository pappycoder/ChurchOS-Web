# Main dashboard charts

The main `/dashboard` now presents attendance trends, giving trends, member growth,
membership status, age distribution, and giving by category using the existing
Recharts components. The welcome card is smaller, common-task links remain near
the top, and the existing notification drawer, notification details, mark-as-read
actions, profile link, and account activity remain available.

## Reporting controls

- Default dates: the last 30 calendar days, including today. The selected end date
  includes its entire UTC day. Reset restores these dates, all permitted branches
  for HQ viewers, and NGN.
- Attendance and giving use the selected dates and branch. Giving also uses the
  selected currency, without conversion.
- Membership uses the selected branch. Demographics are current snapshots and
  growth retains the existing cumulative joining-month history; neither uses the
  date filter. The dashboard labels this distinction explicitly.
- HQ branch choices require the existing branch-read permission. Branch users
  remain locked to their own scope. Missing branch assignment does not grant
  church-wide membership access.
- Charts and requests require their existing analytics permissions and plan
  entitlements. Giving-dashboard readers without giving analytics retain their
  existing fixed-period summary. Upcoming events and notifications retain their
  existing scope and are independent of the reporting filters.
- Chart queries show independent loading, empty, and retry states. Failures show
  unavailable summary values rather than zero. Filtered queries use separate cache
  entries, without retaining another selection's results under new labels.

## API compatibility and deployment

`GET /analytics/members` adds an optional UUID `branchId` query parameter. Its
response is unchanged. HQ selection narrows the church-scoped member queries;
branch-restricted viewers retain their own effective branch regardless of the
requested parameter. Omitting the parameter preserves existing behavior.

Deploy the API before the web application so selected membership branches are
honored. No database migration, permission seed change, or new dependency is
required. No deployment or live business-data writes were performed.

## Validation

- API: membership scope/aggregation, optional query validation, and existing cache
  isolation tests; production build and TypeScript checks.
- Web: member-query compatibility/cache separation and permission/plan unit tests;
  targeted ESLint, TypeScript checks, and production build.
- Mocked browser scenarios: HQ and branch filtering, date/currency independence,
  reversed-date rejection, missing grants/entitlements, retained shortcuts/profile
  and notification actions, partial failure/retry, populated and empty mobile
  layouts, and existing analytics-page access checks. The analytics access fixture
  now includes its required plan entitlement so those tests exercise permissions.
