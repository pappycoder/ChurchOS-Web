# Tables and form responses

## Shared tables

Every record table uses the shared Table primitive. The first two visible record columns remain anchored during horizontal scrolling; selection checkboxes and action columns do not consume those positions. Identifying columns remain available while additional columns can be hidden or scrolled. Actual header widths are measured and remeasured after resizing, visibility changes or new rows, with matching body offsets and opaque backgrounds in both themes. Pinned cells use bounded widths on smaller screens so other columns remain reachable.

Desktop mouse users see row actions while hovering a row, focusing a control in the row, or leaving its menu open. Keyboard controls remain focusable. Touch devices and narrower layouts retain visible actions. Header controls, sorting and selection remain available.

Billing history now identifies payments by reference and plan before dates and amounts. Forms identify records by title and form reference. Existing collections keep their ordered identifying columns; no tenant permissions or action grants are added.

## Form detail and responses

Opening a form displays its actual description, status, audience, template flag, response count/capacity, required question count, timestamps, questions, field types/options and deduplication label. Share-link controls and management actions remain permission gated. The fill screen includes that form's title, description, question count and required count.

Both form detail and the submissions collection share a schema-driven response table. Each row starts with its submission reference and configured unique answer, name, email, or first question. Other answers, status, signed-in/public source, submission time and attachment count follow. Missing values remain explicit; arrays, zero and false remain distinguishable. Full references remain available in tooltips and keyboard-accessible response controls. Clicking a reference opens its response details; review remains limited to the existing permission and pending status.

Form changes replace answer columns and rows. Submissions stay paginated. Exports retain visible fields and the existing export scope. Readers without submission access do not request responses. Counts describe the opened form, not filtered-page totals or fabricated analytics.

## Verification

Validation passed: production build, TypeScript, scoped lint, 319 unit tests and 39 browser checks. One resize assertion was made tolerant of the asynchronous layout measurement and passed on focused rerun; the other 38 checks passed initially. Desktop and mobile screenshots were visually reviewed. Browser coverage exercises response identity and fields, form switching, protected response access, pinned header/body alignment while scrolling/resizing/hiding columns, desktop hover/focus, touch visibility and mobile overflow. Provider/backend data is mocked for browser checks; no live record is written.
