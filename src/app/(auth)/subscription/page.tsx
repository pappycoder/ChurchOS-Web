"use client";
import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useBillingStatus } from "@/hooks/use-billing";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { launchPlans, naira } from "@/components/marketing/plans";
import type {
  BillingStatus,
  BillingQuote,
  SubscriptionPlan,
  BillingCycle,
  SubscriptionGateway,
} from "@/types/billing";
const order = ["essentials", "community", "network", "enterprise"];
const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Lagos",
      })
    : "Not activated";
export default function SubscriptionPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const status = useBillingStatus();
  const client = useQueryClient();
  const [plan, setPlan] =
    React.useState<Exclude<SubscriptionPlan, "enterprise">>("essentials");
  const [cycle, setCycle] = React.useState<BillingCycle>("monthly");
  const [gateway, setGateway] = React.useState<SubscriptionGateway>("paystack");
  const [message, setMessage] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [manage, setManage] = React.useState(false);
  const initialized = React.useRef(false);
  const verified = React.useRef("");
  const data = status.data;
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["platform-subscription"] }),
      client.invalidateQueries({ queryKey: ["current-profile"] }),
    ]);
  };
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("tx_ref") || "";
    if (/^COSUB_[a-f0-9]{32}$/.test(ref)) setReference(ref);
    if (params.get("status") === "cancelled")
      setMessage("Payment was cancelled. Your current plan is unchanged.");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  React.useEffect(() => {
    if (!data || initialized.current) return;
    initialized.current = true;
    const selection = data.latestPayment || data.subscription;
    if (selection?.plan && selection.plan !== "enterprise")
      setPlan(
        (data.latestPayment?.plan as Exclude<SubscriptionPlan, "enterprise">) ||
          (data.subscription?.scheduled_plan as Exclude<
            SubscriptionPlan,
            "enterprise"
          >) ||
          selection.plan,
      );
    setCycle(
      data.subscription?.scheduled_cycle || selection?.cycle || "monthly",
    );
    setGateway(data.latestPayment?.gateway || data.gateways[0] || "paystack");
  }, [data]);
  const verify = useMutation({
    mutationFn: (ref: string) =>
      api.post<BillingStatus>("/billing/verify", { reference: ref }),
    onSuccess: async (result) => {
      setMessage(
        result.payments?.some(
          (p) => p.reference === reference && p.application_status === "review",
        )
          ? "Your payment was received and requires a ChurchOS review. Contact support with your payment reference."
          : result.active
            ? "Payment verified. Your subscription is active."
            : "Payment is not confirmed yet. If you paid, wait a moment and check again.",
      );
      await refresh();
    },
    onError: (e) => setMessage(e.message),
  });
  const verifyPayment = verify.mutate;
  React.useEffect(() => {
    if (reference && status.canPay && verified.current !== reference) {
      verified.current = reference;
      verifyPayment(reference);
    }
  }, [reference, status.canPay, verifyPayment]);
  const pending = data?.latestPayment;
  const downgrade = !!(
    data?.active &&
    data.subscription &&
    order.indexOf(plan) < order.indexOf(data.subscription.plan)
  );
  const samePlan = data?.subscription?.plan === plan;
  const quote = useQuery({
    queryKey: [
      "billing-quote",
      plan,
      cycle,
      gateway,
      data?.subscription?.paid_until,
    ],
    queryFn: () =>
      api.post<BillingQuote>("/billing/quote", { plan, cycle, gateway }),
    enabled:
      status.allowed &&
      !!data &&
      !downgrade &&
      !pending &&
      !(samePlan && data.active) &&
      (manage || !data.active),
    retry: false,
    staleTime: 30000,
  });
  const checkout = useMutation({
    mutationFn: () =>
      api.post<{ authorizationUrl: string; reference: string }>(
        "/billing/checkout",
        {
          plan: pending?.plan || plan,
          cycle: pending?.cycle || cycle,
          gateway: pending?.gateway || gateway,
        },
      ),
    onSuccess: (result) => {
      const url = new URL(result.authorizationUrl);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        ![
          "checkout.paystack.com",
          "checkout.flutterwave.com",
          "ravemodal.flutterwave.com",
        ].includes(url.hostname)
      ) {
        setMessage("Unable to open a trusted payment page. Contact ChurchOS.");
        return;
      }
      window.location.assign(url.href);
    },
    onError: (e) => setMessage(e.message),
  });
  const schedule = useMutation({
    mutationFn: (cancel: boolean) =>
      api.post<BillingStatus>(
        "/billing/schedule",
        cancel ? {} : { plan, cycle },
      ),
    onSuccess: async () => {
      setMessage("Your renewal preference was saved. No payment was taken.");
      setManage(false);
      await refresh();
    },
    onError: (e) => setMessage(e.message),
  });
  if (isLoading)
    return (
      <div role="status" className="p-8">
        Loading your account…
      </div>
    );
  if (!isAuthenticated)
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Plan & Billing</h1>
        <p>
          Sign in to your church administrator account to manage subscriptions.
        </p>
        <Button asChild>
          <Link href="/login?returnTo=%2Fsubscription">Sign in</Link>
        </Button>
      </div>
    );
  if (!status.allowed && status.accessReady)
    return (
      <div className="mx-auto max-w-lg space-y-5 p-8">
        <h1 className="text-2xl font-semibold">Contact your administrator</h1>
        <p>
          Your church administrator manages the ChurchOS subscription. Please
          contact them to activate or renew your workspace.
        </p>
        <Button variant="outline" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    );
  if (!status.allowed)
    return (
      <div role="status" className="p-8">
        Checking access…
      </div>
    );
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to workspace
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">
            Plan & Billing
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your church subscription, allowances and payments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href="/support">Help & Support</Link></Button>
          <Button variant="outline" onClick={() => void logout()}>Sign out</Button>
        </div>
      </header>
      {status.isPending && <p role="status">Loading subscription…</p>}
      {status.isError && (
        <div role="alert" className="rounded-xl border p-4">
          <p>{status.error.message}</p>
          <Button onClick={() => void status.refetch()}>Try again</Button>
        </div>
      )}
      {message && (
        <p role="status" className="rounded-xl border bg-muted/40 p-4">
          {message}
        </p>
      )}
      {data && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    CURRENT SUBSCRIPTION
                  </p>
                  <CardTitle className="mt-2 text-2xl capitalize">
                    {data.subscription?.plan || "Choose your plan"}
                  </CardTitle>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                  {data.active ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <AlertCircle className="size-4" />
                  )}
                  {data.active ? "Active" : "Renewal required"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p>
                Renew by <strong>{date(data.subscription?.paid_until)}</strong>.
                Renewals are manual; there are no automatic charges.
              </p>
              {data.subscription?.scheduled_plan && (
                <div className="rounded-lg border p-3">
                  <p className="capitalize">
                    Next renewal: {data.subscription.scheduled_plan} ·{" "}
                    {data.subscription.scheduled_cycle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current access continues until expiry. Existing records will
                    be kept; lower allowances block new additions. Renew at the
                    selected plan to complete the change.
                  </p>
                  <Button
                    variant="link"
                    disabled={!status.canPay || schedule.isPending}
                    onClick={() => schedule.mutate(true)}
                  >
                    Cancel scheduled change
                  </Button>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-3">
                {(["members", "staff", "locations"] as const).map(
                  (resource) => {
                    const used = data.usage?.[resource] ?? 0;
                    const limit = data.limits?.[resource] ?? 0;
                    const percent = limit
                      ? Math.min(100, (used / limit) * 100)
                      : 100;
                    return (
                      <div key={resource} className="rounded-xl border p-4">
                        <div className="flex justify-between gap-2">
                          <h2 className="font-medium capitalize">
                            {resource === "staff" ? "Staff accounts" : resource}
                          </h2>
                          <strong>
                            {used} / {limit}
                          </strong>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`${resource} allowance`}
                          aria-valuenow={used}
                          aria-valuemin={0}
                          aria-valuemax={Math.max(limit, used, 1)}
                          className="my-3 h-2 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className={
                              percent >= 90
                                ? "h-full bg-amber-500"
                                : "h-full bg-primary"
                            }
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {resource === "members"
                            ? "Non-archived directory records"
                            : resource === "locations"
                              ? "Includes your headquarters"
                              : `${data.usage?.pendingInvitations ?? 0} pending invitations included`}
                        </p>
                        {used >= limit ? (
                          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                            Allowance reached. Review your plan to add more.
                          </p>
                        ) : percent >= 80 ? (
                          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                            Approaching your allowance.
                          </p>
                        ) : null}
                      </div>
                    );
                  },
                )}
              </div>
              <Button onClick={() => setManage((v) => !v)}>
                {manage
                  ? "Close plan comparison"
                  : data.active
                    ? "Manage plan"
                    : "Choose a plan and renew"}
              </Button>
            </CardContent>
          </Card>
          {(manage || !data.active || pending) && (
            <section aria-label="Manage plan" className="space-y-5">
              <h2 className="text-xl font-semibold">
                Choose the space your church needs
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {launchPlans.map((item) => {
                  const server = data.catalog?.find((p) => p.id === item.id);
                  return (
                    <Card
                      key={item.id}
                      className={plan === item.id ? "border-primary" : ""}
                    >
                      <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xl font-semibold">
                          {server
                            ? naira(
                                cycle === "annual"
                                  ? server.annual
                                  : server.monthly,
                              )
                            : item.id === "enterprise"
                              ? "Negotiated"
                              : "Loading price…"}
                        </p>
                        <p className="text-sm">{item.capacity}</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {item.features.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                        {item.id === "enterprise" ? (
                          <p className="text-sm">
                            Contact ChurchOS sales for an agreed quote.
                          </p>
                        ) : (
                          <Button
                            className="w-full"
                            variant={plan === item.id ? "default" : "outline"}
                            disabled={!!pending}
                            onClick={() => setPlan(item.id as typeof plan)}
                          >
                            {data.subscription?.plan === item.id
                              ? "Current plan"
                              : `Choose ${item.name}`}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="grid gap-5 rounded-xl border bg-card p-5 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="block text-sm">
                    Billing period
                    <select
                      aria-label="Billing period"
                      className="mt-1 block w-full rounded-md border bg-background p-3"
                      value={cycle}
                      disabled={!!pending}
                      onChange={(e) => setCycle(e.target.value as BillingCycle)}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Yearly · save 10%</option>
                    </select>
                  </label>
                  {!downgrade && (
                    <label className="block text-sm">
                      Payment provider
                      <select
                        aria-label="Payment provider"
                        className="mt-1 block w-full rounded-md border bg-background p-3"
                        value={pending?.gateway || gateway}
                        disabled={!!pending}
                        onChange={(e) =>
                          setGateway(e.target.value as SubscriptionGateway)
                        }
                      >
                        {data.gateways.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <div className="space-y-3">
                  {downgrade ? (
                    <>
                      <h3 className="font-semibold">
                        Schedule for your next renewal
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Your current plan continues until{" "}
                        {date(data.subscription?.paid_until)}. Records will be
                        retained, and additions beyond the new allowance will be
                        blocked. No charge today.
                      </p>
                      <Button
                        disabled={!status.canPay || schedule.isPending}
                        onClick={() => schedule.mutate(false)}
                      >
                        Schedule downgrade
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="flex items-center gap-2 font-semibold">
                        <CreditCard className="size-4" />
                        {pending
                          ? "Pending payment"
                          : samePlan && data.active
                            ? "Renew subscription"
                            : data.active
                              ? "Upgrade now"
                              : "Activate subscription"}
                      </h3>
                      {pending ? (
                        <p>
                          Amount due: <strong>{naira(pending.amount)}</strong>
                        </p>
                      ) : quote.data ? (
                        <>
                          <p className="text-2xl font-semibold">
                            {naira(quote.data.amount)} due
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {quote.data.intent === "upgrade"
                              ? "Prorated upgrade for the remaining paid period. Your renewal deadline stays the same."
                              : "Full subscription period. No automatic renewal charges."}{" "}
                            Renew by {date(quote.data.renewBy)}.
                          </p>
                        </>
                      ) : samePlan && data.active ? (
                        <p className="text-sm text-muted-foreground">
                          Your plan is active. Choose a larger plan to upgrade
                          now, or renew after{" "}
                          {date(data.subscription?.paid_until)}.
                        </p>
                      ) : quote.isError ? (
                        <p role="alert" className="text-sm text-destructive">
                          {quote.error.message}
                        </p>
                      ) : (
                        <p role="status">Calculating your payment…</p>
                      )}
                      <Button
                        disabled={
                          !status.canPay ||
                          checkout.isPending ||
                          (!pending && !quote.data) ||
                          !data.gateways.length
                        }
                        onClick={() => checkout.mutate()}
                      >
                        {pending
                          ? "Resume secure checkout"
                          : "Continue to payment"}
                      </Button>
                      {!data.gateways.length && (
                        <p className="text-sm">
                          Checkout is being configured. Contact ChurchOS.
                        </p>
                      )}
                    </>
                  )}
                  {(reference || pending) && (
                    <Button
                      variant="outline"
                      disabled={!status.canPay || verify.isPending}
                      onClick={() =>
                        verify.mutate(reference || pending!.reference)
                      }
                    >
                      I’ve paid — check payment
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <CardContent>
              {!data.payments?.length ? (
                <p className="text-sm text-muted-foreground">
                  No subscription payments yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2">Date</th>
                        <th className="p-2">Plan</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.map((payment) => (
                        <tr key={payment.reference} className="border-b">
                          <td className="p-2 whitespace-nowrap">
                            {date(payment.created_at)}
                          </td>
                          <td className="p-2 capitalize">{payment.plan}</td>
                          <td className="p-2 whitespace-nowrap">
                            {naira(payment.amount)}
                          </td>
                          <td className="p-2 capitalize">
                            {payment.application_status === "review"
                              ? "Received — contact support"
                              : payment.status}
                          </td>
                          <td className="p-2 font-mono text-xs">
                            {payment.reference}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
