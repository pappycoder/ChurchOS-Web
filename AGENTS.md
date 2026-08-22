<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Changelog

All notable changes to this project are documented below. Update this section with every change.

### [Unreleased]

- **2026-08-22** — Multi-role users + editable user detail page.
  - **`UserProfile.role` is now `string[]`** (all roles, highest rank first; `role[0]` = primary). Added `roles?` (name + description), `effectivePermissions?`, `lastSignInAt?`, and `member?` (linked member summary) to the detail payload. `getRoleLabels()` joins all roles for display.
  - **New hooks**: `useUser`, `useUpdateUser(profileId)` (PATCH `/profiles/:id` — names, email, phone, branch, status), `useUpdateUserRoles(profileId)` (PATCH `/profiles/:id/roles` — full role set, permissions accumulate across roles), and `useBranches()` for the branch selector.
  - **Users list**: `UserRoleCell` renders one badge per role; CSV export lists all role labels via `getRoleLabels`.
  - **Detail page (`/admin/users/[profileId]`)**: Account Info tab now has an Edit mode (first/last name, email, phone, branch select, status select) with dirty-field-only PATCH payloads; linked Member record card shown when present; Role & Permissions tab has a toggleable multi-role chip picker plus effective-permission groups by resource (super_admin short-circuits to "all permissions"); Security tab shows real last sign-in from Supabase admin API.
  - **Sidebar/dialog**: sidebar lists every role as a badge (super_admin in destructive red); edit-role dialog defaults to the primary (`role[0]`) role.
