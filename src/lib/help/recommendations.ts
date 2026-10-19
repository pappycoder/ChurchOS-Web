import { helpArticles, type HelpSummary } from "./catalog";
const contextual: [string, string[]][] = [
  ["/members/import", ["import-members", "plans-and-allowances"]],
  ["/members/families", ["organise-families", "add-and-update-members"]],
  [
    "/members",
    ["add-and-update-members", "import-members", "organise-families"],
  ],
  ["/visitors", ["welcome-and-follow-up-visitors", "add-and-update-members"]],
  ["/attendance", ["check-in-attendees", "record-attendance-totals"]],
  ["/events", ["create-events-and-registrations", "manage-event-tickets"]],
  ["/giving", ["record-giving-and-receipts", "reports-and-analytics"]],
  ["/reports", ["reports-and-analytics", "record-attendance-totals"]],
  ["/analytics", ["reports-and-analytics"]],
  [
    "/subscription",
    [
      "plans-and-allowances",
      "subscription-currencies-and-payments",
      "subscription-payment-problems",
    ],
  ],
  ["/admin/integrations", ["connect-provider-accounts"]],
  ["/admin/users", ["invite-staff-and-manage-access"]],
  ["/admin/roles", ["invite-staff-and-manage-access"]],
  ["/departments", ["departments-and-cell-groups", "record-attendance-totals"]],
  ["/offline", ["offline-work-and-reconnection"]],
];
export function suggestedHelp(
  path: string,
  can: (permission: string) => boolean,
  roles: readonly string[],
) {
  const administrator = roles.some(
    (role) => role === "church_admin" || role === "super_admin",
  );
  const eligible = (article: HelpSummary) =>
    (!article.adminOnly || administrator) &&
    (!article.permissions || article.permissions.some(can));
  const preferred =
    contextual.find(
      ([prefix]) => path === prefix || path.startsWith(`${prefix}/`),
    )?.[1] || [];
  const roleSuggestions = helpArticles
    .filter(
      (article) =>
        eligible(article) &&
        ("permissions" in article || "adminOnly" in article),
    )
    .sort(
      (a, b) =>
        Number("popular" in b && b.popular) -
        Number("popular" in a && a.popular),
    )
    .map((article) => article.slug);
  const slugs = [
    ...preferred,
    ...roleSuggestions,
    "set-up-your-church",
    "sign-in-and-account-recovery",
    "get-help-and-report-a-problem",
  ];
  return [...new Set(slugs)]
    .map((slug) => helpArticles.find((article) => article.slug === slug))
    .filter(
      (article): article is (typeof helpArticles)[number] =>
        !!article && eligible(article),
    )
    .slice(0, 3);
}
/** Keep links to sections of the retired single-page manual useful. */
export const legacyHelpSections: Record<string, string> = {
  sermons: "get-help-and-report-a-problem",
  media: "get-help-and-report-a-problem",
  pastoral: "get-help-and-report-a-problem",
  assets: "get-help-and-report-a-problem",
  forms: "get-help-and-report-a-problem",
  "getting-started": "set-up-your-church",
  members: "add-and-update-members",
  families: "organise-families",
  visitors: "welcome-and-follow-up-visitors",
  attendance: "check-in-attendees",
  giving: "record-giving-and-receipts",
  events: "create-events-and-registrations",
  reports: "reports-and-analytics",
  analytics: "reports-and-analytics",
  departments: "departments-and-cell-groups",
  "admin-users": "invite-staff-and-manage-access",
  "admin-roles": "invite-staff-and-manage-access",
  "permissions-matrix": "invite-staff-and-manage-access",
  "admin-settings": "set-up-your-church",
  "admin-branches": "plans-and-allowances",
  communication: "connect-provider-accounts",
};
