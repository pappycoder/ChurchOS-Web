# ChurchOS Support: branding and tickets

## Implemented in the application

- **Help Centre** opens public documentation at `/help`, outside the dashboard.
- **Contact support** opens `/support` inside the dashboard. It explains contact options without opening chat. The public `/help/contact-support` page remains available to visitors; signed-in Help navigation points to `/support`.
- **Support ticket** opens `/support/ticket` inside the dashboard, including sidebar/header/navigation and a titled iframe of `https://churchos.tawk.help/`. Choose **Submit Ticket** inside the portal. This page omits the shared offline/billing banners and uses a 90svh portal with a 720px minimum height. This is the Tawk-hosted portal, not a copied form or independent ChurchOS ticket system.
- The ticket page always offers **Open ticket portal in new tab** and `tickets@churchos.p.tawk.email`. Cross-origin iframe failures cannot be reliably detected with an onload callback; the UI never reports that a portal loaded or a ticket was submitted. Attempts to read the live site's framing headers timed out during this change. The embedded provider form still requires deployment verification, including browser privacy settings and any Tawk frame restrictions; the explicit external fallback remains available.
- The native floating chat initializes automatically only for verified active `church_admin` or `super_admin` profiles, preserving scope/logout teardown and retry behavior. Ordinary staff have tickets and contact navigation without the chat bubble or live-chat actions. This is an application visibility rule; the public Tawk property is not an authenticated ChurchOS access boundary.
- Tawk owns ticket creation, storage, response threads and status. Users reply to ticket emails to continue the same thread. Your team selects ChurchOS in https://dashboard.tawk.to/, opens **Inbox → Tickets**, replies, assigns agents/departments, and sets **Open**, **Pending** or **Closed**.
- No platform credentials, user identifiers or church records are appended to the iframe URL. No in-app ticket-history/status mirror, provider API call, migration, outgoing support message or test ticket was introduced.

Official references: [hosted ticket form setup](https://help.tawk.to/article/customizing-the-submit-ticket-feature-in-your-knowledge-base), [replies and status](https://help.tawk.to/article/how-to-respond-to-a-ticket).

## Apply branding in the Tawk dashboard

Tawk's cross-origin widget owns its logo, colours and welcome text. These settings are saved in the Tawk property, not controlled by the embed snippet's JavaScript API. No connected Tawk administration integration was found, so these remote settings have **not** been applied. The downloadable [brand kit](support-branding/churchos-tawk-brand-kit.zip) contains existing official logos and the exact reference settings. It is a reference bundle, **not** an importable Tawk configuration.

1. Sign into the Tawk dashboard and select the ChurchOS property for widget `1k59fptu4` (property `6ad5c1c809d49434c8f515a2`).
2. Set the property name to **ChurchOS Support** and its Property Image to the official square logo. Use `churchos-favicon-white.png` on the dark teal header, or `churchos-emblem.png` if using a light header.
3. Open **Administration → Chat Widget → Widget Appearance → Advanced** and apply:

| Setting | Value |
| --- | --- |
| Header / bubble colour | `#173D3E` |
| Header text | `#FFFFFF` |
| Agent message background | `#F1F5E9` |
| Agent message text | `#183B40` |
| Visitor message background | `#173D3E` |
| Visitor message text | `#FFFFFF` |
| Placement | Bottom right; preview desktop and mobile |
| Shape | Native circular bubble |

4. Open **Widget Content → Edit Content**. Add the Logo card and configure Online, Away and Offline states:

| Field | Suggested ChurchOS text |
| --- | --- |
| Heading | ChurchOS Support |
| Online welcome | Welcome to ChurchOS Support. How can we help you today? |
| Away message | We may take a little longer to reply. Leave your question and email so we can follow up. |
| Offline message | We are currently offline. Leave your name, email and message, or create a support ticket. We will reply by email. |
| Ticket link | `https://churchos.tawk.help/` (choose Submit Ticket) |
| Help link | Your deployed app's `/help` URL |

5. Require **Name** and **Email** on the pre-chat/offline form if you want reliable email follow-up. Enable the built-in chat card/menu so users can end a session and start another. An agent can optionally send a Ticket Form shortcut inside a chat; configure that in **Administration → Settings → Shortcuts**.
6. Under **Administration → Ticketing**, confirm the forwarding address matches `tickets@churchos.p.tawk.email`. Enable your agents' mail notifications and check that replies reach the sender. If you later create a branded address such as `support@your-domain`, forward it to this Tawk address through your email provider.
7. Save and refresh the deployed app to check both screen sizes. Provider settings take effect without another app code change. Badge removal and branded sender/domain features belong to the optional paid Whitelabel add-on; the app leaves Tawk's attribution intact.

Official references: [appearance](https://help.tawk.to/article/changing-the-appearance-of-the-chat-widget), [logo and content cards](https://help.tawk.to/article/customizing-the-widget-header-and-body-cards), [Ticket Form shortcuts](https://help.tawk.to/article/how-to-set-up-a-shortcut-with-a-ticket-form), [optional add-ons](https://www.tawk.to/add-ons/).

## Validation and rollout

Validation passed: frontend production build, TypeScript, scoped lint, 319 unit tests and 40 support/help browser checks (39 passed initially; an outdated copy assertion was corrected and the remaining check passed on rerun). Browser fixtures intercept both the widget and hosted ticket destination; they verify separate navigation, iframe handoff, administrator-only chat, failure fallback, public access and mobile sizing without sending real messages. They do not certify provider delivery. After deployment, submit a real ticket, reply from Tawk Inbox, reply to that email, and confirm the same thread updates; set Pending and Closed in Tawk. Remote branding remains a dashboard configuration step. No database migration, backend endpoint or new secret is required.
