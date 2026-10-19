# Help, support and session navigation

## Floating administrator support

Active church administrators and super administrators see a floating **Chat with support** button across workspace screens, Plan & Billing and help articles. Clicking it loads the supplied tawk.to SDK and opens its floating chat over the current screen. Once connected, the provider's own minimized widget handles reopening. Account-menu, contextual help, article and billing support actions use the same chat session, without navigating to a support page. The old `/support` URL redirects to `/dashboard` for bookmarks.

The SDK is still loaded only after an administrator clicks. Ordinary staff and anonymous visitors do not receive a chat launcher or load it. No ChurchOS token, church details or verified identity is sent to tawk.to. A blocked/failed load keeps the launcher available for retry and shows the direct-chat fallback. Navigation within the workspace preserves chat; sign-out, session expiry, profile/church changes, role removal and leaving the workspace close/disconnect it. Delayed SDK loads cannot reopen it after teardown.

## Help navigation and layout

`/help` and all articles use the standalone Help Centre layout for everyone. Dashboard sidebar, account and contextual-help links navigate directly to `/help`; guides are not embedded in the dashboard. Verified signed-in readers see **Back to dashboard**, while public readers see **Back to home**. The footer follows the same session-aware destination. Search, topic navigation and small-screen expandable topics remain available. Content and metadata stay server-rendered and readable without JavaScript.

Legacy `/docs` bookmarks redirect to `/help` without mounting a dashboard help screen. Search parameters are preserved and recognized old section anchors go to the corresponding published article. The redundant dashboard help hub and dashboard frame's public-content bypass have been removed.

## Widget startup correction

Loading remains opt-in, so the SDK can use its normal `autoStart: true` connection. Opening anonymous chat no longer calls `logout`, which is intended for a logged-in tawk.to identity and can interfere with a new connection. The first open waits for `onLoad` before showing/maximizing. If the loaded SDK was shut down, reopening calls `start` and waits for its render/status callback; offline status is valid because administrators can use the leave-a-message form. Teardown still invalidates pending opens, hides/ends chat and shuts down the connection. See the [tawk.to JavaScript API](https://developer.tawk.to/jsapi/).

Regression fixtures model asynchronous startup and ignore premature maximize calls. They assert a visible chat panel on the original URL, reconnection after leaving/returning, and no opening after session teardown. This replaces the old synchronous mock, which could pass even if startup had not completed.

## Authentication entry pages

`/login` and `/register` wait for backend session restoration. An already verified signed-in visitor is redirected with `replace` to `/dashboard`. A cookie alone never establishes authentication. Expired sessions keep sign-in accessible. Visitors who entered as guests stay in the existing login/registration flow: successful login retains permission-checked `returnTo`, subscription activation and MFA/recovery handling. Forgot/reset-password and subscription routes are not subject to the guest-only guard.

## Verification and rollout

Validation passed: production build, TypeScript, lint, 319 unit tests and 47 focused browser checks. Browser coverage uses mocked session/profile responses and intercepts the widget script; it does not contact real support agents or process payments. Checks cover admin/staff visibility, lazy loading, failures, delayed loads after logout, navigation persistence, help return links, desktop/mobile widths, public no-JavaScript articles and authenticated/expired entry redirects. Deploy the web application to release; no migration or backend/provider change is required. A real provider chat remains a post-deployment acceptance check.

A read-only check of the supplied public widget URL returned HTTP 200. Direct live-widget rendering from the local browser could not be verified: its embed request failed with `net::ERR_FAILED`, including through the environment proxy. No support message was sent. Provider rendering on the deployed origin remains to be checked.
