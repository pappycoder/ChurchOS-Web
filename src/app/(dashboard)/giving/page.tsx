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
  useGivingTransactions,
  type GivingTransaction,
} from "@/hooks/use-giving";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import { api } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { RecordCashDialog } from "@/components/giving/record-cash-dialog";

const trendConfig = {
  total: { label: "Given", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function GivingDashboardPage() {
  const { can } = usePermissions();
  const canCreate = can("giving", "create");

  const [recordOpen, setRecordOpen] = React.useState(false);

  const recentQuery = useGivingTransactions({ limit: 8 });

  // Totals derived from paged success transactions (works for any
  // giving:read holder — the analytics endpoint is role-restricted).
  const monthStart = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  const monthQuery = useGivingTransactions({
    status: "success",
    startDate: monthStart,
    limit: 100,
  });

  const monthTotal = React.useMemo(
    () =>
      fetchAllPages<GivingTransaction>((p) =>
        api.get(listUrl("/giving/transactions", {
          status: "success",
          startDate: monthStart,
          page: p,
          limit: 200,
        }))
      ).then((rows) => rows.reduce((sum, t) => sum + t.amount, 0)),
    [monthStart]
  );

  const allTimeTotal = React.useMemo(
    () =>
      fetchAllPages<GivingTransaction>((p) =>
        api.get(listUrl("/giving/transactions", { status: "success", page: p, limit: 200 }))
      ).then((rows) => rows.reduce((sum, t) => sum + t.amount, 0)),
    []
  );

  const [totals, setTotals] = React.useState<{ month: number; allTime: number } | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    Promise.all([monthTotal, allTimeTotal]).then(([month, allTime]) => {
      if (!cancelled) setTotals({ month, allTime });
    });
    return () => {
      cancelled = true;
    };
  }, [monthTotal, allTimeTotal]);

  // 30-day trend derived from paged success transactions.
  const [chartRows, setChartRows] = React.useState<{ date: string; total: number }[]>([]);
  const chartConfig = trendConfig;
  React.useEffect(() => {
    let cancelled = false;
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 30);
    fetchAllPages<GivingTransaction>((p) =>
      api.get(
        listUrl("/giving/transactions", {
          status: "success",
          page: p,
          limit: 200,
        })
      )
    )
      .then((rows) => {
        if (cancelled) return;
        const grouped = new Map<string, number>();
        for (const t of rows) {
          const d = new Date(t.createdAt);
          if (d < windowStart) continue;
          const key = d.toISOString().slice(0, 10);
          grouped.set(key, (grouped.get(key) ?? 0) + t.amount);
        }
        setChartRows(
          Array.from(grouped.entries())
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date))
        );
      })
      .catch(() => setChartRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="This Month"
          value={totals ? `${totals.month.toLocaleString()}` : "..."}
          icon={<HandCoins className="h-4 w-4" />}
        />
        <StatsCard
          title="All-Time Total"
          value={totals ? `${totals.allTime.toLocaleString()}` : "..."}
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
            {!totals ? (
              <Skeleton className="h-64 w-full" />
            ) : chartRows.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No giving recorded in this period.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <AreaChart data={chartRows} margin={{ left: -8, right: 8 }}>
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
