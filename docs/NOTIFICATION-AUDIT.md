# Notification consistency audit

The UI uses one Sonner provider, the shared `@/lib/toast` API and the application toast styling. No alternative toast library, `toast.custom`, or browser `alert` notification path was found in application components.

The audit found 72 additional notification handlers discarding plain-object API failures because they only read messages from `Error` instances. They now use `getToastErrorMessage`, retaining each action's existing title and fallback. This covers appointments, visitors, giving, email, events, attendance, forms, media, members, sermons and exports. Form submissions and media uploads now also report action failures through the shared toast while retaining their persistent error details.

Seven empty, non-search selectors in giving, recurring giving and ticket assignment/type management now use the shared `AvailableSelect` guard: clicking an unavailable choice reports its reason through the general toast instead of opening an empty popup. Giving and ticket-type selectors disable opening while their queries load. The existing ticket-claim guard remains in place.

Searchable contact pickers retain their contextual search results and custom-entry actions. Field-level validation, persistent data-loading/retry states, and confirmation dialogs continue serving their existing purposes. Notification placement and styling use the single application viewport, including the desktop/mobile positioning fix.

Verification includes the shared message contract, real browser failures in giving and visitor dialogs, unavailable service/event/recurring-category choices on desktop/mobile, ticket availability regressions, the permission/link audit and production compilation. Browser APIs use isolated fixtures; no live business writes are required.

## Verification results — 2026-10-17

- Production build (including lint/type validation): passed.
- Unit tests: 296 passed.
- Permission/link audit: 86 pages, no issues.
- Existing browser regressions: all 40 passed.
- New modal-feedback cases: all 6 passed after correcting the visitor fixture's read permission and selecting the staff ticket-assignment tab in the test.

Changes are local; no deployment or live business mutations were performed.
