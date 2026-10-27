# CI and dependency repair — 27 October 2026

The web build/type-check failure came from a browser test importing an API seed from a sibling repository. That worked in the shared local workspace and failed in a web-only checkout. The test now imports a checked-in JSON fixture generated from the API seed, with its source hash. Normal web installation, tests, type checking and builds have no dependency on that checkout. The generated Secretary fixture matches the real API seed's 140 grants; regeneration and consistency-check commands are documented in [the fixture README](../test/fixtures/README.md).

## Dependency updates

- Web: Next.js and its ESLint configuration 15.5.28, DOMPurify 3.4.17, fast-uri 3.1.9, Zod 4.6.7 and Vitest 4.1.12. Serwist's nested Zod dependencies resolve to the patched root version.
- API: Zod 4.6.7, fast-uri 3.1.9, multer 2.5.0, body-parser 2.4.0 and qs 6.17.0. Updated both npm and pnpm dependency resolutions and security overrides.
- The Zod migration updates removed `required_error` options and preserves the asset/maintenance forms' numeric input types and coercion. Browser checks verify numeric JSON mutation payloads. No forced NestJS or Next.js major upgrade and no audit exclusions were used.

Primary references: [Next.js security patch](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), [DOMPurify patch](https://github.com/cure53/DOMPurify/security/advisories/GHSA-cg2g-xh64-v4q7), [fast-uri patch](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), and [Zod migration guide](https://zod.dev/v4/changelog).

## Backend test failures

- Three update DTOs were missing early rejection of the retired member login role. Added that rejection without imposing a built-in-only whitelist; custom role names remain supported and have regression coverage. Invitation DTO tests now assert their actual exclusion constraint.
- An empty/retired role set returns no permissions before querying subscription or permission stores. The role-name reservation test now supplies the subscription context required by role creation.
- The JWT boundary test verifies rejection and absence of an authenticated request user while the existing independent revocation/session reads run concurrently. The production guard was not weakened.
- Authorization coverage explicitly documents one-time invitation-token acceptance and the direct-upload service's folder grants, branch/plan scope and signed completion-ticket checks.
- Asset controller coverage includes both new worklist read endpoints and their independent grants: 28 routes, including 12 reads.

## Validation

- Full npm audits, including development dependencies: **zero vulnerabilities in both repositories**. Production-only audits are also clean.
- Frontend: **440 unit tests across 29 files**, TypeScript and lint passed.
- Backend: **all 2,084 tests across 110 suites** and production build passed. Its lint command passed with four existing explicit-any warnings in the billing service tests; unrelated formatter changes were not retained.
- Created a web-only copy without the API repository or local environment files. Clean `npm ci`, `tsc --noEmit --incremental false` and production build passed using the final lockfile.
- **Six browser scenarios passed against that standalone production build:** Secretary broadcast/message/event operations and plan boundaries, plus numeric asset/maintenance submission payloads. API/provider responses were mocked.
- [Machine-readable verification](ci-security-2026-10-27/verification.json).

No database migration, live church write, real message delivery or deployment was performed. GitHub Actions itself has not been rerun remotely. Missing optional Sentry upload credentials and a cold build cache remain informational build messages.
