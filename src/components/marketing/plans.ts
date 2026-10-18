/** Proposed marketing plans only. This data does not enforce subscriptions or entitlements. */
export const launchPlans = [
  {
    id: "essentials",
    name: "Essentials",
    description: "A small beginning. A strong foundation.",
    monthly: 10000,
    annual: 108000,
    capacity: "50 members · 1 location · 2 staff accounts",
    features: [
      "Member and visitor directory",
      "Services and attendance",
      "Visitor follow-up",
      "Permission-based access",
    ],
  },
  {
    id: "community",
    name: "Community",
    description: "Everything your church needs to find its rhythm.",
    monthly: 20000,
    annual: 216000,
    capacity: "300 members · 1 location · 5 staff accounts",
    features: [
      "Everything in Essentials",
      "Giving records and receipts",
      "Events and registrations",
      "Departments and cell groups",
      "Forms and essential reports",
      "Connect your email provider",
    ],
  },
  {
    id: "network",
    name: "Network",
    description: "Bring more people, teams and places together.",
    monthly: 40000,
    annual: 432000,
    capacity: "1,500 members · 3 locations · 15 staff accounts",
    featured: true,
    features: [
      "Everything in Community",
      "Branch and HQ workspaces",
      "SMS and WhatsApp integrations",
      "Event tickets and check-in",
      "Pastoral care and appointments",
      "Asset register and maintenance",
      "Analytics for administrators",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "A connected foundation for a wider ministry.",
    monthly: 80000,
    annual: 864000,
    capacity: "Member, location and team limits agreed with you",
    features: [
      "Everything in Network",
      "A rollout shaped to your network",
      "Central oversight, local ownership",
      "Provider and payment integrations",
      "Migration and onboarding scope",
      "Support arrangements agreed upfront",
    ],
  },
] as const;
export type LaunchPlan = (typeof launchPlans)[number];
export function naira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
