<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Changelog

All notable changes to this project are documented below. Update this section with every change.

### [Unreleased]

- **2026-08-23** — Unified email model + header IA cleanup.
  - **Email is admin-managed in one place**: `/profile` shows Email read-only again ("Managed by your church admin in Settings") — schema/payload/hook types dropped it; `UpdateCurrentProfileInput` no longer has `email`. `/admin/settings` gains an **Email card** (Mail icon, Edit dialog, zod) calling new `useUpdateChurchEmail()` → `PATCH /church/email`, which updates sign-in credential + profile record + church contact together and invalidates both `["church"]` and `["current-profile"]` caches (header identity follows instantly). Church Information form no longer has its own Email input.
  - **Header dropdown** (desktop + mobile): "Account Settings" → back to **My Profile** (`/profile`); "Settings" → **Account Settings** (`/admin/settings`); removed the dead **"My Account"** item (no such route) and its unused icon import. Dropdown now: My Profile · Account Settings · Knowledge Base · Logout.
  - **Fix**: the read-only Email note on `/profile` renders as a plain muted `<p>` — `FormMessage` outside a `<FormField>` dereferences an undefined field context (`ui/form.tsx`) and would crash the edit form at runtime.
  - Backend suite 513 passing; frontend scoped eslint clean, build passes.

