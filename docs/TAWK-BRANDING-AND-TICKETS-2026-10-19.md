# ChurchOS Support: branding and tickets

## Implemented in the application

- Every active signed-in user gets the native Tawk floating chat on workspace, billing and help pages, independent of role or subscription feature grants. Inactive profiles and anonymous visitors do not load authenticated chat.
- `/help/contact-support` is the standalone, ChurchOS-branded contact page. Header, footer, sidebar, account menu, contextual help, articles and billing link to it or its ticket form. The legacy `/support` URL redirects there. Help keeps its own layout and session-aware dashboard/home return link.
- Ticket email destination: `tickets@churchos.p.tawk.email` (provided by the owner). Users enter a topic, subject and description, review a draft, then open their email app or copy the email details into webmail. They must send the email to create the Tawk ticket. The app never claims a draft was submitted, invents a ticket number or shows a fabricated ticket history.
- New issues use separate emails. Replies to an existing Tawk ticket email continue that thread. Screenshots can be attached in the user's email app. The native chat menu can end the current chat session before starting another session; previous history can remain visible.
- Only user-entered ticket fields are included in drafts. No automatic profile, church/member records, tokens, query strings or diagnostic URLs are attached. Drafts are kept in component memory, reset on account change/sign-out and are not stored in browser storage. Chat remains anonymously identified by Tawk browser storage, without verified ChurchOS account identity.

Tawk documents that messages sent to a property's Ticket Forwarding Email become tickets, with replies managed in its Inbox: [ticketing setup](https://help.tawk.to/article/how-to-set-up-ticketing-in-tawkto). This integration uses that email route; it does not require or invent a public ticket-creation API. No outgoing test email or support chat message was sent during implementation.

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
| Ticket link | Your deployed app's `/help/contact-support#ticket` URL |
| Help link | Your deployed app's `/help` URL |

5. Require **Name** and **Email** on the pre-chat/offline form if you want reliable email follow-up. Enable the built-in chat card/menu so users can end a session and start another. An agent can optionally send a Ticket Form shortcut inside a chat; configure that in **Administration → Settings → Shortcuts**.
6. Under **Administration → Ticketing**, confirm the forwarding address matches `tickets@churchos.p.tawk.email`. Enable your agents' mail notifications and check that replies reach the sender. If you later create a branded address such as `support@your-domain`, forward it to this Tawk address through your email provider.
7. Save and refresh the deployed app to check both screen sizes. Provider settings take effect without another app code change. Badge removal and branded sender/domain features belong to the optional paid Whitelabel add-on; the app leaves Tawk's attribution intact.

Official references: [appearance](https://help.tawk.to/article/changing-the-appearance-of-the-chat-widget), [logo and content cards](https://help.tawk.to/article/customizing-the-widget-header-and-body-cards), [Ticket Form shortcuts](https://help.tawk.to/article/how-to-set-up-a-shortcut-with-a-ticket-form), [optional add-ons](https://www.tawk.to/add-ons/).

## Validation and rollout

Validation passed: production build, TypeScript, lint, 327 unit tests and 55 browser checks. Tests intercept the SDK and inspect ticket mailto/copy content; they do not send real messages or prove inbox delivery. Confirm one real end-to-end email and chat on the deployed origin after saving the provider settings. No new database table, migration, backend endpoint, email provider credential or paid service is needed for the email-draft workflow. An in-app submit/status/history portal or verified account-linked chat would require additional provider integration; they are not simulated here.
