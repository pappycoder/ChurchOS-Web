# Compact main dashboard

The main `/dashboard` is a compact, colorful chart grid. It removes the dashboard
filter panel, standalone figure/KPI cards, large identity card, notifications
feed, and recent activity feed. A slim greeting, profile link, task shortcuts,
and Notifications button remain. Notification selection, details, and mark-as-read
continue through the existing drawer/dialog flow.

## Presentation

- Six chart cards fill three columns on wide desktops, two on smaller screens,
  and one on phones. Plots are 176 px high with compact headers and detail links.
- Dashboard-specific SVG plots use blue, violet, pink, teal, amber, and orange,
  with lightly tinted cards, gradient area fills, colorful bars, and a donut.
  Dedicated analytics/report charts and the rest of the app's theme are unchanged.
- Counts and monetary values remain available in chart tooltips. There are no
  separate summary tiles or repeated totals inside the donut.
- Plots render without entrance animation, including a visible point for a
  one-period trend. Each card has a compact loading, empty, and retry state.
- There are no dashboard date, branch, currency, reset, or refresh controls.
  Attendance/giving use the last 30 calendar days, including the full final UTC
  day. Giving remains NGN without conversion. Membership cards identify current
  demographics and full joining history separately.
- HQ users see their permitted church-wide scope; other viewers remain locked
  to their effective branch. Detail links open existing module pages for further
  investigation, or Analytics pages when the viewer already has access.

## Existing access rules

- `members:all:read` enables membership composition, growth, and age distribution,
  through the existing `GET /members/dashboard` aggregate API. Non-archived member
  scope is unchanged; no individual records are returned.
- `attendance:reports:read` enables the attendance trend. Viewers with only
  `attendance:dashboard:read` see member-versus-visitor bars instead. The dashboard
  fetches only the attendance view it displays; named check-ins and general
  headcounts are not added together.
- `giving:dashboard:read` plus the existing giving entitlement enables successful
  giving trends and category bars through `GET /giving/dashboard/charts`.
- Basic charts do not require advanced Analytics. Dedicated Analytics routes,
  plan rules, module permissions, and API response contracts remain unchanged.
- Member/giving query keys retain the existing module invalidation prefixes.
  Removed profile/role/event/activity widgets do not trigger their old reads.

## Validation and deployment

Production-browser checks cover the absence of excess controls/tiles, colorful
SVG rendering and compact desktop sizing, automatic HQ/branch scope, permissions,
giving entitlements, attendance summary/report separation, existing shortcuts,
profile/notification actions, retry, empty/populated mobile layouts and dark mode.
Targeted permission/query unit tests, TypeScript, lint, and the web production
build validate the implementation.

This revision is web-only. It needs a web deployment to appear on the live site;
it does not perform that deployment. No API, database, subscription, permission
seed, or business-record changes are required.
