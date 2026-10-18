/** Wire values mirror the backend Prisma enums; repositories build independently. */
export type SubscriptionPlan =
  "essentials" | "community" | "network" | "enterprise";
export type BillingCycle = "monthly" | "annual";
export type SubscriptionGateway = "paystack" | "flutterwave";
export interface BillingStatus {
  subscription: {
    plan: SubscriptionPlan;
    cycle: BillingCycle;
    paid_until: string | null;
  } | null;
  active: boolean;
  gateways: SubscriptionGateway[];
  latestPayment: {
    reference: string;
    gateway: SubscriptionGateway;
    plan: SubscriptionPlan;
    cycle: BillingCycle;
    amount: number;
  } | null;
}
