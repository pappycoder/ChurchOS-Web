"use client";

import * as React from "react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { AlertTriangle, CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";

const categoryConfig = {
  amount: { label: "Amount", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function GivingReportsPage() {
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const listQuery = useGivingTransactions({
    status: "success",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 100,
  });

  // Everything below derives from a fetch-all of successful gifts in range.
  const [rows, setRows] = React.useState<GivingTransaction[] | null>(null);
  const [loadingRows, setLoadingRows] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    setLoadingRows(true);
    fetchAllPages<GivingTransaction>((p) =>
      api.get(
        listUrl("/giving/transactions", {
          status: "success",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: p,
          limit: 200,
        })
      )
    )
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoadingRows(false));
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  const totalAmount = React.useMemo(
    () => (rows ?? []).reduce((sum, t) => sum + t.amount, 0),
    [rows]
  );

  const byCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of rows ?? []) {
      map.set(t.categoryName, (map.get(t.categoryName) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [rows]);

  const byMethod = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of rows ?? []) {
      const key = t.type.replace("_", " ");
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [rows]);

  const exportData = React.useMemo(
    () =>
      (rows ?? []).map((t) => ({
        date: format(new Date(t.createdAt), "yyyy-MM-dd"),
        name: t.memberName || "",
        linkedTo: t.serviceName || t.eventName || "General",
        category: t.categoryName,
        amount: t.amount,
        currency: t.currency,
        method: t.type.replace("_", " "),
        receiptNumber: t.receiptNumber || "",
      })),
    [rows]
  );

  if (listQuery.error) {
    return (
      <div>
        <PageHeader
          title="Reports"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Giving", href: "/giving" },
            { label: "Reports" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load giving reports.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Giving", href: "/giving" },
          { label: "Reports" },
        ]}
        action={
          <ExportDropdown
            columns={[
              { key: "date", label: "Date" },
              { key: "name", label: "Name" },
              { key: "linkedTo", label: "Linked To" },
              { key: "category", label: "Category" },
              { key: "amount", label: "Amount" },
              { key: "currency", label: "Currency" },
              { key: "method", label: "Method" },
              { key: "receiptNumber", label: "Receipt #" },
            ]}
            data={exportData}
            fetchAllRows={async () => exportData}
            title={`Giving Report${startDate || endDate ? ` (${startDate || "start"} → ${endDate || "now"})` : ""}`}
            filename={`giving-report-${format(new Date(), "yyyyMMdd")}`}
            disabled={!rows || rows.length === 0}
          />
        }
      />

      {/* Date range */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Range</span>
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
            aria-label="Start date"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
            aria-label="End date"
          />
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear
            </Button>
          )}
          <p className="text-xs text-muted-foreground ml-auto">
            Successful transactions only.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Given"
          value={loadingRows ? "..." : totalAmount.toLocaleString()}
          icon={<AlertTriangle className="h-4 w-4 hidden" />}
        />
        <StatsCard title="Gifts" value={rows?.length ?? 0} icon={<CalendarRange className="h-4 w-4" />} />
        <StatsCard
          title="Categories Touched"
          value={byCategory.length}
          icon={<CalendarRange className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* By category */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Category</CardTitle>
            <CardDescription>Amount per giving category in range.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRows ? (
              <Skeleton className="h-64 w-full" />
            ) : byCategory.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No giving in the selected range.
              </div>
            ) : (
              <ChartContainer config={categoryConfig} className="h-64 w-full">
                <BarChart data={byCategory} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 3, 3, 0]} barSize={16} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* By method */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Method</CardTitle>
            <CardDescription>How gifts were given.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {byMethod.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              byMethod.map((m) => (
                <div key={m.name} className="flex items-center justify-between py-2.5 capitalize">
                  <span className="text-sm text-muted-foreground">{m.name}</span>
                  <span className="text-sm font-medium">{m.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
