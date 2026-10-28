# Admina-inspired dashboard layout

ChurchOS-Web now adapts the local Admina `index.html` twin-sidebar layout using existing React components and ChurchOS's teal/lime theme. No Admina runtime, Bootstrap stylesheet, demo content or new dependency is imported.

## Behavior

- At 1200px and above, navigation uses a 72px section rail and a 248px menu panel. The header toggle collapses the panel; selecting a rail section opens it without changing the URL.
- Below 1200px, the same navigation appears in a viewport-capped Radix drawer with a close button, Escape/backdrop dismissal, focus restoration and closing after navigation.
- Existing permission/subscription filtering supplies both navigation and command search. Empty sections disappear. Direct links and route changes select the section containing the longest matching accessible link; unmatched routes retain the current accessible section, defaulting to General.
- The shared header keeps navigation search, assistant, help, inbox, notifications, theme selection and account actions. Content padding is 16px on mobile and 24px from the medium breakpoint.
- The personal dashboard retains its existing queries and actions, with a compact welcome card, icon shortcuts and separate activity/notification cards. Role badges, account details, notification dialogs and loading/error/empty states remain available.

## Boundaries

Changes apply to the workspace shell and personal dashboard. Module content, public/auth pages, theme tokens, routes, API contracts and backend code are unchanged. Offline entry points remain hidden. `SidebarProvider` accepts an optional `mobileBreakpoint`; its default remains 768px, and the workspace supplies 1200px.

## Verification

The focused browser suite is `test/browser/admina-dashboard.e2e.ts`. It covers rail selection, collapse/reopen, direct routes/history, unmatched-route selection, responsive drawers, permissions, subscriptions, search, notification actions and loading/error/empty states. It also captures light/dark screenshots at 375px, 768px, 1024px and 1440px.

Passed:

- 275 permission/navigation unit checks and the UI source-contract check (276 total).
- Full ESLint scan, targeted lint after final edits, TypeScript and the production build.
- 11 new mocked browser scenarios and four existing responsive loan/maintenance regressions (15 total), including the 1199px/1200px navigation boundary.

The production build and browser checks ran in an isolated temporary copy because a development server was using the working tree's `.next` directory. The development server was left running. Browser API responses were mocked; no deployment or live business-data writes were performed.

Review screenshots are local, ignored test artifacts in `test-results/admina-dashboard-review/`:

- [Desktop light](../../test-results/admina-dashboard-review/dashboard-1440-light.png) · [Desktop dark](../../test-results/admina-dashboard-review/dashboard-1440-dark.png)
- [Mobile light](../../test-results/admina-dashboard-review/dashboard-375-light.png) · [Mobile dark](../../test-results/admina-dashboard-review/dashboard-375-dark.png)
- [Mobile navigation](../../test-results/admina-dashboard-review/navigation-375.png)

The same folder includes tablet screenshots at 768px and 1024px.
