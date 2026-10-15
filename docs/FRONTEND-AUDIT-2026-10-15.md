# Frontend permissions and performance audit — 15 October 2026

The frontend already used effective API permissions for its sidebar, route gate and most actions. It was not fully consistent, and optimal production performance had not been established. This audit corrected specific authorization and request/rendering issues; it does not certify every screen or production workload.

## Corrected behavior

- Dynamic URLs containing actual event, sermon and form IDs now match their action-specific permission rules. Previously literal `[eventId]`-style patterns fell through to broader read rules. Event detail pages explicitly require the staff event browsing grant, consistent with their previous intended restriction. Rules compile and sort once rather than on every match.
- Sidebar and horizontal navigation now follow child grants without unrelated parent-menu requirements. Horizontal navigation retains its filtered children, drops empty groups, and checks individual grants. Member-facing presentation no longer overrides broader navigation grants. Event pages, sermon controls and restricted media use their own surface/action permissions rather than a general member flag.
- Users who hold both own-scope and broader administrative grants are no longer restricted by the mere presence of an own-scope permission. The frontend follows the backend's existing broader-delete-grant precedence for these ownership restrictions. HQ remains an explicit scope flag, not an action grant.
- Role summaries, individual role grants and the permission catalog are queried only with `roles:read`. Basic dashboard/profile label consumers use their existing fallback labels instead of sending unauthorized administration requests. Event registration and attendance queries independently require their respective read grants.
- Permission checks fail closed while the profile loads, after a failed verification fetch, and for inactive accounts, including when React Query retains old data. Failed verification has a visible retry state. The profile query refreshes stale authorization state on focus/reconnect while ordinary data queries retain their existing conservative defaults.
- When the verified account, church, branch, linked member, HQ flag or permission set changes, the dashboard masks its body, cancels old requests and resets workspace queries before displaying the new scope. The verified profile is preserved; display-only profile changes do not reset the workspace. Server guards remain authoritative for every request.
- Immutable permission arrays share a weakly cached lookup Set across consumers. Closed department drawers defer detail fetching. Department lists use the normal 60-second stale window and existing mutation invalidation instead of refetching on every mount. Heavy PDF and spreadsheet code already uses dynamic imports; no change was necessary there.
- Documentation remains accessible to signed-in users, with content adjusted to their permission-derived presentation. Role names remain in labels, sorting and protected built-in role displays; those are separate from operational permission checks.

## Verification

The complete frontend unit suite passes: 7 files, 287 tests. New behavioral coverage includes actual dynamic IDs, every dashboard page's permission rule or explicit account/help exception, filtered navigation children, broader grants combined with own access, failed/disabled profile checks, permission-gated queries, focus/reconnect configuration, shared indexes, scope-key changes, cache clearing and aborting old requests.

Also run: TypeScript validation, scoped ESLint, production Next.js build, and diff whitespace checks. All checks passed, including the final production build. No changes were deployed.

## Performance and remaining limits

The observed request and allocation overhead was reduced. No before/after latency benchmark, browser interaction trace, Lighthouse/Core Web Vitals measurement, low-end-device test or representative production load test was performed. The existing build reports a substantial shared client bundle, so further bundle reduction should be guided by an analyzer and browser traces rather than by claims of peak performance.

This is a frontend UX and cache-isolation audit. UI hiding cannot secure the API; JWT/session, effective permission, tenant, branch and ownership checks continue to run on the backend. Authorization changes become visible when the profile refreshes; this change does not introduce server-pushed permission updates. The backend permission-cache invalidation limitation described in its authorization audit also remains.
