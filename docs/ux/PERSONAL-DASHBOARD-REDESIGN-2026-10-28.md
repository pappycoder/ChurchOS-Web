# Personal dashboard redesign

The `/dashboard` page now uses a compact greeting, neutral quick-action cards and notification/activity panels inspired by Admina. ChurchOS's existing teal/lime tokens, personal data and permitted actions remain in use.

## Page behavior

- One greeting replaces the separate page title, home breadcrumb and oversized welcome card. Church/branch context and role badges remain visible; account identity, email, access scope and the profile link are available through the keyboard-accessible Account details control.
- Quick actions keep their existing destinations and permission/subscription filtering. They use one column below 360px, two from 360px and three from 1024px.
- Notifications appear first, using the wider desktop column, with type icons, unread markers, category labels and timestamps. Personal activity uses a narrower timeline with action icons. Both retain eight-entry previews and stack on smaller screens.
- Skeletons match the panels; empty panels explain what will appear there. Each failed panel retries only its own query.
- Closing the notification drawer returns focus to the dashboard's View more button. The shared drawer accepts an optional `onCloseAutoFocus` callback for this purpose; other callers keep their existing behavior.

No backend, HTTP API, dependency, global theme, shared header/sidebar or other module-page changes are included. Existing profile, role, audit and notification hooks are reused. No deployment or live business-data writes are part of this change.

## Validation

The dashboard browser fixtures now include populated activity, mixed read/unread notifications, long titles/names, empty/error states and delayed reads. Tests cover account details, read updates, drawer access/focus, independent recovery, preview limits and responsive ordering, alongside the existing permission, subscription, navigation and header checks.

Passed:

- 276 permission/navigation/UI contract unit checks.
- Full ESLint scan, TypeScript and the final production build.
- All 16 mocked browser scenarios in `test/browser/admina-dashboard.e2e.ts`.

Production checks ran in an isolated temporary copy with the changed source/test files verified against the working tree. The existing development server was left running. No live church data was used for browser fixtures. The four responsive captures were refreshed with the existing support-widget mock so external network failures cannot obscure the page.

Review screenshots are local ignored test artifacts:

- [Desktop light](../../test-results/personal-dashboard-review/dashboard-1440-light.png) · [Desktop dark](../../test-results/personal-dashboard-review/dashboard-1440-dark.png)
- [Mobile light](../../test-results/personal-dashboard-review/dashboard-375-light.png) · [Mobile dark](../../test-results/personal-dashboard-review/dashboard-375-dark.png)

The same folder includes light/dark tablet captures at 768px and 1024px.

## Compact notification columns

Notification category and timestamp now occupy a separate column at the end of each row. Titles and two-line body previews stay together in the main column. The profile/greeting layout remains as originally redesigned.

Targeted lint and six existing responsive/notification/account browser checks passed against the local development preview. Four responsive captures were refreshed after fixing the preview's conflicting display class. No data or query changes.

Updated previews: [Desktop](../../test-results/notification-columns-review/dashboard-1440-light.png) · [Mobile](../../test-results/notification-columns-review/dashboard-375-light.png).
