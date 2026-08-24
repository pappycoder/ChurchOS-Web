"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import { AlertTriangle, CalendarRange, PieChart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
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
  useAttendanceSummary,
  useAttendanceTrends,
  useAttendanceRecords,
  SERVICE_CATEGORIES,
  type AttendanceRecord,
} from "@/hooks/use-attendance";

const trendConfig = {
  total: { label: "Check-ins", color: "var(--chart-1)" },
  members: { label: "Members", color: "var(--chart-2)" },
  visitors: { label: "Visitors", color: "var(--chart-3)" },
} satisfies ChartConfig;

const serviceConfig = {
  count: { label: "Check-ins", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function AttendanceReportsPage() {
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const summaryQuery = useAttendanceSummary({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const trendsQuery = useAttendanceTrends({
    days: 30,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const recordsQuery = useAttendanceRecords({
    limit: 200,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const summary = summaryQuery.data;

  // Per-service counts derived client-side over the fetched window.
  const byService = React.useMemo(() => {
    const rows = recordsQuery.data?.data ?? [];
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = r.serviceName || "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [recordsQuery.data]);

  const buildExportRows = React.useCallback(
    (rows: AttendanceRecord[]) =>
      rows.map((r) => ({
        date: format(new Date(r.checkInAt), "yyyy-MM-dd"),
        time: format(new Date(r.checkInAt), "HH:mm"),
        name: r.memberName || r.visitorName || "",
        type: r.memberId ? "Member" : "Visitor",
        service: r.serviceName || "",
        category:
          SERVICE_CATEGORIES.find((c) => c.value === (r.category ?? "adult"))?.label ??
          "Adult",
        source: r.source,
      })),
    []
  );
  const exportData = React.useMemo(
    () => buildExportRows(recordsQuery.data?.data ?? []),
    [recordsQuery.data, buildExportRows]
  );

  // Export walks every page of the selected range server-side.
  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<AttendanceRecord>((p) =>
      api.get(
        listUrl("/attendance", {
          page: p,
          limit: 200,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        })
      )
    );
    return buildExportRows(rows);
  }, [startDate, endDate, buildExportRows]);

  if (summaryQuery.error || trendsQuery.error) {
    return (
      <div>
        <PageHeader
          title="Reports"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Attendance", href: "/attendance" },
            { label: "Reports" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load reports.</p>
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
          { label: "Attendance", href: "/attendance" },
          { label: "Reports" },
        ]}
        action={
          <ExportDropdown
            columns={[
              { key: "date", label: "Date" },
              { key: "time", label: "Time" },
              { key: "name", label: "Name" },
              { key: "type", label: "Type" },
              { key: "service", label: "Service" },
              { key: "category", label: "Category" },
              { key: "source", label: "Source" },
            ]}
            data={exportData}
            fetchAllRows={fetchAllExportRows}
            title="Attendance Report"
            filename={`attendance-report-${format(new Date(), "yyyyMMdd")}`}
            disabled={exportData.length === 0}
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
            Leave empty for all-time totals.
          </p>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Check-Ins"
          value={summary?.totalCheckIns ?? 0}
          icon={<PieChart className="h-4 w-4" />}
        />
        <StatsCard title="Members" value={summary?.memberCheckIns ?? 0} icon={<PieChart className="h-4 w-4" />} />
        <StatsCard title="Visitors" value={summary?.visitorCheckIns ?? 0} icon={<PieChart className="h-4 w-4" />} />
        <StatsCard title="Adults" value={summary?.byCategory?.adult ?? 0} icon={<PieChart className="h-4 w-4" />} />
        <StatsCard title="Children" value={summary?.byCategory?.children ?? 0} icon={<PieChart className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Daily Trend {startDate || endDate ? "(selected range)" : "(last 30 days)"}
            </CardTitle>
            <CardDescription>Members vs visitors over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (trendsQuery.data ?? []).length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No data in this period.
              </div>
            ) : (
              <ChartContainer config={trendConfig} className="h-64 w-full">
                <BarChart data={trendsQuery.data ?? []} margin={{ left: -16 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(v: string) => format(new Date(v), "MMM d")}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="members" stackId="a" fill="var(--color-members)" radius={[0, 0, 0, 0]} />
                  <Bar
                    dataKey="visitors"
                    stackId="a"
                    fill="var(--color-visitors)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* By service */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Service</CardTitle>
            <CardDescription>Top services in the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            {recordsQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : byService.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No check-ins in the selected range.
              </div>
            ) : (
              <ChartContainer config={serviceConfig} className="h-64 w-full">
                <BarChart data={byService} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 3, 3, 0]} barSize={16} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gender + source breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Gender Split</CardTitle>
            <CardDescription>
              Derived from linked member and visitor records.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {[
              ["Male", summary?.byGender?.male ?? 0],
              ["Female", summary?.byGender?.female ?? 0],
              ["Unknown", summary?.byGender?.unknown ?? 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Source</CardTitle>
            <CardDescription>How people checked in.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {Object.entries(summary?.bySource ?? {}).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              Object.entries(summary?.bySource ?? {}).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-muted-foreground capitalize">{source}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
