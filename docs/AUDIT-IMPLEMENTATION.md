# Frontend audit implementation

The login selector remains available for testing.

Browser authentication now uses HttpOnly cookies through `/api/backend/*`. Configure server-only `API_URL` and matching backend/web `INTERNAL_PROXY_SECRET`. The backend validates the actual session; middleware uses cookie presence only as a navigation hint. Login retains a safe `returnTo` destination. Requests use abort signals, refresh is deduplicated within and across supporting tabs, and account changes cancel/clear queries. Transient server errors preserve sessions. Private requests, page navigation and RSC responses are not service-worker cached.

Loading indicators use actual query/mutation activity; artificial upload progress and hover data prefetch are removed. Error states retry active failing queries in place. Shared forms warn about dirty drafts on tab closure and link navigation. Tables have accessible keyboard scrolling; the dashboard has skip navigation. Content images use stable dimensions, placeholders and an accessible failure state; public Supabase images can be optimized, while authenticated images bypass the shared image optimizer/cache. Ticket PDF code loads on demand.

Member imports accept CSV/XLSX, parse in a worker with size/expansion/row/cell/time limits, reject formulas and submit sequential batches of 100. Partial failures show previously created counts and warn that the last batch may need reconciliation. CSV exports escape spreadsheet formula prefixes. Heavy export behavior and column visibility are preserved.

Session replay is off unless `NEXT_PUBLIC_SENTRY_REPLAY=1`; text, input and media are masked. Raw request data/headers and URL queries are removed from telemetry. Debug Sentry pages/endpoints return 404 in production.

See the backend `docs/AUDIT-ROLLOUT.md` for migrations, permission reseeding, storage migration, persistent worker deployment, session sign-in requirements, remaining development-only dependency advisories and runtime validation limits. Keep both apps on the same rollout; no live migration/seed is performed by a frontend build.
