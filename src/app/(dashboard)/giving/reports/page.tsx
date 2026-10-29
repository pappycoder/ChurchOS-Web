"use client";
import * as React from "react";
import { format } from "date-fns";
import { CalendarRange } from "lucide-react";
import {
  GivingWorkspace,
  GivingHeader,
  givingMoney,
} from "@/components/giving/giving-presentation";
import { GivingChartCard } from "@/components/giving/giving-chart-card";
import { GivingCategoryBars } from "@/components/giving/giving-category-bars";
import {
  DashboardDonut,
  DashboardTrend,
  dashboardColors,
} from "@/components/dashboard/dashboard-plots";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { BranchFilter } from "@/components/shared/branch-filter";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { givingExportColumns, givingExportRows } from "@/lib/giving-export";
import { getToastErrorMessage } from "@/lib/toast";
import { useGivingTransactionsAll } from "@/hooks/use-giving";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
export default function GivingReportsPage() {
  const { data: profile } = useCurrentProfile();
  const { can, ready } = usePermissions();
  const [branchId, setBranchId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const effectiveBranchId = profile?.isAdminHq
    ? branchId
    : (profile?.branchId ?? "");
  const query = useGivingTransactionsAll({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    branchId: effectiveBranchId || undefined,
  });
  const rows = query.data;
  const [currencyFilter, setCurrencyFilter] = React.useState("");
  const currencies = [
    ...new Set((rows ?? []).map((row) => row.currency)),
  ].sort();
  const currency = currencies.includes(currencyFilter)
    ? currencyFilter
    : (currencies[0] ?? "NGN");
  const reportRows = React.useMemo(
    () => (rows ?? []).filter((row) => row.currency === currency),
    [rows, currency],
  );
  const report = React.useMemo(() => {
    const category = new Map<string, number>(),
      method = new Map<string, number>(),
      days = new Map<string, number>();
    let total = 0;
    for (const row of reportRows) {
      total += row.amount;
      const name = row.categoryName || "Uncategorized";
      category.set(name, (category.get(name) ?? 0) + row.amount);
      const payment = (
        row.paymentMethod ||
        row.type ||
        "Not supplied"
      ).replaceAll("_", " ");
      method.set(payment, (method.get(payment) ?? 0) + row.amount);
      const date = (row.givingDate || row.createdAt).slice(0, 10);
      days.set(date, (days.get(date) ?? 0) + row.amount);
    }
    return {
      total,
      byCategory: [...category]
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      byMethod: [...method].map(([name, value]) => ({ name, value })),
      trend: [...days]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({ date, total })),
    };
  }, [reportRows]);
  const exportData = React.useMemo(
    () => givingExportRows(reportRows),
    [reportRows],
  );
  return (
    <GivingWorkspace>
      <GivingHeader
        title="Reports"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Giving", href: "/giving" },
          { label: "Reports" },
        ]}
      />
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-0">
          <span className="flex items-center gap-1.5 self-center text-xs font-medium">
            <CalendarRange className="size-4 text-muted-foreground" />
            Range
          </span>
          <div className="flex w-full min-w-0 items-center gap-1 sm:w-auto sm:gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="min-w-0 flex-1 sm:w-40 sm:flex-none"
              aria-label="Start date"
            />
            <span className="self-center text-xs text-muted-foreground">
              to
            </span>
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="min-w-0 flex-1 sm:w-40 sm:flex-none"
              aria-label="End date"
            />
          </div>
          <BranchFilter value={branchId} onChange={setBranchId} />
          <Select value={currency} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="w-28" aria-label="Giving report currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(currencies.length ? currencies : ["NGN"]).map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <p className="self-center text-xs text-muted-foreground">
            Successful transactions only. Leave dates empty for all time.
          </p>
        </CardContent>
      </Card>
      {ready && !can("giving:records", "read") ? (
        <p className="rounded-xl border p-5 text-sm text-muted-foreground">
          Giving records access is required to load this report.
        </p>
      ) : query.error ? (
        <ErrorState
          title="Failed to load giving reports."
          description={getToastErrorMessage(
            query.error,
            "Please try again or narrow the date range.",
          )}
          onRetry={() => {
            void query.refetch();
          }}
          retrying={query.isFetching}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {query.isLoading
                ? "Loading successful gifts…"
                : `${givingMoney(currency, report.total)} · ${reportRows.length.toLocaleString()} successful gifts`}{" "}
              · {startDate || endDate ? "Selected range" : "All time"}
            </p>
            <ExportDropdown
              columns={givingExportColumns}
              data={exportData}
              fetchAllRows={async () => exportData}
              title={`Giving Report — ${currency}${startDate || endDate ? ` (${startDate || "start"} → ${endDate || "now"})` : ""}`}
              filename={`giving-report-${format(new Date(), "yyyyMMdd")}`}
              disabled={!rows || reportRows.length === 0}
            />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <GivingChartCard
              title="Giving trend"
              description={`Daily successful giving · ${currency}`}
              query={query}
              className="lg:col-span-2"
            >
              <DashboardTrend
                data={report.trend}
                colors={[dashboardColors[0]]}
                formatValue={(value) => givingMoney(currency, value)}
                showValueAxis
              />
            </GivingChartCard>
            <GivingChartCard
              title="By method"
              description={`Share of successful giving amounts · ${currency}`}
              query={query}
              tone="teal"
            >
              <DashboardDonut
                data={report.byMethod}
                valueLabel={`Given (${currency})`}
                formatValue={(value) => givingMoney(currency, value)}
              />
            </GivingChartCard>
            <GivingChartCard
              title="By Category"
              description={`All successful giving categories in range · ${currency}`}
              query={query}
              tone="violet"
              className="lg:col-span-3"
            >
              <GivingCategoryBars
                data={report.byCategory}
                currency={currency}
              />
            </GivingChartCard>
          </div>
        </>
      )}
    </GivingWorkspace>
  );
}
