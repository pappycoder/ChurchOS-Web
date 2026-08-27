"use client";

import * as React from "react";
import { format } from "date-fns";
import { AlertTriangle, UserCheck, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ReportDateRange,
  type ReportRange,
} from "@/components/reports/report-date-range";
import { TrendChart } from "@/components/reports/trend-chart";
import { BreakdownBars } from "@/components/reports/breakdown-bars";
import { useMemberReport } from "@/hooks/use-reports";
import { exportCSV } from "@/lib/export-utils";

export default function ReportsMembersPage() {
  const [range, setRange] = React.useState<ReportRange>({ startDate: "", endDate: "" });

  const reportQuery = useMemberReport({
    startDate: range.startDate || undefined,
    endDate: range.endDate || undefined,
  });

  const report = reportQuery.data;

  const handleExport = () => {
    if (!report) return;
    const rows: Record<string, unknown>[] = [
      { name: "Total Members", count: report.totalMembers },
      { name: "New in Period", count: report.newMembersInPeriod },
      { name: "Active Members", count: report.activeMembers },
      ...report.byStatus.map((s) => ({ name: s.status, count: s.count })),
    ];
    exportCSV(
      rows,
      [
        { key: "name", label: "Status" },
        { key: "count", label: "Members" },
      ],
      `members-report-${format(new Date(), "yyyyMMdd")}`
    );
  };

  if (reportQuery.error) {
    return (
      <div>
        <PageHeader
          title="Members Report"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Reports", href: "/reports" },
            { label: "Members" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load the members report.</p>
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
        title="Members Report"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Reports", href: "/reports" },
          { label: "Members" },
        ]}
        action={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!report}>
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <ReportDateRange value={range} onChange={setRange} />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Members"
          value={report?.totalMembers ?? (reportQuery.isLoading ? "..." : "—")}
          icon={<Users className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="New in Period"
          value={
            report?.newMembersInPeriod ?? (reportQuery.isLoading ? "..." : "—")
          }
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Members"
          value={report?.activeMembers ?? (reportQuery.isLoading ? "..." : "—")}
          icon={<UserCheck className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* By status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Status</CardTitle>
            <CardDescription>Members grouped by member status.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              items={(report?.byStatus ?? []).map((s) => ({
                name: s.status,
                value: s.count,
              }))}
            />
          </CardContent>
        </Card>

        {/* By gender */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Gender</CardTitle>
            <CardDescription>Members grouped by gender.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              items={(report?.byGender ?? []).map((g) => ({
                name: g.gender,
                value: g.count,
              }))}
            />
          </CardContent>
        </Card>

        {/* Monthly growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Growth</CardTitle>
            <CardDescription>New members added by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={report?.monthlyGrowth ?? []}
              loading={reportQuery.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}