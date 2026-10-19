# Help, support and session navigation

## Floating administrator support

Active church administrators and super administrators see a floating **Chat with support** button across workspace screens, Plan & Billing and help articles. Clicking it loads the supplied tawk.to SDK and opens its floating chat over the current screen. Once connected, the provider's own minimized widget handles reopening. Account-menu, contextual help, help-hub, article and billing support actions use the same chat session, without navigating to a support page. The old `/support` URL redirects to `/dashboard` for bookmarks.

The SDK is still loaded only after an administrator clicks. Ordinary staff and anonymous visitors do not receive a chat launcher or load it. No ChurchOS token, church details or verified identity is sent to tawk.to. A blocked/failed load keeps the launcher available for retry and shows the direct-chat fallback. Navigation within the workspace preserves chat; sign-out, session expiry, profile/church changes, role removal and leaving the workspace close/disconnect it. Delayed SDK loads cannot reopen it after teardown.

## Help navigation and layout

`/docs` fills the dashboard content area and offers **Back to dashboard**, **ChurchOS home**, public Help Centre access and direct support for administrators. Signed-in users reading `/help` or any article retain the same sidebar, header and workspace background. These guides are public content: they do not require a paid feature or a special documentation grant.

Public readers get a wider help layout, visible home/workspace links and a topic rail; smaller screens use an expandable **Browse help topics** navigation. Topics expose adjacent guides while reading an article. Signed-in help has visible dashboard, workspace-help and landing-page return links. Search follows topic-link navigation and browser history. Public guide content, metadata and links remain server-rendered and readable without JavaScript.

## Authentication entry pages

`/login` and `/register` wait for backend session restoration. An already verified signed-in visitor is redirected with `replace` to `/dashboard`. A cookie alone never establishes authentication. Expired sessions keep sign-in accessible. Visitors who entered as guests stay in the existing login/registration flow: successful login retains permission-checked `returnTo`, subscription activation and MFA/recovery handling. Forgot/reset-password and subscription routes are not subject to the guest-only guard.

## Verification and rollout

Validation passed: production build, TypeScript, lint, 319 unit tests and 44 focused browser checks across help, support and onboarding. Browser coverage uses mocked session/profile responses and intercepts the widget script; it does not contact real support agents or process payments. Checks cover admin/staff visibility, lazy loading, failures, delayed loads after logout, navigation persistence, help return links, desktop/mobile widths, public no-JavaScript articles and authenticated/expired entry redirects. Deploy the web application to release; no migration or backend/provider change is required. A real provider chat remains a post-deployment acceptance check.
