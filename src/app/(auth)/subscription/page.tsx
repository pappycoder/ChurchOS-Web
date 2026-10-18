"use client";
import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { api } from "@/lib/api";
import { launchPlans, naira } from "@/components/marketing/plans";
import type {
  BillingStatus,
  SubscriptionGateway,
  SubscriptionPlan,
  BillingCycle,
} from "@/types/billing";

export default function SubscriptionPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { ready, can } = usePermissions();
  const queryClient = useQueryClient();
  const allowed = ready && can("billing", "read");
  const canPay = ready && can("billing", "update");
  const status = useQuery({
    queryKey: ["platform-subscription"],
    queryFn: () => api.get<BillingStatus>("/billing/subscription"),
    enabled: isAuthenticated && allowed,
    retry: false,
  });
  const [gateway, setGateway] = React.useState<SubscriptionGateway>("paystack");
  const [plan, setPlan] =
    React.useState<Exclude<SubscriptionPlan, "enterprise">>("essentials");
  const [cycle, setCycle] = React.useState<BillingCycle>("monthly");
  const [message, setMessage] = React.useState("");
  const [reference, setReference] = React.useState("");
  const verifiedRef = React.useRef("");
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("tx_ref") || "";
    if (/^COSUB_[a-f0-9]{32}$/.test(ref)) setReference(ref);
    if (params.get("status") === "cancelled")
      setMessage(
        "Payment was cancelled. You can resume checkout whenever you’re ready.",
      );
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  React.useEffect(() => {
    if (status.data) {
      const s = status.data.latestPayment || status.data.subscription;
      if (s && s.plan !== "enterprise") {
        setPlan(s.plan);
        setCycle(s.cycle);
      }
      setGateway(
        status.data.latestPayment?.gateway ||
          status.data.gateways[0] ||
          "paystack",
      );
    }
  }, [status.data]);
  const verify = useMutation({
    mutationFn: (ref: string) =>
      api.post<BillingStatus>("/billing/verify", { reference: ref }),
    onSuccess: (data) => {
      queryClient.setQueryData(["platform-subscription"], data);
      setMessage(
        data.active
          ? "Payment verified. Your workspace is ready."
          : "Payment has not been confirmed yet. If you paid, wait a moment and check again.",
      );
    },
    onError: (e) =>
      setMessage(
        e.message || "We couldn’t verify your payment. Please try again.",
      ),
  });
  const verifyPayment = verify.mutate;
  React.useEffect(() => {
    if (
      reference &&
      allowed &&
      canPay &&
      isAuthenticated &&
      verifiedRef.current !== reference
    ) {
      verifiedRef.current = reference;
      verifyPayment(reference);
    }
  }, [reference, allowed, canPay, isAuthenticated, verifyPayment]);
  const checkout = useMutation({
    mutationFn: () =>
      api.post<{ authorizationUrl: string; reference: string }>(
        "/billing/checkout",
        { plan, cycle, gateway },
      ),
    onSuccess: (data) => {
      const url = new URL(data.authorizationUrl);
      if (
        url.protocol !== "https:" ||
        ![
          "checkout.paystack.com",
          "checkout.flutterwave.com",
          "ravemodal.flutterwave.com",
        ].includes(url.hostname) ||
        url.username ||
        url.password ||
        url.port
      ) {
        setMessage("Unable to open a trusted payment page. Contact ChurchOS.");
        return;
      }
      window.location.assign(url.href);
    },
    onError: (e) =>
      setMessage(e.message || "Checkout is unavailable. Please retry."),
  });
  const selected = launchPlans.find((p) => p.id === plan)!;
  const waiting = checkout.isPending || verify.isPending;
  const pending = status.data?.latestPayment;
  let content: React.ReactNode;
  if (isLoading || (isAuthenticated && !ready))
    content = (
      <p role="status" className="text-sm text-muted-foreground">
        Preparing your workspace…
      </p>
    );
  else if (!isAuthenticated)
    content = (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sign in to your administrator account to complete or check your
          subscription payment.
        </p>
        <Button asChild className="w-full rounded-xl" size="lg">
          <Link
            href={`/login?returnTo=${encodeURIComponent(`/subscription${reference ? `?reference=${reference}` : ""}`)}`}
          >
            Sign in to continue <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  else if (!allowed)
    content = (
      <p role="alert" className="rounded-xl border bg-card p-5 text-sm">
        Your church administrator manages the ChurchOS subscription. Please
        contact them to activate or renew your workspace.
      </p>
    );
  else if (status.isPending)
    content = (
      <p role="status" className="text-sm text-muted-foreground">
        Loading subscription…
      </p>
    );
  else if (status.isError)
    content = (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-destructive">
          {status.error.message}
        </p>
        <Button onClick={() => void status.refetch()} variant="outline">
          Try again
        </Button>
      </div>
    );
  else if (status.data?.active)
    content = (
      <div className="space-y-5 rounded-2xl border bg-card/70 p-6">
        <CheckCircle2 className="size-10 text-primary" />
        <h2 className="text-xl font-semibold">You’re all set.</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {`${status.data.subscription?.plan} is active until ${new Date(status.data.subscription!.paid_until!).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}. There are no automatic renewal charges.`}
        </p>
        <Button asChild className="w-full rounded-xl" size="lg">
          <Link href="/dashboard">
            Open your workspace <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  else
    content = (
      <div className="space-y-5">
        <div className="rounded-2xl border bg-card/70 p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="size-4" /> CHURCHOS SUBSCRIPTION
          </div>
          {pending ? (
            <>
              <h2 className="mt-4 text-xl font-semibold capitalize">
                {pending.plan} ·{" "}
                {pending.cycle === "annual" ? "Yearly" : "Monthly"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                An existing checkout is ready. Resume it or check payment below.
              </p>
            </>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs">
                Plan
                <select
                  aria-label="Subscription plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as typeof plan)}
                  disabled={waiting}
                  className="mt-1 block h-11 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  {launchPlans
                    .filter((p) => p.id !== "enterprise")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="space-y-1 text-xs">
                Billing period
                <select
                  aria-label="Billing period"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as BillingCycle)}
                  disabled={waiting}
                  className="mt-1 block h-11 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Yearly · save 10%</option>
                </select>
              </label>
            </div>
          )}
          <div className="mt-5 flex items-end justify-between border-t pt-4">
            <span className="text-xs text-muted-foreground">
              Total due · NGN
            </span>
            <strong className="text-3xl tracking-tight">
              {naira(
                pending?.amount ||
                  (cycle === "annual" ? selected.annual : selected.monthly),
              )}
            </strong>
          </div>
        </div>
        {status.data?.gateways.length ? (
          <>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">
                Pay securely with
              </legend>
              {status.data.gateways
                .filter((g) => !pending || g === pending.gateway)
                .map((g) => (
                  <label
                    key={g}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card/50 p-4 text-sm"
                  >
                    <input
                      type="radio"
                      name="gateway"
                      value={g}
                      checked={gateway === g}
                      onChange={() => setGateway(g)}
                      disabled={waiting}
                      className="accent-primary"
                    />
                    <span className="flex-1 capitalize">{g}</span>
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </label>
                ))}
            </fieldset>
            <Button
              onClick={() => {
                setMessage("");
                checkout.mutate();
              }}
              disabled={
                waiting ||
                !canPay ||
                (!!pending && !status.data.gateways.includes(pending.gateway))
              }
              loading={checkout.isPending}
              size="lg"
              className="w-full rounded-xl"
            >
              {pending ? "Resume secure checkout" : "Continue to payment"}
              <ArrowRight className="size-4" />
            </Button>
          </>
        ) : (
          <p
            role="status"
            className="rounded-xl border bg-card p-4 text-sm text-muted-foreground"
          >
            ChurchOS checkout is being configured. Your account is saved. Please
            return later or contact ChurchOS.
          </p>
        )}
        {(reference || pending) && (
          <Button
            className="w-full rounded-xl"
            variant="outline"
            disabled={waiting || !canPay}
            loading={verify.isPending}
            onClick={() => verify.mutate(reference || pending!.reference)}
          >
            I’ve paid — check payment
          </Button>
        )}
        <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Payment goes to ChurchOS, separate from your church’s giving. We never
          collect your card details. Renewals are manual.
        </p>
      </div>
    );
  return (
    <AuthFormWrapper
      heading="Bring your workspace to life."
      subtitle="One last step. A whole new way to bring your church together."
      footer={
        isAuthenticated ? (
          <button
            type="button"
            className="text-xs hover:underline"
            onClick={() => void logout()}
          >
            Sign out
          </button>
        ) : (
          <Link href="/register" className="text-sm hover:underline">
            Create a church workspace
          </Link>
        )
      }
    >
      {content}
      {message && (
        <p
          role="status"
          className="rounded-xl border bg-card p-4 text-sm leading-relaxed"
        >
          {message}
        </p>
      )}
    </AuthFormWrapper>
  );
}
