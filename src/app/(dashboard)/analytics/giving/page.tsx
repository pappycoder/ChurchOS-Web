"use client";

import * as React from "react";
import { AlertTriangle, Banknote, ListOrdered, Repeat, Ratio } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ReportDateRange,
  type ReportRange,
} from "@/components/reports/report-date-range";
import { BreakdownBars } from "@/components/reports/breakdown-bars";
import { AnalyticsTrendChart, AnalyticsBars } from "@/components/analytics/analytics-charts";
import { BarsChart } from "@/components/analytics/bars-chart";
import { useAnalyticsGiving, formatNaira } from "@/hooks/use-analytics";
import { useBranchesList } from "@/hooks/use-branches";

export default function AnalyticsGivingPage() {
  const [range, setRange] = React.useState<ReportRange>({ startDate: "", endDate: "" });
  const [branchId, setBranchId] = React.useState<string>("");

  const query = useAnalyticsGiving({
    startDate: range.startDate || undefined,
    endDate: range.endDate || undefined,
    branchId: branchId || undefined,
  });
  const branchesQuery = useBranchesList({ limit: 100 });
  const data = query.data;

  const byStatus = data?.byStatus ?? {};

  return (
    <div className="space-y-4">
      <PageHeader
        title="Giving Analytics"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Analytics" },
          { label: "Giving" },
        ]}
        action={
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isLoading}>
            Refresh
          </Button>
        }
      />

      {query.error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load giving analytics.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="flex flex-wrap items-end gap-4 py-4">
              <ReportDateRange value={range} onChange={setRange} />
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Branch</Label>
                <Select value={branchId} onValueChange={(v) => setBranchId(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-44 h-9" aria-label="Branch filter">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {(branchesQuery.data?.data ?? []).map((b) => (
                      <SelectItem key={b.branchId} value={b.branchId}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatsCard
              title="Total Giving"
              value={data ? formatNaira(data.total) : query.isLoading ? "..." : "—"}
              icon={<Banknote className="h-4 w-4" />}
              variant="primary"
            />
            <StatsCard
              title="Transactions"
              value={data?.count ?? (query.isLoading ? "..." : "—")}
              icon={<ListOrdered className="h-4 w-4" />}
            />
            <StatsCard
              title="Average Gift"
              value={data ? formatNaira(data.average) : query.isLoading ? "..." : "—"}
              icon={<Ratio className="h-4 w-4" />}
            />
          </div>

          {/* Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Giving Trend</CardTitle>
              <CardDescription>Total successful giving over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsTrendChart data={data?.trend ?? []} loading={query.isLoading} formatValue={formatNaira} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Category</CardTitle>
                <CardDescription>Total giving per category (₦).</CardDescription>
              </CardHeader>
              <CardContent>
                <BarsChart
                  data={(data?.byCategory ?? []).map((c) => ({
                    label: c.categoryName,
                    value: c.total,
                  }))}
                  loading={query.isLoading}
                  formatValue={formatNaira}
                  color="var(--chart-1)"
                  height={240}
                />
                <BreakdownBars
                  items={(data?.byCategory ?? []).map((c) => ({
                    name: c.categoryName,
                    value: c.total,
                    count: c.count,
                  }))}
                  labelSuffix={(item) => `${item.count} txns`}
                  formatValue={formatNaira}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top Donors</CardTitle>
                <CardDescription>Highest contributors in the range.</CardDescription>
              </CardHeader>
              <CardContent>
                <BarsChart
                  data={(data?.topDonors ?? []).map((d) => ({
                    label: d.memberName,
                    value: d.total,
                  }))}
                  loading={query.isLoading}
                  formatValue={formatNaira}
                  color="var(--chart-3)"
                  height={240}
                />
                <BreakdownBars
                  items={(data?.topDonors ?? []).map((d) => ({
                    name: d.memberName,
                    value: d.total,
                    count: d.count,
                  }))}
                  labelSuffix={(item) => `${item.count} gifts`}
                  formatValue={formatNaira}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Transaction Type</CardTitle>
                <CardDescription>Total per payment type.</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsBars
                  data={(data?.byType ?? []).map((t) => ({ label: t.type, value: t.total }))}
                  loading={query.isLoading}
                  formatValue={formatNaira}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Recurring Giving</CardTitle>
                <CardDescription>Active schedules and projected monthly amount.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Repeat className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active schedules</p>
                    <p className="text-xl font-semibold">
                      {data?.recurring.active ?? (query.isLoading ? "..." : "—")}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total scheduled per month</p>
                  <p className="text-2xl font-semibold">
                    {data ? formatNaira(data.recurring.totalMonthlyAmount) : query.isLoading ? "..." : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total scheduled (all time)</p>
                  <p className="text-2xl font-semibold">
                    {data ? formatNaira(data.recurring.totalScheduled) : query.isLoading ? "..." : "—"}
                  </p>
                </div>
                {Object.keys(byStatus).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">By status</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {Object.entries(byStatus).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="capitalize text-muted-foreground">{key}</span>
                          <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
