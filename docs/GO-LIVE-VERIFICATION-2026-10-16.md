# Go-live re-verification — 16 October 2026

Latest public check: **2026-10-16T12:45:46.579Z**. Targeted browser checks completed: **2026-10-16T12:49:31.116Z**.

**The migration blocker is resolved. Production go-live remains pending seeded-account retirement and operational health/worker verification.** These are fresh checks against the deployed site, not results copied from the previous attempt. No production migration, deployment, account cleanup or business-record mutation was performed.

## Verified results

| Check | Latest result |
|---|---|
| Repository migrations | **51/51 applied**, no missing or unfinished migrations |
| Migration checksums | All match repository SQL |
| Legacy submission trigger | **Physically absent**, not merely disabled |
| Database target | Fresh deployed login session approval matched the checked database |
| Permission catalog / ten global role templates | Match code; no missing grants or template drift |
| Branch assignments | Zero active non-HQ profiles without a branch |
| Public development login helper | **Absent** from the deployed login page |
| Loaded public client scripts | **14 checked**; seeded password and privileged email absent |
| Unauthenticated current-profile API | HTTP **401** |
| Privileged seeded password login | **Still succeeds — cleanup pending** |
| Demo auth account metadata | **21 accounts; 21 not banned** |
| API health | Direct backend and web-proxy health both exceeded 35 seconds; operational status unverified |

The earlier missing migration and public-helper findings have been rechecked and cleared. Hiding the helper does not retire the previously exposed credentials: a real seeded super-admin login still succeeds. The database contains no church role overrides or custom roles, so this pass verifies the ten default templates rather than arbitrary custom-role configurations.

## Direct backend follow-up

The user supplied `https://church-os-backend-gamma.vercel.app/`. At **2026-10-16T13:04:02.004Z**, independent read-only checks returned:

| Request | Result |
|---|---|
| Direct backend `/api/v1/profiles/me` without authentication | HTTP 401 in 5.7 seconds |
| Direct backend `/api/v1/health` | No response within 35 seconds |
| Web `/api/backend/health` proxy | No response within 35 seconds |

The health timeout occurs on the backend directly as well as through the proxy. This does not identify the failing dependency or prove the entire API is unavailable. The health handler awaits database, Redis and BullMQ probes; deployment logs are needed to distinguish them.

The supplied backend is also hosted on Vercel. In this repository, `workersEnabled()` defaults queue processors off when the `VERCEL` environment flag is present. A separate persistent worker entry point (`npm run start:worker`) exists. Neither the public frontend URL nor the backend API URL establishes that this worker is running. A persistent worker service/process and actual queue execution remain unverified; this audit did not inspect or change production environment variables.

## Current deployed workflow checks

Fresh super-admin, HQ-secretary and branch-secretary sessions were tested against Forms, Families and readable service details. Results: **8 passed, 1 missing-record case, 0 page/action failures, 0 observed API errors, 0 sidebar mismatches and 0 observed branch-scope failures**. The earlier Families HTTP 400 and secretary service-giving HTTP 403 were not reproduced.

| Account | Page | Result |
|---|---|---|
| HQ · Super Admin | `/forms` | passed |
| HQ · Super Admin | `/members/families` | passed |
| HQ · Super Admin | `/attendance/services/[serviceId]` | passed |
| HQ · Secretary | `/forms` | passed |
| HQ · Secretary | `/members/families` | passed |
| HQ · Secretary | `/attendance/services/[serviceId]` | passed |
| Lekki · Secretary | `/forms` | passed |
| Lekki · Secretary | `/members/families` | passed |
| Lekki · Secretary | `/attendance/services/[serviceId]` | unverified-no-readable-record |

The branch-secretary service-detail case needs a controlled readable service fixture. It is not counted as passed. Browser business writes were blocked; approval/create/update/delete were not exercised against real church records. Sessions were logged out and contexts closed.

The source UI inventory was rerun: **85 pages, 78 dashboard pages, 445 link references, 70 navigation leaves and 715 controls**, with zero automated issues. The earlier broader role matrix and local regressions remain documented in [ROLE-ACCEPTANCE-2026-10-16.md](ROLE-ACCEPTANCE-2026-10-16.md). Local unit/integration suites were not repeated in this verification-only pass because runtime source was unchanged.

## Remaining go-live requirements

1. **Retire the seeded authentication accounts and revoke their sessions** as part of the user's planned test cleanup. Previously exposed privileged passwords still work. Clear test records separately while preserving legitimate accounts and church data. No account was deleted or disabled by this audit.
2. **Verify API health and the persistent worker.** `/api/backend/health` timed out again despite successful authenticated page reads and database checks. The endpoint includes Redis and BullMQ checks; a timeout does not prove which dependency is unhealthy. The source awaits queue probes without a deadline, so unavailable queue connections can leave it waiting. Investigate deployment logs and Redis/BullMQ connectivity, confirm the worker host and verify queued/scheduled processing. The user supplied the backend API URL; a persistent worker deployment/process remains unconfirmed.
3. Complete an authorized form-approval smoke test and the missing branch-service fixture case in staging or a controlled release workflow. Trigger removal and prior isolated PostgreSQL tests support the fix; no live approval mutation was performed here.

This verification does not certify backup restoration, private-storage delivery/pruning, outbound-provider delivery or load capacity. The checked database has no `media`/`media-private` storage-bucket rows, and storage provisioning was not exercised. Prior deployment requirements remain in backend `docs/AUDIT-ROLLOUT.md`. A migration-complete database alone cannot certify those operational dependencies.
