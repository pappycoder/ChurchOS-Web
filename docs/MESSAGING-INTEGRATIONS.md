> Superseded for new setup by [Provider integrations](PROVIDER-INTEGRATIONS.md). The legacy API and encrypted records remain supported.

# Messaging settings

**Settings → Messaging** lets authorized church administrators choose platform-owned, church-owned or disabled Resend/Termii accounts. The tab and status query require `messaging_integrations:read`; account changes and paid tests require `messaging_integrations:update`. Admin HQ alone does not grant access.

Credentials are write-only. Re-enter complete settings to rotate keys. The form clears secret fields after a save attempt and never persists drafts or stores keys in query mutation variables. Provider credentials belong in backend encrypted storage; do not add public frontend environment variables.

Test buttons send actual messages using the saved account. Provider charges may apply. Confirm delivery at the destination; API acceptance alone is not delivery proof. WhatsApp text tests require an open conversation window. Provider setup also requires approved senders, a registered WhatsApp device and a signed callback to the church-specific backend route shown in the form.

Backend migration, master-key setup, reference permission seeding, deployment and verification instructions: [backend integration guide](../../ChurchOS-Backend/docs/MESSAGING-INTEGRATIONS.md).

Production-browser regression coverage is in `test/browser/messaging-settings.e2e.ts` and uses local provider/API fixtures. After building, run `npx playwright test test/browser/messaging-settings.e2e.ts`.

Verified locally on 2026-10-16: production build and 312 frontend unit tests passed; all four production Chromium messaging workflows passed after fixing the account-selector form-reset ordering. Backend verification includes 1,355 unit tests, 26 real PostgreSQL/HTTP tests and a full local app startup/health/authentication smoke check. Provider delivery is fixture-based until a deployed administrator sends and confirms a controlled test message.
