# UI access audit — 16 October 2026

Follow-up deployed acceptance evidence and additional required fixes are in [ROLE-ACCEPTANCE-2026-10-16.md](ROLE-ACCEPTANCE-2026-10-16.md). The no-migration statement below applies only to this initial UI audit; the follow-up found a form-submission trigger requiring a migration.

## Coverage and result

The final source audit inventories **85 pages (78 dashboard pages), 445 concrete/template link references, 70 navigation leaves, and 715 controls**. Controls include native buttons, Button components, menu actions, tab triggers and self-closing variants. There are zero issues in the automated link, page coverage, navigation agreement and archive-gate checks.

This is a source inventory, not 715 end-to-end action tests. Local cancel/filter/pagination controls and dialog confirmations are included. Mutation entry points were reviewed against API capabilities; representative workflows have browser regressions. Runtime data, arbitrary callback state and every deployed role combination are distinct verification targets.

Reproduce with `npm run audit:ui`. Use `npm run audit:ui -- --inventory` to print the full page/link/control inventory. The audit initializes no application services and accesses no credentials, network or database.

## Confirmed fixes

- Removed six non-existent `/admin` breadcrumb destinations. The modern sidebar calendar shortcut now opens the guarded `/events` page; the activity shortcut opens the existing notifications UI.
- Unknown dashboard routes fail closed. Shared dashboard/profile/documentation pages are explicit and do not authorize unknown descendants. Internal cross-links and breadcrumbs check destination grants. Login returns only to a known, authorized application route; external, backslash and unauthorized destinations fall back to Dashboard.
- Granular form readers can open/fill published forms without coarse form-management grants. Submission-only readers can enter the submissions page without form-list permissions. Form response submission is an intentional respondent workflow and is distinct from editing the form definition.
- Corrected Giving record creation, member detail actions, event check-in, ticket-type management and visitor creation inside ticket assignment. Ticket editors do not need event-create permission.
- Archive/restore controls use update grants independently of permanent-delete grants across branches, attendance services, assets/categories, events, forms, members/families, appointments, pastoral notes/life events, sermons, templates, departments and cell groups.
- User administration retains `users:read` and additionally requires the `profiles:read` API grant. A profile lookup grant alone does not expose administration. Invitations use `profiles:create`; account edit/status/reset/sign-out use `profiles:update`; role assignment uses `roles:update`. Read-only administrators cannot open account editing. HQ changes retain both `profiles:update` and `church_settings:update` and cannot target oneself.
- Inbox readers do not auto-mark messages read or receive restore/unread controls without `emails:update`. Reading does not require that grant.
- Department and cell-group mutations require the API action grant, retaining existing own-record restrictions. An own-scope marker alone does not expose actions requiring broader action grants.
- The shared `Can` component checks the full granular code instead of splitting off the action incorrectly.
- Raw upload handlers enforce permissions for the upload purpose. General uploads require `media:upload:create`; branding requires its settings/branch grant. Asset/sermon editors and authorized form respondents can upload into dedicated folders without general library publishing grants. Branding folders cannot bypass settings grants. Self-service profile photos retain their separate endpoint. Frontend/backend upload policy parity has a regression test.

## Automated checks

- Every concrete/template internal destination resolves to a page.
- Every dashboard page resolves to an entry rule.
- All 70 nav leaves agree with route guards for **every combination of relevant grants**, including absent grants, individual read grants, OR alternatives and required companion grants.
- Archive entry controls require update checks; delete controls remain independently guarded.
- Canonical catalog audit: ten role templates, 383 permission definitions, zero unknown source references.
- Unit regressions cover compound navigation, granular shared controls, destination links, fail-closed routes/login return destinations and upload purpose permissions.

Seven runtime destinations were traced separately: authorized submission attachment URLs; header/sidebar destinations from audited nav declarations; empty-state links through `PermissionLink`; permission-aware breadcrumbs; and validated login return destinations. Static checks cannot certify database-stored attachment URLs or arbitrary future runtime values.

## Database verification

The initial sandboxed attempt could not connect. Automatic approval review timed out on the first network-enabled retry; the permitted retry then completed successfully in a **read-only transaction**:

- No missing catalog permissions.
- All ten stored global role templates match the code.
- Zero church role overrides and zero custom roles in the configured database.
- Zero active non-HQ profiles without a branch assignment.

