# Export placement — 2026-10-18

Export is a deliberate action on important business records, not a default feature of every table.

Retained: member/visitor/family registers; department member lists; individual/general/department/group attendance records; giving records and recurring schedules; group meeting giving; event registrations, attendance and issued ticket records; form submissions; message delivery logs; asset registers, loans and maintenance; visitor follow-up; dedicated reports; import error details needed for correction.

Removed: dashboards/analytics, service/event/department/group setup directories, users/branches/role setup, giving/asset categories, ticket-tier setup, media/folders, sermon libraries/speakers/series, message templates, inbox lists, calendars, documentation tables, redundant detail previews and member-selection rosters. These screens remain searchable/filterable where appropriate. General summary cards no longer add a redundant export beside record/report exports.

The shared Table defaults to exportable=false. Important record collections explicitly opt in or keep their existing dedicated ExportDropdown. Buttons read Export; format choices read Export as CSV, Export as Excel and Export as PDF. Download Template, receipts, tickets and the report generator's selected-format download remain purposeful document actions.

Permission guards, branch/HQ scope, filtered export-all queries, CSV escaping, file limits and collection isolation are unchanged. No backend or database change is needed. Deploy the frontend to activate this update.

Verified locally: production build and final TypeScript check passed; 297 frontend unit tests and 53 browser workflows passed; scoped lint, UI contract audit and diff whitespace checks passed. Browser coverage includes absent exports on setup directories/selection rosters, retained financial/attendance downloads, concise format labels, collection isolation and read-only access. No deployment or live-data changes were performed.
