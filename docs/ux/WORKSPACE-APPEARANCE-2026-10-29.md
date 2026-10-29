# Neutral workspace and personal appearance — 2026-10-29

## Behavior

Authenticated workspace surfaces, header, cards, tables, menus and dialogs now use white/light-gray or charcoal tokens. The sidebar follows the same mode. A server-rendered workspace marker scopes the root overrides (including portalled dialogs), so public/login pages retain their existing palette and workspace variables are removed on exit.

Account → Appearance is available from header and sidebar account menus without church-settings permission. Six presets and a validated six-digit hex picker provide live previews. Save persists the chosen accent, Cancel/Escape restores the session's saved value, and Reset to default previews teal until saved. Color-mode persistence is unchanged. The selected base color is preserved; foreground, focus, selection text and button-boundary colors are derived for readable contrast, including white/black custom accents. Semantic badges and colorful chart series remain independent.

Preferences use `churchos:appearance:v1:<profileId>:<churchId>` in localStorage with `{ "accent": "#rrggbb" }`. They are personal to that user/church/browser, never written to the API. Missing/malformed values use teal. Scope changes discard the previous scope before loading its replacement; matching storage events synchronize tabs. Failed storage writes keep the chosen accent for the session and explicitly report that it could not be persisted.

Member, family and service details now use compact identity headers and labelled vertical-ellipsis management menus. Member editing is included in Member management; family Edit and common contact actions stay visible. Existing mutation grants, confirmations and handlers remain; destructive menu items are separated. Confirmation cancellation and closing the member editor return focus to the menu trigger. Member/family delete dialogs add an optional focus-return ref with unchanged behavior for other callers. Other pages retain their existing administration controls.

## Verification

- 453 unit tests passed, including custom-color contrast, strict color parsing and scope-key isolation.
- 41 unique browser cases passed across the existing member/attendance/service suites and the focused appearance suite. Coverage includes Save/Cancel/reset/reload, both account entry points, dark-mode independence, public-page cleanup, account/church isolation, cross-tab updates, invalid/unavailable storage, keyboard menus, focus return, archived/read-only views, and existing edit/family/check-in/export workflows.
- Targeted lint, TypeScript, production build and whitespace checks passed.
- Follow-up: Edit Member is the first management item and all three triggers use vertical dots. Six targeted browser checks passed for saving, Escape/focus return across the member-cache refresh, restricted/archived views, saved colors and desktop/mobile previews; lint, TypeScript and the production build passed again.
- Reviewed mock-data desktop/mobile and light/dark previews at `/tmp/churchos-workspace-previews/` (all three detail pages, menus and Appearance dialog).

## Release

Web-only release through the existing Vercel Git integration. No database, API, permission-seed, subscription or church-data changes. Public marketing styling and other users' preferences remain unchanged. Browser storage can be cleared by the user/browser; this resets the personal accent to teal.
