# Members visual refresh

The Members section now uses neutral surfaces, teal primary actions, blue/violet
avatar accents and labelled semantic status badges. Changes cover member and
family directories/details, full member creation, quick add/edit dialogs, family
creation/edit/linking, and the presentation of member importing.

## Presentation and behavior

- Directory result counts come from the current list response and sit beside the
  title. Removed member total/active statistic requests and family total/sampled
  statistic requests; no sampled family metrics remain.
- Search, member status and branch remain visible. More filters contains archived
  view, existing member sorting/direction and reset. The trigger counts changed
  advanced options, and archived tables have explicit archived titles.
- Existing pagination, selection, bulk controls, exports and table options remain.
  On phones, wider member tables scroll horizontally with readable identifier
  columns rather than pinning narrow columns and wrapping emails letter by letter.
  Soft avatar colors derive from immutable IDs and remain stable across lists,
  profiles and family links; uploaded photos still take precedence.
- Active is green, inactive gray, transferred blue, suspended red, with text and
  dots. Archived profile labels use a separate amber archive badge.
- Profiles retain their original tabs, detail data and mutation handlers. Edit is
  directly visible for authorized non-archived records. More options contains
  existing administration actions and confirmations; contact/call actions remain.
- Existing form fields and submit handlers are unchanged. Fieldsets and section
  headings organize identity/contact, membership/location and additional data.
  Family dialogs keep the head/member relationship guidance and existing rules.
- Member import uses a compact, accessible upload/map/review/complete indicator.
  The visitor importer retains its original header, progress and appearance;
  parsing, mapping, validation, batches and payload contracts are unchanged.

## Implementation boundaries

Presentation lives in Members-scoped components and a CSS module, including
portal dialogs. PageHeader adds optional title metadata and RecordActions an
optional label; their existing defaults remain unchanged for other pages. No
API, schema, subscription or authorization changes are made.

## Validation and release

Browser checks exercise directory filtering/sorting, archive view, result counts,
search, selection, pagination/export, quick-add validation/creation, profile edit,
confirmation dialogs, family forms/linking, restricted readers, mobile and dark
mode. Existing member/visitor import and unsaved-note regressions cover shared
flows. TypeScript, targeted lint and the web production build validate the change.

Validation completed: 253 route/permission unit checks, 16 Members/import browser
scenarios plus the existing unsaved-note browser regression, targeted ESLint,
TypeScript and the production web build passed. Desktop, mobile and dark-mode
previews were reviewed with fixture data.

This is a web-only release through the normal deployment process. No live
business writes or deployment are performed by this implementation task.
