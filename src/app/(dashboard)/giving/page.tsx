"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarRange,
  HandCoins,
  Plus,
  Settings2,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  useGivingSummary,
  useGivingTransactions,
} from "@/hooks/use-giving";
import { usePermissions } from "@/hooks/use-permissions";
import { RecordCashDialog } from "@/components/giving/record-cash-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBranchesList } from "@/hooks/use-branches";
import { useCurrentProfile } from "@/hooks/use-profile";

const trendConfig = {
  total: { label: "Given", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function GivingDashboardPage() {
  const { can } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const isAdminHq = !!profile?.isAdminHq;
  const [branchId, setBranchId] = React.useState("");
  const canCreate = can("giving", "create");

  const [recordOpen, setRecordOpen] = React.useState(false);

  const effectiveBranchId = isAdminHq ? branchId : profile?.branchId ?? "";
  const branchesQuery = useBranchesList({ limit: 100 }, { enabled: isAdminHq });
  const recentQuery = useGivingTransactions({ limit: 8, branchId: effectiveBranchId || undefined });

  // Calendar-month-start bound for the "Gifts This Month" count query.
  const monthStart = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  const monthQuery = useGivingTransactions({
    status: "success",
    startDate: monthStart,
    limit: 1,
    branchId: effectiveBranchId || undefined,
  });

  const summaryQuery = useGivingSummary({ branchId: effectiveBranchId || undefined });
  const summary = summaryQuery.data;

  const hasTrend = (summary?.trend ?? []).some((point) => point.total > 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Giving"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Giving" }]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/giving/categories">
                <Settings2 className="h-4 w-4 mr-2" />
                Categories
              </Link>
            </Button>
            {canCreate && (
              <Button onClick={() => setRecordOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Cash
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <Label htmlFor="giving-branch-filter" className="text-sm font-medium">Branch</Label>
        {isAdminHq ? (
          <Select value={branchId || "all"} onValueChange={(value) => setBranchId(value === "all" ? "" : value)}>
            <SelectTrigger id="giving-branch-filter" className="w-52" aria-label="Branch filter">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {(branchesQuery.data?.data ?? []).map((branch) => (
                <SelectItem key={branch.branchId} value={branch.branchId}>{branch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={profile?.branchId ?? "__no_branch__"} disabled>
            <SelectTrigger id="giving-branch-filter" className="w-52" aria-label="Branch filter locked to your branch">
              <SelectValue placeholder={profile?.branch?.name ?? "Your branch"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={profile?.branchId ?? "__no_branch__"}>{profile?.branch?.name ?? "Your branch"}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="This Month"
          value={summary ? `${summary.monthTotal.toLocaleString()}` : "..."}
          icon={<HandCoins className="h-4 w-4" />}
        />
        <StatsCard
          title="All-Time Total"
          value={summary ? `${summary.allTimeTotal.toLocaleString()}` : "..."}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatsCard
          title="Gifts This Month"
          value={monthQuery.data?.meta.total ?? 0}
          icon={<CalendarRange className="h-4 w-4" />}
        />
        <StatsCard
          title="All Transactions"
          value={recentQuery.data?.meta.total ?? 0}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Giving Trend</CardTitle>
            <CardDescription>Successful gifts over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {!summary ? (
              <Skeleton className="h-64 w-full" />
            ) : !hasTrend ? (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No giving recorded in this period.
              </div>
            ) : (
              <ChartContainer config={trendConfig} className="h-64 w-full">
                <AreaChart data={summary?.trend ?? []} margin={{ left: -8, right: 8 }}>
                  <defs>
                    <linearGradient id="fillGiven" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(v: string) => format(new Date(v), "MMM d")}
                  />
                  <ChartTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={<ChartTooltipContent />}
                  />
                  <Area
                    dataKey="total"
                    type="monotone"
                    stroke="var(--color-total)"
                    strokeWidth={2}
                    fill="url(#fillGiven)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Gifts</CardTitle>
              <CardDescription>Latest recorded transactions.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/giving/records">
                View all
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (recentQuery.data?.data ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No transactions yet.
              </p>
            ) : (
              (recentQuery.data?.data ?? []).map((tx) => (
                <div
                  key={tx.transactionId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.memberName || tx.serviceName || tx.eventName || "General giving"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tx.categoryName} ·{" "}
                      {format(new Date(tx.createdAt), "MMM d")}
                      {tx.receiptNumber ? ` · ${tx.receiptNumber}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium">
                      {tx.currency} {tx.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant={
                        tx.status === "success"
                          ? "default"
                          : tx.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <RecordCashDialog open={recordOpen} onOpenChange={setRecordOpen} />
    </div>
  );
}
