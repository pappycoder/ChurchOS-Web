# Dashboard UI fixes — 27 October 2026

This implements the dashboard audit in [the baseline report](DASHBOARD-UI-UX-AUDIT-2026-10-27.md). The original audit evidence is retained as a before-change record. Scope is the 81 audited dashboard routes plus three new asset routes; public, authentication, onboarding and mobile UI are excluded.

## Changes

| Area | Result |
| --- | --- |
| Shared tables | One Table options disclosure retains density, column visibility and bulk width/visibility controls. Export and selected-row operations remain available. Fixed-size collections no longer offer a non-working page-size selector. |
| Recovery | Failed list, summary, picker, trend and related-history reads have persistent recovery states. Unavailable records are no longer automatically described as deleted/missing. Failed metrics use unavailable values rather than successful zeroes. Report setup remains editable when data fails. |
| Responsive layout | Asset and registration controls wrap within the main content area at tablet widths. Shared headers and table toolbars allow wrapping. Contact rows and long record names remain readable on phones. |
| Record workspaces | Member, visitor, department, cell-group, service and form records separate substantial related tasks. Attendance records/reports distinguish named check-ins from reported headcounts. Record context stays visible; permission checks remain independent. |
| Form builder | Focused question outline, real keyboard reorder buttons, associated labels, inline errors, advanced answer identifiers and a question preview. Existing answer keys survive relabelling/reordering. Settings changes correctly mark the form dirty. |
| Drafts and navigation | Explicit route exits use the shared discard check. Imports, media queues, form answers, member notes, role edits and provider settings join existing form protection. Related editing panels remain mounted. Dirty event/form/church editors resist background resets. Completed media queues no longer trigger an unfinished-work warning. |
| URL context | Related task views support direct links and Back/Forward. Media folder and sermon speaker/series filters stay synchronised. Registration event choice, submission form/review status and inbox folder/message are shareable; unrelated query parameters are retained. |
| Consequential actions | Permanent inbox deletion, share-link replacement and provider-account archiving require confirmation. Archive confirmation names dependent services. Broadcast composition includes an audience/channel/timing review. |
| Settings and ownership | Profile is the personal-security destination; Integrations is the provider destination. Existing settings tab links redirect to the corresponding destination. Accounts and service routing have separate retained views. Church settings keep per-section saves. |
| Permission editing | API responses identify inherited template defaults. The matrix locks them before interaction, keeps church-added grants editable, supports resource search and guards dirty exits. Church-owned role semantics, protected grants and branch/HQ scope are preserved. |
| Reporting | Giving export is report-wide. Duplicate category charts were removed. Attendance Analytics exposes supported date/branch controls. Giving Analytics requests one currency for transactions and recurring amounts, without conversion. Service giving separates currencies too. |
| Coverage honesty | Family and broadcast sample metrics state their loaded coverage; calendar coverage states the event/service limits. Attendance service breakdowns state their loaded window. Visitor follow-up has server paging and labels its page-local search. No sample is relabelled as a complete aggregate. |
| Reading and semantics | Record h1s, semantic card headings, named/selected archive controls, permission-aware task links and explicit full-note/factor reading actions. Member, visitor, family, group and branch administration is grouped in a keyboard-operable disclosure with stable mutation triggers. |
| Discovery | Directory filter groups have reset actions and active criteria where applicable. Appointments expose supported dates and clearer staff/attendee labels. Department membership uses a focused picker dialog. Calendar day selection updates context, with creation on its explicit action. |
| Assets | Full register/create/edit/detail routes plus real paginated loans and maintenance worklists. Borrower, due/return dates, overdue state, job/provider/scheduled/completed details and status filters replace equipment-only lists. Existing create/update/return dialogs and independent grants remain in use. |

## API changes and release requirement

Deploy the web and API together. No database migration is required.

- `GET /assets/worklists/loans` and `GET /assets/worklists/maintenance` accept bounded pagination, asset search and status filters. Both rows and counts are scoped by the parent asset's church and request branch scope. Their existing independent read grants apply. Archived-equipment history remains identifiable; mutations keep their existing contracts.
- Role permission reads add `defaultPermissionIds`. This describes the existing additive template model; it does not change permission resolution or revocation rules.
- Giving analytics accepts an optional three-letter currency filter. Every transaction aggregate, breakdown, trend and recurring amount uses that filter when supplied. Existing callers that omit it keep their prior contract. The dashboard supplies an explicit currency.
- Assistant route knowledge includes the asset routes. No provider action, real message, live data write, migration or deployment is part of this work.

## Validation

- Web and API production builds passed; frontend TypeScript, source lint, targeted API lint, assistant catalogue consistency and both diff checks passed.
- **440 frontend unit tests** across 29 files and **102 targeted API tests** across three suites passed.
- **66 distinct browser scenarios** passed across the dashboard/table/event/read-only suite, group financial/attendance scenarios, member draft retention and permission reset. The inherited-permission check was also rerun after the final reset correction.
- **84 dashboard routes × 3 viewports = 252 recovery observations:** no document overflow, runtime exceptions, render-boundary failures or attempted domain writes. The final role-reset correction received a targeted browser recheck after this sweep.
- **10 selected populated viewport observations** across six workflows had no document overflow or captured runtime/boundary errors. These are examples, not a populated review of every route.
- The static route/link/navigation audit checked 84 dashboard routes, 502 links and 874 controls and reported no issues.

Evidence: [check summary](dashboard-fixes-2026-10-27/checks.json), [recovery observations](dashboard-fixes-2026-10-27/recovery-results.json), [populated observations](dashboard-fixes-2026-10-27/populated-results.json), and [source hashes](dashboard-fixes-2026-10-27/source-manifest.json).

Selected visual checks: [loan worklist at tablet width](dashboard-fixes-2026-10-27/screenshots/asset-loans-tablet.png), [asset editor on a phone](dashboard-fixes-2026-10-27/screenshots/asset-editor-phone.png), [form editor](dashboard-fixes-2026-10-27/screenshots/form-editor-desktop.png), [permission editor](dashboard-fixes-2026-10-27/screenshots/role-editor-desktop.png), [appointment recovery at tablet width](dashboard-fixes-2026-10-27/screenshots/appointments-recovery-tablet.png), [registration recovery](dashboard-fixes-2026-10-27/screenshots/registrations-recovery-tablet.png), and [asset register recovery](dashboard-fixes-2026-10-27/screenshots/asset-register-recovery-tablet.png).
 The fixtures may display a subscription-renewal notice because they do not use live billing state. Browser checks use deterministic mocked data; the recovery sweep deliberately fails domain reads. This does not establish live-provider acceptance, assistive-technology certification, or exhaustive populated-state coverage for every role and record size.

The deliberate sample coverage notices are retained product limitations, not assertions of complete server aggregation. Member demographics also explain their actual contract: current permitted membership with service-provided growth, rather than unsupported historical demographics controls.
