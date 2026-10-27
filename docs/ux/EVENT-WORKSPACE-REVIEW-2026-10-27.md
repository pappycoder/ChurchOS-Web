# Event workspace UI/UX review — 27 October 2026

## Scope and architecture

This is a focused first implementation in a large application (85 dashboard route files). Reviewed the workspace shell, shared table and header components, event list/detail/registration/ticketing flows, create/edit forms, and representative assets, giving, pastoral and service screens. This is not a claim that every route received an exhaustive interaction audit.

- Installed Next.js 15.5.27, React 19.2.8, App Router under `src/app`; dashboard layout remains a Server Component wrapping the existing client workspace frame. No Pages Router was found.
- Existing Tailwind 4 tokens (`theme.css`, `globals.css`, `modern-ui.css`), shadcn-style components backed by Radix, and Lucide/Tabler icons. No dependencies or palette changes.
- Sidebar navigation comes from the existing permission-aware menu system; route gates, permission links and shared breadcrumbs control access. Detail/edit links retain their existing destinations.
- React Query hooks fetch through the same-origin backend proxy. Mutation hooks invalidate event caches. Profile-derived, plan-filtered permissions fail closed; API enforcement remains authoritative. Session middleware and authentication are unchanged.
- Forms use React Hook Form with Zod. Tables retain the shared Table/TableCard export and pagination system. Dialogs use the existing Radix components.
- Major workflows include members/visitors, departments/groups, attendance, events/registrations/tickets, giving, communications, forms, media and administration. Event registration and attendance are separate business operations.
- Read `AGENTS.md` before editing. Its requested `node_modules/next/dist/docs` directory is absent in this installed Next 15 package; consulted the official navigation guide at https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating. The shared URL tabs use native history integrated with `useSearchParams`, under a Suspense boundary.

## Audit and decisions

| Page / route | Main usability problem | Proposed structure | Reason | Priority / delivery |
| --- | --- | --- | --- | --- |
| `/events/[eventId]` | Registration roster, general attendance and named attendance stack into one long screen; destructive actions compete with routine work | Persistent event context and summaries; Registrations / Attendance tabs; event-actions menu | Registration reserves places; attendance records presence; both describe one event | High — implemented |
| `/events/new`, `/events/[eventId]/edit` | Description separated from identity, dates mixed into basic details, four boxed groups | Three visible fieldsets: Event details; Schedule and location; Registration and pricing | Matches event planning order and keeps all validation discoverable | High — implemented |
| `/events/management` | Ticket Types and Assigned Tickets are already sensibly separated, but cannot be linked or restored via URL | Keep related tabs; persist `tab=types` or `tab=assigned` | Preserve existing page boundary and support direct access | Medium — implemented |
| `/assets` | Dense filter row and multiple icon actions | Labelled filter area and secondary row menu | Clarify filter scope and record actions | Medium — follow-up |
| `/attendance/services/[serviceId]` | Operational attendance and finance share a long detail view | Attendance and financial review as distinct views | Independent grants and tasks | Medium — follow-up |

## Event detail structure

The page title is now the semantic h1 with permission-aware breadcrumbs. Event type, timing/status, location, branch and description remain outside the tabs. Counts remain visible for cross-task context in a semantic definition list: two columns on phones/tablets, four on desktop, without four oversized summary cards. Missing permission or failed requests display a dash instead of an apparent zero; the corresponding table displays an explicit error and retry control.

Registrations is the default for staff who can read or create registrations. Its registration action sits beside the roster heading and explanatory text. Create-only staff retain registration access without exposing a roster they cannot read. Existing registration pagination and export controls remain. Attendance contains the existing aggregate General Attendance panel and a separate Named Check-Ins table with its own pagination/export. The check-in shortcut belongs to Attendance and retains its `eventId` destination. An attendance-only viewer lands on Attendance. Unavailable tab values fall back to an allowed view.

Edit, tier management, archive/restore and delete/permanent delete are grouped under Event actions, retaining their original permission and archived-state conditions. Deletion uses the existing accessible confirmation dialog instead of an unmanaged fixed overlay. Shared delete and archive confirmations now accept an optional return-focus reference; the event workspace returns keyboard focus to Event actions after dismissal, since the originating menu item is removed when the menu closes. Other callers retain the existing default behavior.

No new routes are needed: these are related views of one event, while the existing full registration and check-in routes already support independent operational work. This avoids duplicating workflows and permission mappings. Tabs preserve unrelated query parameters, hashes and browser history. Event panels stay mounted when hidden so table page state and attendance filter state survive tab switches. No form fields are hidden in steps or disclosure controls.

## Forms and contracts

Both event forms retain the existing schemas, defaults, branch assignment, conditional pricing, mutation functions, payload construction, success destinations and server-error toasts. Description now has an associated visible label. The Free Event label is associated with its switch through FormControl. Long text fields use a single-column reading order; branch/type and start/end use responsive pairs. Native fieldsets/legends provide semantic categories without another layer of cards. Existing branch permissions and Community paid-event restrictions are unchanged.

Confirmed behavior: registration and check-in use separate hooks/endpoints and independent grants; aggregate totals are explicitly reported separately from named check-ins. Design judgment: those tasks deserve related tabs, and identity/schedule/pricing are clearer as three visible form sections. No business rule was inferred or changed.

## Verification

- Production build passed against the final source; full build-time lint and type validation passed. Targeted ESLint, standalone TypeScript and `git diff --check` also passed.
- All 438 unit tests passed (29 test files).
- Across the targeted runs, 60 distinct browser scenarios passed: 23 content/branch cases, seven event-registration cases, 14 plan-boundary cases, four Secretary cases and 12 new event-workspace cases. The final 12-case workspace run passed with browser runtime/hydration error capture. After the final tablet-only summary breakpoint adjustment, all three responsive cases passed again against the final production build.
- Checked direct tab URLs, unrelated query preservation, reload, Back/Forward, registration pagination across tabs, check-in navigation, permission-limited/default views, registration error/retry UI, archived controls, visible form validation, conditional pricing, create/edit payloads and optional-field clearing. Compared both original schema and submission blocks against HEAD: unchanged.
- Checked keyboard tab activation, dialog focus containment, Escape dismissal and return focus for both Delete and Archive at 390, 768 and 1440 pixels. Confirmed no page-level horizontal overflow at these widths. Visually reviewed phone, tablet and desktop screenshots of the workspace and forms; tables retain horizontal scrolling.
- Updated the existing Community check-in test to select Attendance. Corrected the existing service clock-time fixture to supply the branch already required by HQ service creation; service application code was not changed.

Browser fixtures intercept backend/session traffic; they do not write live church records. Screenshots are generated under `test-results/event-workspace-{width}.png` and `test-results/event-form-{width}.png`. This is Chromium-based local verification, not an exhaustive assistive-technology audit or live API/provider acceptance. No deployment was performed. Assets and service-detail restructuring remain follow-up work in the audit table.
