"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck2,
  TrendingUp,
  Users,
} from "lucide-react";
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
import { useAttendanceReport } from "@/hooks/use-reports";
import { useBranchesList } from "@/hooks/use-branches";
import { exportCSV } from "@/lib/export-utils";

export default function ReportsAttendancePage() {
  const [range, setRange] = React.useState<ReportRange>({ startDate: "", endDate: "" });
  const [branchId, setBranchId] = React.useState<string>("");

  const reportQuery = useAttendanceReport({
    startDate: range.startDate || undefined,
    endDate: range.endDate || undefined,
    branchId: branchId || undefined,
  });
  const branchesQuery = useBranchesList({ limit: 100 });

  const report = reportQuery.data;

  const handleExport = () => {
    if (!report) return;
    const rows: Record<string, unknown>[] = [
      { name: "Grand Total", total: report.totalAttendance, serviceCount: report.serviceCount },
      ...report.byService.map((s) => ({
        name: s.name,
        total: s.total,
        serviceCount: s.serviceCount,
      })),
    ];
    exportCSV(
      rows,
      [
        { key: "name", label: "Service" },
        { key: "total", label: "Check-ins" },
        { key: "serviceCount", label: "Services" },
      ],
      `attendance-report-${format(new Date(), "yyyyMMdd")}`
    );
  };

  if (reportQuery.error) {
    return (
      <div>
        <PageHeader
          title="Attendance Report"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Reports", href: "/reports" },
            { label: "Attendance" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load the attendance report.</p>
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
        title="Attendance Report"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Reports", href: "/reports" },
          { label: "Attendance" },
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
          title="Total Attendance"
          value={report?.totalAttendance ?? (reportQuery.isLoading ? "..." : "—")}
          icon={<Users className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Services Held"
          value={report?.serviceCount ?? (reportQuery.isLoading ? "..." : "—")}
          icon={<CalendarCheck2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Average / Service"
          value={
            report
              ? report.averagePerService.toLocaleString("en-NG", {
                  maximumFractionDigits: 1,
                })
              : reportQuery.isLoading
                ? "..."
                : "—"
          }
          icon={<TrendingUp className="h-4 w-4" />}
          subtitle="Checked-in people per service"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* By service */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Service</CardTitle>
            <CardDescription>Check-ins per service type.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              items={(report?.byService ?? []).map((s) => ({
                name: s.name,
                value: s.total,
                count: s.serviceCount,
              }))}
              labelSuffix={(item) =>
                `${item.count} ${item.count === 1 ? "service" : "services"}`
              }
            />
          </CardContent>
        </Card>

        {/* Monthly trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
            <CardDescription>Check-ins by month.</CardDescription>
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