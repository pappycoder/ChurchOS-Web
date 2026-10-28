# Members section UI upgrade

All six member/family pages and their supporting dialogs now use scoped Admina-inspired styling with ChurchOS's existing colors and components.

## Changes

- **Directories:** Compact statistics, neutral table cards, search-first filter toolbars and readable horizontally scrolling tables. Loading counters use skeletons; failed counters show an unavailable value. Directory read failures retain the filters and offer a targeted retry. Existing selection, exports, pagination, archive views, density and column controls remain available.
- **Member details:** Compact identity/action header; contact and membership information in the narrower desktop column; custom fields and notes in the wider column. Existing URL-backed tabs, giving permissions and retained note drafts remain in place.
- **Family details:** Matching identity/action header, wrapping household names and head badges, and a linked-member table that retains all household members and management actions.
- **Registration:** More compact photo controls, balanced desktop form sections and a sticky save/cancel bar. All existing fields, photo processing, family assignment, custom fields, validation and dirty-navigation handling are retained.
- **Dialogs:** Member/family forms and confirmations use neutral surfaces, clearer section headings and scrollable content with consistent headers/footers. Destructive styling remains distinct.
- **Member import:** Responsive four-stage progress indicator and matching card/table treatment. Parsing, mapping, templates, validation, dry runs, batching and source-row error handling are unchanged.

Family head/linked-member statistics still describe the loaded active-family sample, capped at the existing 100-family limit; their labels and explanatory copy preserve that distinction from the directory total.

## Compatibility

Presentation is scoped through `members-ui.module.css`. Shared cards, tables, pickers and global theme tokens were not restyled globally. `PeopleImportPage` accepts optional `className` and `progressClassName` props; visitor import retains the default appearance and progress markup. `ArchiveConfirmDialog` accepts an optional `className`; only member/family callers opt into the new styling.

No backend, HTTP API, schema, permission, dependency or route changes were made. The dashboard, shared shell and unrelated module pages remain unchanged. No deployment or live business-data writes were performed.

## Validation

Final validation results are recorded after the last production capture pass. Browser fixtures use mocked API responses and the existing support-widget mock; builds run in an isolated temporary copy to leave the development server available.

## Review captures

Light/dark screenshots for every page at 375px, 768px, 1024px and 1440px are local ignored artifacts in `test-results/members-ui-review/`.

| Page | Desktop | Mobile |
| --- | --- | --- |
| Members | [Preview](../../test-results/members-ui-review/members-1440-light.png) | [Preview](../../test-results/members-ui-review/members-375-light.png) |
| Add Member | [Preview](../../test-results/members-ui-review/registration-1440-light.png) | [Preview](../../test-results/members-ui-review/registration-375-light.png) |
| Member Details | [Preview](../../test-results/members-ui-review/member-detail-1440-light.png) | [Preview](../../test-results/members-ui-review/member-detail-375-light.png) |
| Import Members | [Preview](../../test-results/members-ui-review/import-1440-light.png) | [Preview](../../test-results/members-ui-review/import-375-light.png) |
| Families | [Preview](../../test-results/members-ui-review/families-1440-light.png) | [Preview](../../test-results/members-ui-review/families-375-light.png) |
| Family Details | [Preview](../../test-results/members-ui-review/family-detail-1440-light.png) | [Preview](../../test-results/members-ui-review/family-detail-375-light.png) |
