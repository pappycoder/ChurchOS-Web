# Main dashboard charts

The `/dashboard` charts use existing module permissions rather than requiring
advanced Analytics. A Church Admin with member, attendance, and giving access can
see charts without the Network Analytics entitlement. Dedicated `/analytics`
pages, their endpoints, permission seeds, and plan definitions remain unchanged.

## Chart access and reporting

- `members:all:read`: membership-status donut, age histogram, cumulative
  joining-month growth, and current member count. These use current non-archived
  members within the same church/branch scope as the member list.
- `attendance:dashboard:read`: member-versus-visitor check-in bars and summary.
  `attendance:reports:read` independently enables the existing attendance trend.
  General attendance headcounts are not added to named check-in counts.
- `giving:dashboard:read` plus the existing giving entitlement: successful giving
  trends, category bars, and selected-period totals in one currency.
- Dates default to the last 30 calendar days, including today; the end date
  includes its entire UTC day. Clearing dates selects all time. Reset restores
  the date default, all permitted branches for HQ viewers, and NGN.
- Membership is independent of the date filter and explicitly labelled as current
  demographics/full joining history. Giving filters currency without conversion.
- HQ viewers with branch-read access may select a branch. Restricted viewers
  remain pinned to their effective branch; missing branch assignment does not
  grant church-wide access.
- Each query has its own loading, empty, and retry state. Errors are not shown as
  zero. Branch/date/currency selections use distinct cache entries. Member and
  giving chart keys share their existing module mutation invalidation prefixes.
- Detail links point to accessible module pages, or the corresponding Analytics
  page when the viewer has its existing permission and entitlement.

The existing task shortcuts, profile access, notification drawer/details,
mark-as-read behavior, account activity, and record workflows are retained.

## Additive APIs and deployment

- `GET /members/dashboard` requires `members:all:read`; accepts optional UUID
  `branchId`; returns `total`, `byStatus`, `byAgeGroup`, and cumulative `growth`.
  No individual member records are returned. Non-archived scope matches listing.
- `GET /giving/dashboard/charts` requires `giving:dashboard:read` and the giving
  entitlement; accepts optional `branchId`, ISO `startDate`/`endDate`, and uppercase
  three-letter `currency` (NGN by default). Returns `currency`, `total`, `count`,
  daily `trend`, and `byCategory`. Omitted date bounds are unbounded. Dates are
  inclusive; malformed/reversed dates are rejected. Only successful giving in
  that currency is included; donor/status selectors are rejected, and no donor
  records are returned.
- Attendance reuses the existing summary and trend endpoints and their grants.
  Existing API responses and advanced Analytics endpoints are unchanged.

Deploy the API additions before the web application. No database migration,
permission seed change, or dependency installation is required. This work does
not itself deploy changes or modify live subscriptions or business records.

## Validation

Targeted API tests cover aggregates, non-archived membership, tenant/branch
isolation, missing branch assignments, currency/date bounds, query validation,
route ordering, and existing member/giving behavior. Web tests cover module
permission gating, query keys, cancellation, and profile/range readiness.

Mocked production-browser scenarios reproduce a Church Admin without Analytics,
verify rendered pie/bar charts and module links, HQ/restricted filters, giving
entitlements, attendance report separation, retained shortcuts/profile and
notification actions, partial failures/retry, and populated/empty mobile layouts.
Existing Analytics access checks continue to verify their original restrictions.