- **2026-08-23** — Church Settings page (`/admin/settings`) + Account Settings relabel.
  - **New hooks** `src/hooks/use-church.ts`: `useChurch()` / `useUpdateChurch()` (key `["church"]`, cache-set), `useChurchConfig()` / `useUpdateChurchConfig()` (key `["church-config"]`, merge-set on save), and `uploadChurchLogo()` (multipart POST `/media/upload/image`, folder `churches`).
  - **Page grammar** mirrors the SmartHR settings pages — breadcrumb "Settings", sectioned cards with bordered headers, right-aligned saves, read-only when the viewer isn't church_admin/super_admin (roles normalized from the auth profile):
    - **Branding**: logo preview (placeholder tile when unset) with Upload/Replace (image/* ≤5 MB) → optimized WebP URL saved via dirty-only-style PATCH.
    - **Church Information**: view ↔ edit toggle (Name*, Denomination, Email, Phone, Website, Address, City, State, Country) — RHF+zod inline form, generic per-field diff against defaults sends only changed keys.
    - **Preferences**: Timezone (Africa/Lagos default) + Currency (NGN default) selects persisted as config keys in one `PATCH /church/config { config }`; Save enabled only when dirty.
    - Header row shows member/branch count badges; skeleton loading + retry error state.
  - **This lights up every previously-dead settings link**: sidebar "Church Settings → General", header gear icon, dropdown/mobile "Settings" entries all point here now. Sibling children (Branches/Notifications/Webhooks/Custom Fields) remain 404 until built.
  - **Account Settings relabel**: header dropdown + mobile menu "My Profile" → "Account Settings" (href stays `/profile`), matching the chosen IA of one account page covering personal info, photo and security.
  - Scoped eslint clean (only pre-existing header warnings); build passes (`/admin/settings` registered).

- **2026-08-23** — My Profile follow-ups: editable email + full-width layout.
  - **Email is now editable** in Basic Information (backend `PATCH /profiles/me` accepts it and syncs Supabase Auth — see backend changelog): zod email validation, included in the dirty-field-only PATCH; the previous disabled "managed by your sign-in account" note removed. `UpdateCurrentProfileInput` gains `email?`.
  - **Width fix**: removed the `max-w-5xl` cap from the `/profile` container so the page fills the desktop content area like other dashboard pages.
  - Scoped eslint clean; build passes.

- **2026-08-22** — My Profile page (`/profile`) — view, edit, photo, password.
  - **New hooks** `src/hooks/use-profile.ts`: `useCurrentProfile()` (GET `/profiles/me`, key `["current-profile"]`), `useUpdateCurrentProfile()` (PATCH, cache-set on success), `useUploadAvatar()` (multipart POST `/profiles/me/photo`), `useChangePassword()` (PUT `/auth/password`). `src/lib/api.ts` now passes `FormData` bodies raw (browser sets the multipart boundary) instead of JSON-stringifying.
  - **Page** follows the SmartHR profile grammar — section cards with bordered headers and right-aligned Cancel/Save: identity card (avatar/initials, name, status + MFA badges, role labels incl. blue Custom via `resolveRoleLabel`, email/phone/branch/church/joined info rows); **Basic Information** card toggles read rows ↔ RHF+zod inline form editing First/Last/Phone only (email disabled — auth-managed), dirty-field-only PATCH; **Profile Photo** card with client-side validation (image MIME, ≤5 MB) + Replace/Upload button; **Security** card with MFA status row and a Change Password dialog (current/new ≥8/confirm match, SmartHR-style eye toggles).
  - **Wiring**: `/profile` added to `protectedPaths` in `middleware.ts` (the header's "My Profile" links existed but the route didn't); header dropdown + mobile menu now render real avatar/initials/name/email from `useCurrentProfile()` instead of hardcoded "AD" / "Admin User".
  - Deferred: email changes (Supabase-managed) and self-service MFA enable/disable flows (status display only). Scoped eslint clean; build passes.

- **2026-08-22** — GitHub Actions CI/CD (`.github/workflows/ci.yml`).
  - Runs on every push to any branch plus PRs to `main`; concurrency group cancels superseded runs on the same ref.
  - **Jobs**: `lint` (npm run lint) → parallel `typecheck` (`npx tsc --noEmit`) + `build` (next build, telemetry disabled); independent informational `audit` job (`npm audit --omit=dev`, continue-on-error). Mirrors the backend workflow conventions (Node 22, npm cache, actions v4).
  - **eslint.config.mjs**: added global `ignores` for `.next/**`, `out/**`, `node_modules/**`, and `next-env.d.ts` — ESLint was scanning compiled build output (183 false errors). Full-repo `npm run lint` is now clean (0 errors).

- **2026-08-22** — Fixed "Customized" stats card not counting custom roles.
  - The card only summed `isCustomized` (templates with church overrides); church-owned roles (`isChurchOwned`) were excluded. Now counts the union so newly added custom roles increment it immediately.

- **2026-08-22** — Role labels shown everywhere (fix: custom roles displayed as slugs).
  - **Root cause**: the friendly label ("Media Team") was never persisted — only the slugified `name` survived, and `getRoleLabel()`'s static dictionary only covers the 8 seeded roles. Backend now stores/returns `label` (see backend changelog).
  - **New hooks** in `use-roles.ts`: `useRoleLabelMap()` (roleName → display label from roles summary) + `resolveRoleLabel(name, map)`; `useAssignableRoles()` merges seeded `VALID_ROLES` with church-owned custom roles for pickers/filters; `RoleWithPermissions` and `RoleInfo` gain `label`.
  - **Surfaces updated**: roles overview table + matrix page header/breadcrumb/toasts prefer `role.label`; users list badges (`UserRoleCell`), detail sidebar badges, permission-matrix "Granted by" tooltips, current-roles chips; users page role filter dropdown now includes custom roles; invite/edit-role dialog selects include custom roles; CSV export resolves labels.
  - Scoped eslint clean (only pre-existing warnings); build passes.

- **2026-08-22** — Per-church custom roles (create + manage).
  - **Add Role flow**: "Add Role" button on `/admin/roles` opens `create-role-dialog.tsx` (RHF + zod: Label 3–50 chars required, Description ≤200 optional) posting to the new `POST /church/roles`. Live slug preview mirrors backend slugification ("Media Team" → `media_team`); reserved/duplicate names surface as 409 error toasts. On success: toast + navigate straight into the new role's matrix editor to configure permissions.
  - **Custom badge (blue)** for church-owned roles in the overview table and detail header (`isChurchOwned` from API), distinct from amber `Customized` (templates with overrides). Owned roles shadow same-named global templates.
  - **Matrix editor semantics per role type**: templates keep additive-only copy/warning toast; owned roles show "This role's own permissions" alert — ticks/unticks save as an absolute replace (revocations apply immediately). Reset button/dialog hidden for owned roles (nothing to reset).
  - **Hooks**: `useCreateRole()` added; `RoleWithPermissions.isChurchOwned?` typed.
  - Overview table wrapped in `overflow-x-auto px-4 pb-4` for horizontal-scroll padding parity with the users table. Lint clean; build passes.

- **2026-08-22** — Roles & Permissions admin pages (`/admin/roles`).
  - **Overview page**: stats cards (total roles, customized count, available permissions), role table sorted by `ROLE_ORDER` with permission counts ("x / 88"), description, and status badges — `Locked` (super_admin), amber `Customized` (church overrides exist), or `Default`. Row click navigates to the detail page. Wires up the previously-dead "Roles & Permissions" sidebar link.
  - **Matrix editor page** (`/admin/roles/[roleName]`): interactive resource × action checkbox grid (two-column alphabetical split, same visual grammar as the user-detail matrix) built from `useAllPermissions()`. Header card shows role label/description/badges and granted count; super_admin renders a read-only locked view with an explanatory alert.
  - **Additive-only semantics made explicit**: info alert explains ticks grant extra permissions for this church only and global defaults can't be revoked. On save, if unchecked permissions remain active (global defaults), a warning toast names the count and the selection re-syncs to the server's response. Empty selections are blocked (API requires ≥1 override id). Dirty-state floating save bar shows `+n / −n` with Discard.
  - **Guardrails mirrored from backend**: `PROTECTED_ADMIN_PERMISSIONS` cells are non-removable when editing church_admin (toast explains); Reset to Defaults button only enabled for customized roles and opens a confirm dialog explaining all church overrides are deleted; reset disabled while dirty (save/discard first).
  - **New hooks file** `src/hooks/use-roles.ts`: types (`Permission`, `RoleWithPermissions`), `useRolesSummary` (GET `/church/roles`), `useRolePermissions(roleName)`, `useAllPermissions` (GET `/church/roles/all`), `useSetRolePermissions` (PUT `/church/roles/:roleName/permissions`), `useResetRoleToDefaults` (POST `.../reset`), plus `getResourceLabel`/`sortRolesByOrder` helpers. Re-exports `getRoleLabel` from use-users for consistent naming.
  - New components: `components/roles/permission-matrix-editor.tsx`, `components/roles/reset-role-dialog.tsx`. Scoped eslint clean on new files; build passes.

- **2026-08-22** — Compact permission matrix on user detail page.
  - **Role & Permissions tab redesign**: the Effective Permissions card no longer renders ~90 outline badges under per-resource headings. It now shows a dense permission matrix — one thin row per resource, four fixed columns (`create`/`read`/`update`/`delete`, extras appended if ever added), `Check` icon when granted, dimmed `Minus` otherwise. Two side-by-side matrices split alphabetically in a `lg:grid-cols-2` grid (stacks on mobile); header row labels each column.
  - **grantedBy tooltips**: hovering a ✓ cell (app-wide `TooltipProvider` from `providers.tsx`) shows "Resource: action" plus "Granted by <roles>" via `getRoleLabels(perm.grantedBy)` — previously-unused API data.
  - **Summary line**: CardDescription reads "<n> permissions across <m> resources" (hidden for super_admin, which keeps its short-circuit text; empty state unchanged).
  - New local `PermissionMatrix` component + `PERMISSION_ACTIONS` constant in `user-detail-content.tsx`; data memo reshaped to `Map<resource, Map<action, EffectivePermission>>`. Lint clean, build passes.

- **2026-08-22** — Multi-role users + editable user detail page.
  - **`UserProfile.role` is now `string[]`** (all roles, highest rank first; `role[0]` = primary). Added `roles?` (name + description), `effectivePermissions?`, `lastSignInAt?`, and `member?` (linked member summary) to the detail payload. `getRoleLabels()` joins all roles for display.
  - **New hooks**: `useUser`, `useUpdateUser(profileId)` (PATCH `/profiles/:id` — names, email, phone, branch, status), `useUpdateUserRoles(profileId)` (PATCH `/profiles/:id/roles` — full role set, permissions accumulate across roles), and `useBranches()` for the branch selector.
  - **Users list**: `UserRoleCell` renders one badge per role; CSV export lists all role labels via `getRoleLabels`.
  - **Detail page (`/admin/users/[profileId]`)**: Account Info tab now has an Edit mode (first/last name, email, phone, branch select, status select) with dirty-field-only PATCH payloads; linked Member record card shown when present; Role & Permissions tab has a toggleable multi-role chip picker plus effective-permission groups by resource (super_admin short-circuits to "all permissions"); Security tab shows real last sign-in from Supabase admin API.
  - **Sidebar/dialog**: sidebar lists every role as a badge (super_admin in destructive red); edit-role dialog defaults to the primary (`role[0]`) role.
