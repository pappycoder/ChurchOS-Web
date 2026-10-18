# Using integrations

Open **Integrations** directly from the administration sidebar (`/admin/integrations`) as a church admin or super admin. The same editor remains available under **Church Settings → Integrations**. The direct page requires `integrations:read`; saving/checking/testing requires `integrations:update`, with no additional church-settings permission needed for the direct page.

1. Add a named provider account using the provider-specific fields.
2. Click **Check credentials** and read the result. Limited inspection requires a controlled channel test; it is not proof of authentication or delivery.
3. In Email, WhatsApp, SMS, Live calls or Payments, choose the checked account and save its sender settings. Compatible services can share an account; email providers require their own credentials.
4. Email supports sender email, sender name and reply-to. SMS and WhatsApp have separate sender numbers/device IDs even when they share a provider account.
5. Send a controlled message/call test and confirm actual receipt. Tests incur normal provider charges. Payment checks do not charge a card; use test-mode checkout to test payment settlement.

**Live calls:** Staff with calling and member-read permissions use **Call member** on member details, then confirm **Call my phone**. Twilio calls the staff profile's saved phone first and connects the member using the church caller number. This is a live phone bridge, not browser calling or an automated spoken message. Calls are limited to ten minutes; hang up to end sooner.

Keys are encrypted on the backend, never returned by the API, cleared from the form after save attempts and never persisted as browser drafts. To rotate a key, add/check a replacement account, switch services, and archive the old account after pending payments settle. Integration settings are permission-gated and do not create additional provider-key requirements for staff reading operational pages.

Saving an account alone does not activate it. For each service, change **Account source** to **Choose provider account**, select the saved account and click **Save … settings**. Existing/platform mode continues the platform or legacy configuration. Disabled/custom modes do not silently fall back to platform keys. Payments keep the original merchant account reference for historical settlement.

If an administrator cannot see the tab or sidebar entry on an existing deployment, verify that both applications are deployed and the backend permission catalog was seeded with `npm run prisma:seed-perms`. Schema migrations alone do not populate the provider permissions. The current permission cache (`perms:v25`) can retain an older catalog for up to 15 minutes after an in-place seed; refresh the session after that cache expires. The API and persistent worker also need the configured integration encryption key. Do not paste keys into support messages.

Backend deployment, master keys, callback paths, provider restrictions and verification: [Provider integration guide](../../ChurchOS-Backend/docs/PROVIDER-INTEGRATIONS.md).

Production-browser tests: `npx playwright test test/browser/messaging-settings.e2e.ts` after a production build. Tests use API/provider fixtures and never place real calls, send messages or charge cards.

Rechecked on 2026-10-18: production build and scoped lint passed; 307 frontend unit tests, 87 backend integration/messaging/permission tests and nine production-browser workflows passed. Browser coverage includes both administrator roles reaching the direct sidebar page, direct reload without church-settings permissions, HQ staff denial without configuration requests, the legacy Settings tab, provider forms, independent/shared channel assignments, read-only controls and live-call confirmation. These checks use fixtures and do not certify deployed provider delivery or settlement.

Verified locally on 2026-10-16: production build, 312 frontend unit tests and 16 Chromium workflows passed (five integration/live-call workflows plus eleven existing read-only regressions). Backend validation passed 1,374 unit tests and 54 PostgreSQL/HTTP checks, with all 53 migrations applied to a disposable database. Provider calls used fixtures; actual delivery, phone conversations and test-mode payment settlement remain deployment acceptance steps.
