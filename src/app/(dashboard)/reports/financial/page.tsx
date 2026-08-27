"use client";

import * as React from "react";
import { format } from "date-fns";
import { AlertTriangle, Calculator, ListOrdered, Wallet } from "lucide-react";
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
import { TrendChart } from "@/components/reports/trend-chart";
import { BreakdownBars } from "@/components/reports/breakdown-bars";
import { useFinancialReport } from "@/hooks/use-reports";
import { useBranchesList } from "@/hooks/use-branches";
import { exportCSV } from "@/lib/export-utils";

function formatNaira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

export default function ReportsFinancialPage() {
  const [range, setRange] = React.useState<ReportRange>({ startDate: "", endDate: "" });
  const [branchId, setBranchId] = React.useState<string>("");

  const reportQuery = useFinancialReport({
    startDate: range.startDate || undefined,
    endDate: range.endDate || undefined,
    branchId: branchId || undefined,
  });
  const branchesQuery = useBranchesList({ limit: 100 });

  const report = reportQuery.data;

  const handleExport = () => {
    if (!report) return;
    const rows: Record<string, unknown>[] = [
      { name: "Grand Total", total: report.grandTotal, count: report.transactionCount },
      ...report.byCategory.map((c) => ({ name: c.name, total: c.total, count: c.count })),
    ];
    exportCSV(
      rows,
      [
        { key: "name", label: "Category" },
        { key: "total", label: "Total" },
        { key: "count", label: "Transactions" },
      ],
      `financial-report-${format(new Date(), "yyyyMMdd")}`
    );
  };

  if (reportQuery.error) {
    return (
      <div>
        <PageHeader
          title="Financial Report"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Reports", href: "/reports" },
            { label: "Financial" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load the financial report.</p>
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
        title="Financial Report"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Reports", href: "/reports" },
          { label: "Financial" },
        ]}
        action={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!report}>
            Export CSV
          </Button>
        }
      />

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
          title="Grand Total"
          value={report ? formatNaira(report.grandTotal) : reportQuery.isLoading ? "..." : "—"}
          icon={<Wallet className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Transactions"
          value={report?.transactionCount ?? (reportQuery.isLoading ? "..." : "—")}
          icon={<ListOrdered className="h-4 w-4" />}
        />
        <StatsCard
          title="Average Gift"
          value={report ? formatNaira(report.averageAmount) : reportQuery.isLoading ? "..." : "—"}
          icon={<Calculator className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* By category */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Category</CardTitle>
            <CardDescription>Total and transactions per giving category.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              items={(report?.byCategory ?? []).map((c) => ({
                name: c.name,
                value: c.total,
                count: c.count,
              }))}
              labelSuffix={(item) => `${item.count} txns`}
              formatValue={formatNaira}
            />
          </CardContent>
        </Card>

        {/* Monthly trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
            <CardDescription>Giving totals by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={report?.monthlyTrend ?? []}
              loading={reportQuery.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}