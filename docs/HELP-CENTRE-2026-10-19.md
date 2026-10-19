# Public and in-workspace Help Centre

Navigation follow-up: [floating chat and workspace help](HELP-AND-SUPPORT-NAVIGATION-2026-10-19.md) replaces the dedicated support screen and keeps signed-in article readers inside the dashboard frame.

## Delivered scope

- `/help` is the public searchable Help Centre, with seven topic filters and 20
  task-based articles at `/help/[slug]`. Articles are rendered at build time,
  readable without JavaScript, and have canonical metadata, contents navigation,
  related guides and a last-reviewed date. The sitemap includes all published
  guides; unknown articles return 404.
- Search runs locally over a compact index sent by the server. It searches titles,
  summaries, keywords and article text. Search/topic choices have shareable URLs,
  matching counts, clear/reset controls and a useful empty state.
- `/docs` is the authenticated staff Help Centre. It reuses the same library,
  suggests guides based on permissions and administrator roles, starts with six
  popular guides, and links to the
  public site. Recognised old section anchors route to the closest current guide.
  Uncovered modules route to the general help guide rather than inventing steps.
- The workspace header offers **Help for this page**; navigation and the account
  menu call the shared hub **Help Centre**. Billing links directly to its relevant
  guide and to administrator support. The public site footer links to `/help`.
- Staff are directed to their church administrator for account/plan/provider access.
  Only church administrators and super administrators get direct support actions
  inside the help hub and workspace menus. Public articles explain this distinction
  and may link to the protected administrator support route. They never load tawk.to.
- The existing on-demand tawk.to flow remains at `/support`, now labelled
  **Contact support**, with a link back to the Help Centre. Its session and tenant
  teardown behavior is unchanged.
- The retired monolithic user manual, permission-code tables and member-role docs
  presentation have been removed. Public articles describe directory members as
  records, not login users. Published plan/currency, manual-renewal and provider
  instructions reflect the current implementation.

## Content boundaries

This first release covers onboarding/account recovery, staff access, directory
and imports, families/visitors, attendance, events/tickets/groups, giving/reporting,
subscription allowances/currencies/payment recovery, provider setup, offline work
and contacting support. It does not claim to document every app feature.

There are no private church records, credentials, example production accounts or
internal operational runbooks in the article library. Public article visibility is
independent of a church subscription or staff role; reading a guide grants no
application access. Expired or missing sessions do not redirect public articles.
The help pages work without the backend, apart from the existing best-effort
session restoration, whose failure does not block reading.

Developer/API documentation remains separate in the backend developer-guide
module and repository technical docs. It is not imported, presented as user help
or newly linked from the public Help Centre; its full API-content review is outside
this initial user-guide rollout.

## Maintaining articles

- `src/lib/help/catalog.ts` owns topics and article metadata. Use durable slugs.
  Metadata permissions/admin flags affect workspace suggestions only, never public
  reading. Set keywords to the words users actually search for.
- `src/lib/help/content.ts` owns typed sections, prose, numbered steps, bullets and
  notes. React renders plain text; arbitrary HTML or scripts are not supported.
- Update the review date when reviewing the library. If guides start being reviewed
  independently, introduce per-article review dates rather than claiming a whole
  library review for a single edit.
- Recheck the relevant application flow before changing instructions, plan prices,
  limits or provider behavior. Use screenshots only when verified against the app
  with synthetic data; never copy church records into public assets.
- Add or maintain mappings in `recommendations.ts` when retiring an old link.
- Changes are reviewed and published with the web application. No CMS, new package,
  database table, search service, AI assistant or hosting account is required.

## Rollout

Deploy the web application. No migration is introduced by this Help Centre change.
Any migrations required by earlier billing changes remain a separate deployment
prerequisite for those changes. No deployment or live support message was sent
while implementing this feature.

## Validation

- Production build, TypeScript and targeted ESLint checks passed.
- Unit checks: 15 files / 319 tests passed, including complete article/anchor
  integrity, body-text search, topic filtering and permission-aware suggestions.
- Browser coverage includes anonymous and JavaScript-disabled reading, expired
  sessions, search URLs, legacy anchors, administrator/staff support boundaries,
  missing-guide recovery, sitemap inclusion and layouts at 320px, 375px and 390px.
- Existing marketing and mocked tawk.to browser checks remain part of acceptance.
- Desktop public help and mobile reading/workspace screenshots were inspected.
- Final browser run: 26 tests passed across Help Centre, support and marketing,
  including a Help Centre-specific 404 response and full administrator mobile
  utility controls. No live provider requests were used for support checks.