This verifies the configured database at audit time; it does not identify it as production or prove every assigned user's deployed workflow. No database writes, role edits, reseeding or deployment occurred.

## Validation and rollout

- Backend: **1,283 tests across 68 suites passed**; production build and scoped lint passed.
- Frontend: **310 tests across ten suites passed**; production build (including type/lint checks) passed, and changed files passed scoped lint.
- **All eight browser regressions passed** against the production frontend with mocked API responses: branch/HQ aggregate-only Giving, asset read-only details, granular form filling, submission-only access, ticket editing without event creation, read-only user administration and asset archiving without permanent-delete permission.

Deploy web and backend together for matching upload behavior. No permission seed or schema migration is required. Authentication/ownership/service checks remain appropriate for self-service endpoints, notifications, file retrieval, payments, sync and some supporting reads; this report does not claim every API uses a single permission decorator.

## Dashboard page requirements

| Page | Entry requirement |
|---|---|
| /admin/branches | branches:directory:read |
| /admin/branches/[branchId] | branches:directory:read |
| /admin/roles | roles:read |
| /admin/roles/[roleName] | roles:read |
| /admin/settings | church_settings:update |
| /admin/users | users:read; AND profiles:read |
| /admin/users/[profileId] | users:read; AND profiles:read |
| /analytics | analytics:dashboard:read |
| /analytics/attendance | analytics:attendance:read |
| /analytics/giving | analytics:giving:read |
| /analytics/members | analytics:members:read |
| /appointments | appointments:read |
| /assets | assets:list:read |
| /assets/categories | assets:categories:read |
| /assets/loans | assets:loans:read |
| /assets/maintenance | assets:maintenance:read |
| /attendance | attendance:dashboard:read |
| /attendance/check-in | attendance:checkin:create |
| /attendance/records | attendance:records:read |
| /attendance/reports | attendance:reports:read |
| /attendance/services | attendance:services:read |
| /attendance/services/[serviceId] | attendance:services:read |
| /communication/broadcasts | broadcasts:read |
| /communication/broadcasts/new | broadcasts:read |
| /communication/inbox | emails:read |
| /communication/messages | whatsapp:read |
| /communication/templates | templates:read |
| /dashboard | Active authenticated profile |
| /debug/sentry | diagnostics:read |
| /departments | departments:read |
| /departments/cell-groups | cell_groups:read |
| /departments/cell-groups/[groupId] | cell_groups:read |
| /docs | Active authenticated profile |
| /events | events:calendar:read |
| /events/[eventId] | events:all:read |
| /events/[eventId]/edit | events:update |
| /events/[eventId]/tiers | events:tickets:read |
| /events/check-in | events:checkin:create |
| /events/list | events:all:read |
| /events/management | events:tickets:read |
| /events/new | events:create |
| /events/registrations | events:registrations:read |
| /forms | forms:list:read |
| /forms/[formId] | forms:list:read |
| /forms/[formId]/edit | forms:list:update |
| /forms/[formId]/fill | forms:list:read |
| /forms/new | forms:list:create |
| /forms/submissions | forms:submissions:read |
| /giving | giving:dashboard:read |
| /giving/categories | giving:categories:read |
| /giving/records | giving:records:read |
| /giving/recurring | giving:recurring:read |
| /giving/reports | giving:reports:read |
| /media | media:library:read |
| /media/folders | media:folders:read |
| /media/upload | media:upload:create |
| /members | members:all:read |
| /members/[memberId] | members:all:read |
| /members/families | families:read |
| /members/families/[familyId] | families:read |
| /members/import | members:import:create |
| /members/new | members:new:create |
| /pastoral | pastoral:notes:read |
| /pastoral/engagement | pastoral:engagement:read |
| /pastoral/life-events | pastoral:life-events:read |
| /pastoral/risk-scores | pastoral:risk-scores:read |
| /profile | Active authenticated profile |
| /reports | reports:view OR reports:financial:read OR reports:attendance:read OR reports:members:read |
| /sermons | sermons:list:read |
| /sermons/[sermonId] | sermons:list:read |
| /sermons/[sermonId]/edit | sermons:update |
| /sermons/new | sermons:new:create |
| /sermons/series | sermons:series:read |
| /sermons/speakers | sermons:speakers:read |
| /visitors | visitors:list:read |
| /visitors/[visitorId] | visitors:list:read |
| /visitors/follow-up | visitors:list:read |
| /visitors/new | visitors:new:create |
