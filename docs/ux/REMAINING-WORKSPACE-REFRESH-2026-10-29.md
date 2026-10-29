# Remaining workspace presentation — 29 October 2026

## Behavior

Communication, Appointments, Departments/Cell Groups, Assets, Pastoral Care, Forms, Reports, Analytics, Administration, Profile and Support opt into compact neutral presentation. Completed Members, Attendance, Giving, Events, Sermons, Media and Visitors pages retain their existing scoped presentation. Authenticated detail/form dialogs inherit compact spacing only while a remaining section is mounted. Public pages remain outside this scope.

Directories replace large statistics grids with matching-result counts. Removed the extra 100-row Template/Broadcast queries and the asset-statistics query. Role permission-catalog reads remain because the table uses their denominator. Folder, assignee, branch, category and role lookups remain where controls require them. Messages explicitly describes its existing 200-loaded-message limitation rather than claiming filtered results are complete church-wide totals.

Search and primary filters remain visible. Archive, secondary asset conditions/categories, user roles, sorting and reset are grouped in More filters with active-secondary counts. Existing filtering, pagination, scopes, selection, exports and handlers are preserved. Branch and cell-group detail management uses keyboard-accessible vertical-dot dropdowns. Their edit/delete/archive confirmations return focus to persistent management controls. Shared form sections and focus targets are opt-in; existing callers keep their defaults.

Pastoral Engagement and Analytics Overview use their existing complete aggregate engagement responses for colorful donuts, with visible counts, percentage tooltips, loading, empty and retry states. The pastoral summary is labelled independently of table search/filtering and remains visible if the records request fails. Risk and communication lists do not receive aggregate charts because their paginated responses cannot support complete distributions. Detailed Analytics and generated reports retain existing trend/breakdown data, with compact metrics and opt-in colorful bars. Percentage labels for these bars describe share of their displayed total; bar lengths compare to the largest value. Zero values render no filled bar.

Profile/user avatars use stable record-ID colors while retaining photos. Support changes apply only to the authenticated route. Existing-account billing uses neutral surfaces and the saved accent only when the subscription has a previously activated paid-until date; first-purchase/onboarding presentation and checkout/recovery logic remain unchanged.

## Boundaries

Web presentation only. No API contracts, database/schema, permission seeds, subscription entitlements, scoring rules, financial processing, live church records or outbound messages are changed. Advanced Analytics remains independently authorized. Debug routes are outside this refresh.

## Validation

Validation results and preview locations will be recorded after the final browser run. All browser writes are fixtures; they must never target live records.

## Release

Use the normal Git/Vercel integration after checks pass. Previous publication attempts were blocked because the connected GitHub account lacked push permission; verify current access before reporting a deployment.
