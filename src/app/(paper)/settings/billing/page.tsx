"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  Download,
  Sparkles,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/paper/section";
import { Tag } from "@/components/paper/stat";
import { EmptyState } from "@/components/paper/primitives";
import { StaggerGroup, StaggerItem } from "@/components/paper/motion/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingStatus } from "@/hooks/use-billing";
import { subscriptionMoney } from "@/hooks/use-subscription-pricing";
import { formatDate } from "@/hooks/use-media";
import { number, percent } from "@/lib/paper/format";
import { cn } from "@/lib/utils";

const PLAN_TITLES: Record<string, string> = {
  essentials: "Essentials",
  community: "Community",
  network: "Network",
  enterprise: "Enterprise",
};

function planTitle(plan?: string | null) {
  if (!plan) return "Not subscribed";
  return PLAN_TITLES[plan] ?? plan.replace(/_/g, " ");
}

const PAYMENT_TONES: Record<string, "moss" | "gold" | "rose" | "neutral"> = {
  success: "moss",
  applied: "moss",
  pending: "gold",
  failed: "rose",
  cancelled: "neutral",
};

export default function SettingsBillingPage() {
  const status = useBillingStatus();

  if (!status.accessReady) {
    return <div className="space-y-4"><Skeleton className="h-6 w-40" /><Skeleton className="h-64 rounded-2xl" /></div>;
  }

  if (!status.allowed) {
    return (
      <EmptyState
        icon={<Wallet />}
        title="Billing stays with the church admins"
        description="Plan, payments and usage are visible to those who hold the billing grant. Your role keeps the register running — this ledger isn't yours to carry."
        action={<Button asChild variant="outline" size="sm" className="rounded-full border-line text-xs"><Link href="/settings/profile">Back to your profile</Link></Button>}
      />
    );
  }

  if (status.isLoading || !status.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const d = status.data;
  const sub = d.subscription;
  const usageRows = [
    { label: "Members", used: d.usage.members, cap: d.limits.members },
    { label: "Staff seats", used: d.usage.staff, cap: d.limits.staff },
    { label: "Locations", used: d.usage.locations, cap: d.limits.locations },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Billing"
        title="The plainest receipt the church ever kept."
        description="Current plan, real usage and every payment — no small print, no surprises at renewal."
        actions={
          <Button asChild className="h-9 gap-1.5 rounded-full text-xs">
            <Link href="/subscription">
              <ArrowUpRight className="size-3.5" /> Change plan
            </Link>
          </Button>
        }
      />

      <div className="paper-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-terracotta-soft text-terracotta">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-xs text-ink-faint">Current plan</p>
              <p className="font-display text-lg font-semibold leading-tight">{planTitle(sub?.plan)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={d.active ? "moss" : "rose"} dot>{d.active ? "Active" : "Lapsed"}</Tag>
            {sub?.paid_until ? <Tag tone="neutral">Paid through {formatDate(sub.paid_until)}</Tag> : null}
            {sub?.scheduled_plan && sub.scheduled_plan !== sub.plan ? (
              <Tag tone="gold">Next: {planTitle(sub.scheduled_plan)}</Tag>
            ) : null}
            {d.latestPayment ? (
              <span className="num text-sm font-semibold">
                {subscriptionMoney(d.latestPayment.amount, d.latestPayment.currency)}
                <span className="text-[10px] font-normal text-ink-faint"> / {d.latestPayment.cycle === "annual" ? "year" : "month"}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line/60 sm:grid-cols-4">
          {[
            { label: "Pending invitations", value: number(d.usage.pendingInvitations ?? 0) },
            { label: "Plan features", value: `${number(d.features.length)} on` },
            { label: "Billing currency", value: d.baseCurrency },
            { label: "Gateways ready", value: number(d.gateways.length) },
          ].map((row) => (
            <div key={row.label} className="bg-card px-4 py-3">
              <p className="text-[9px] uppercase tracking-wider text-ink-faint">{row.label}</p>
              <p className="num mt-0.5 text-xs font-semibold">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {usageRows.map((row) => {
          const pct = row.cap > 0 ? percent(row.used, row.cap) : 0;
          const nearCap = row.cap > 0 && pct >= 85;
          return (
            <div key={row.label} className="paper-card rounded-2xl p-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium">{row.label}</span>
                <span className="num text-ink-soft">
                  {number(row.used)} <span className="text-ink-faint">/ {row.cap > 0 ? number(row.cap) : "∞"}</span>
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", nearCap ? "bg-rose" : "bg-moss")} style={{ width: `${row.cap > 0 ? Math.min(100, pct) : 8}%` }} />
              </div>
              {nearCap ? <p className="mt-1.5 text-[10px] text-rose">Approaching the plan ceiling — a change of plan is worth discussing early.</p> : null}
            </div>
          );
        })}
      </div>

      <div className="paper-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="rule-label">Payment history</p>
          <span className="text-[10px] text-ink-faint">Every invoice is church-business receipts-ready.</span>
        </div>
        {d.payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-[11px] text-ink-faint">No payments recorded yet — the register stays honest either way.</div>
        ) : (
          <StaggerGroup className="divide-y divide-line/70">
            {d.payments.slice(0, 12).map((payment) => (
              <StaggerItem key={payment.reference}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-3 text-xs">
                  <span className="font-mono text-[10px] text-ink-faint">{payment.reference.slice(0, 14)}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {planTitle(payment.plan)} · {payment.cycle}
                  </span>
                  <span className="text-[10px] text-ink-faint">{formatDate(payment.created_at)}</span>
                  <Tag tone={PAYMENT_TONES[payment.status] ?? "neutral"} dot>{payment.status}</Tag>
                  <span className="num w-24 text-right font-semibold">{subscriptionMoney(payment.amount, payment.currency)}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[10px] text-ink-faint">
          <span className="flex items-center gap-1.5"><CreditCard className="size-3" /> {status.canPay ? "Payments and plan changes run through the checkout." : "Only billing writers can start a new charge."}</span>
          <Link href="/subscription" className="flex items-center gap-1 text-terracotta hover:underline">
            <Download className="size-3" /> Open Plan &amp; Billing
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-dashed border-line p-4 text-[11px] text-ink-soft">
        Renewals are manual on the current gateway — nothing charges silently while the team is shepherding.
        <Link href="/subscription" className="flex items-center gap-1 text-terracotta hover:underline"><Download className="size-3" /> Compare &amp; change plans</Link>
      </div>
    </div>
  );
}
