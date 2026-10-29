"use client";

import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { Banknote, ListOrdered, Repeat, Ratio } from "lucide-react";
import { WorkspaceHeader as PageHeader } from "@/components/workspace/workspace-presentation";
import { SummaryMetric as StatsCard } from "@/components/workspace/workspace-presentation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ReportDateRange,
  type ReportRange,
} from "@/components/reports/report-date-range";
import { BarsChart } from "@/components/analytics/bars-chart";
import { BreakdownBars } from "@/components/reports/breakdown-bars";
import {
  AnalyticsTrendChart,
  AnalyticsBars,
} from "@/components/analytics/analytics-charts";
import { useAnalyticsGiving } from "@/hooks/use-analytics";
import { useBranchesList } from "@/hooks/use-branches";
import { useCurrentProfile } from "@/hooks/use-profile";

export default function AnalyticsGivingPage() {
  const { data: profile } = useCurrentProfile();
  // HQ viewers (is_admin_hq) see every branch and may filter to any one; a
  // branch-scoped viewer is locked to their own branch (the backend enforces
  // this too — this just makes the UI honest about the scope being shown).
  const isHq = !!profile?.isAdminHq;
  const myBranchId = profile?.branchId;
  const myBranchName = profile?.branch?.name;

  const [range, setRange] = React.useState<ReportRange>({
    startDate: "",
    endDate: "",
  });
  const [currency, setCurrency] = React.useState("NGN");
  const formatNaira = (amount: number) =>
    `${currency} ${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
  const [branchId, setBranchId] = React.useState<string>("");

  // For HQ the selected branch (or "" = all) drives the query; for a branch
  // user the query is pinned to their own branch.
  const effectiveBranchId = isHq ? branchId : (myBranchId ?? "");

  const query = useAnalyticsGiving(
    {
      currency,
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined,
      branchId: effectiveBranchId || undefined,
    },
    // Wait for the profile so a branch user's first (and only) fetch already
    // carries their branch scope — no church-wide flash, no duplicate request.
    { enabled: !!profile },
  );
  const branchesQuery = useBranchesList({ limit: 100 }, { enabled: isHq });
  const data = query.data;
  const { isLoading: queryLoading } = query;
  // Treat the pre-profile window as loading so stats/charts show their pending
  // state instead of an empty "—" while the query is still gated.
  const loading = queryLoading || !profile;

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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 py-4">
          <ReportDateRange value={range} onChange={setRange} />
          <label className="space-y-2 text-sm font-medium">
            Currency
            <select
              aria-label="Analytics currency"
              className="ml-2 h-9 rounded-md border bg-background px-3"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {[
                "NGN",
                "USD",
                "GBP",
                "EUR",
                "GHS",
                "KES",
                "ZAR",
                "CAD",
                "AUD",
              ].map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Branch</Label>
            {isHq ? (
              <Select
                value={branchId}
                onValueChange={(v) => setBranchId(v === "all" ? "" : v)}
              >
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
            ) : (
              // Branch-scoped viewer: locked to their own branch (read-only).
              <Select value={myBranchId ?? "__self__"} disabled>
                <SelectTrigger
                  className="w-44 h-9"
                  aria-label="Branch filter (locked to your branch)"
                >
                  <SelectValue placeholder={myBranchName ?? "Your branch"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={myBranchId ?? "__self__"}>
                    {myBranchName ?? "Your branch"}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>
      {query.error ? (
        <ErrorState title="Failed to load giving analytics." />
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatsCard
              title="Total Giving"
              value={data ? formatNaira(data.total) : loading ? "..." : "—"}
              icon={<Banknote className="h-4 w-4" />}
              variant="primary"
            />
            <StatsCard
              title="Transactions"
              value={data?.count ?? (loading ? "..." : "—")}
              icon={<ListOrdered className="h-4 w-4" />}
            />
            <StatsCard
              title="Average Gift"
              value={data ? formatNaira(data.average) : loading ? "..." : "—"}
              icon={<Ratio className="h-4 w-4" />}
            />
          </div>

          {/* Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Giving Trend
              </CardTitle>
              <CardDescription>
                Total successful giving over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsTrendChart
                data={data?.trend ?? []}
                loading={loading}
                formatValue={formatNaira}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  By Category
                </CardTitle>
                <CardDescription>
                  Total giving per category ({currency}).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBars
                  colorful
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
                <CardTitle className="text-sm font-semibold">
                  Top Donors
                </CardTitle>
                <CardDescription>
                  Highest contributors in the range.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarsChart
                  data={(data?.topDonors ?? []).map((d) => ({
                    label: d.memberName,
                    value: d.total,
                  }))}
                  loading={loading}
                  formatValue={formatNaira}
                  color="var(--chart-3)"
                  height={240}
                />
                <BreakdownBars
                  colorful
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
                <CardTitle className="text-sm font-semibold">
                  By Transaction Type
                </CardTitle>
                <CardDescription>Total per payment type.</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsBars
                  data={(data?.byType ?? []).map((t) => ({
                    label: t.type,
                    value: t.total,
                  }))}
                  loading={loading}
                  formatValue={formatNaira}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Recurring Giving
                </CardTitle>
                <CardDescription>
                  Active schedules and projected monthly amount.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Repeat className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active schedules
                    </p>
                    <p className="text-xl font-semibold">
                      {data?.recurring.active ?? (loading ? "..." : "—")}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total scheduled per month
                  </p>
                  <p className="text-2xl font-semibold">
                    {data
                      ? formatNaira(data.recurring.totalMonthlyAmount)
                      : loading
                        ? "..."
                        : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total scheduled (all time)
                  </p>
                  <p className="text-2xl font-semibold">
                    {data
                      ? formatNaira(data.recurring.totalScheduled)
                      : loading
                        ? "..."
                        : "—"}
                  </p>
                </div>
                {Object.keys(byStatus).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      By status
                    </p>
                    <div
                      data-export-list
                      className="flex flex-wrap gap-x-6 gap-y-2"
                    >
                      {Object.entries(byStatus).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="capitalize text-muted-foreground">
                            {key}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {value.toLocaleString()}
                          </span>
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
