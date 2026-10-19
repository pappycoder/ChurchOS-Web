# ChurchOS Support: branding and tickets

## Implemented in the application

- Every active signed-in user gets the native Tawk floating chat on workspace, billing and help pages, independent of role or subscription feature grants. Inactive profiles and anonymous visitors do not load authenticated chat.
- `/help/contact-support` is the standalone, ChurchOS-branded contact page. Header, footer, sidebar, account menu, contextual help, articles and billing link to it or its ticket form. The legacy `/support` URL redirects there. Help keeps its own layout and session-aware dashboard/home return link.
- **Create support ticket** in the sidebar, account menu, contextual help, billing and contact page opens the owner-provided https://churchos.tawk.help/ in the same tab. Choose **Submit Ticket** there. The hosted page was read without submitting a message; its ticket form is enabled. Tawk currently opens this form through its navigation action, rather than exposing a direct form link. The application does not invent a URL parameter or embed the external page.
- The old local email-draft form has been removed. Email to `tickets@churchos.p.tawk.email` remains a secondary option. Live chat is labelled separately in account/help menus and still uses the native floating widget.
- Requesters submit name, email, subject and description directly to Tawk. No app identity, tokens or church records are appended to the link. Replies arrive by email; replying to the ticket email continues the same thread. New issues should use separate tickets.
- **Support team workflow:** sign into https://dashboard.tawk.to/, select ChurchOS, then **Inbox → Tickets**. Open a ticket to reply; use the assignee control for an agent/department and status dropdown for **Open**, **Pending** or **Closed**. Tawk owns ticket storage, threading, notifications and status. Ordinary ChurchOS church administrators do not receive access to this global agent inbox through their ChurchOS role.
- There is no in-app ticket history or status mirror. A synchronized portal would require separate, approved Tawk REST API access and supported endpoint documentation. No parallel ChurchOS ticket database was created.

Official references: [hosted ticket form setup](https://help.tawk.to/article/customizing-the-submit-ticket-feature-in-your-knowledge-base), [replying, assignment and status](https://help.tawk.to/article/how-to-respond-to-a-ticket). No outgoing email, chat message or ticket was sent during implementation.

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

Validation passed: frontend production build, TypeScript, scoped lint, 319 unit tests and 38 support/help browser checks. Browser fixtures intercept both the widget and hosted ticket destination; they verify separate navigation, public access and mobile sizing without sending real messages. They do not certify provider delivery. After deployment, submit a real ticket, reply from Tawk Inbox, reply to that email, and confirm the same thread updates; set Pending and Closed in Tawk. Remote branding remains a dashboard configuration step. No database migration, backend endpoint or new secret is required.
