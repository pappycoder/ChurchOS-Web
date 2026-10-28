"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarRange } from "lucide-react";
import { UrlTabs } from "@/components/shared/url-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralAttendancePanel } from "@/components/attendance/general-attendance-panel";
import { GeneralAttendanceReportSummary } from "@/components/attendance/general-attendance-summary";
import {
  attendanceBreakdown,
  AttendanceWorkspace,
  AttendanceHeader,
  attendanceWorkspaceClass,
} from "@/components/attendance/attendance-presentation";
import { AttendanceChartCard } from "@/components/attendance/attendance-chart-card";
import {
  DashboardBars,
  DashboardDonut,
  DashboardTrend,
  dashboardColors,
} from "@/components/dashboard/dashboard-plots";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchFilter } from "@/components/shared/branch-filter";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useAttendanceSummary,
  useAttendanceTrends,
  useAttendanceRecords,
  ATTENDANCE_CATEGORIES,
  type AttendanceRecord,
} from "@/hooks/use-attendance";

export default function AttendanceReportsPage() {
  const { can } = usePermissions();
  const showSummary = can("attendance:dashboard", "read");
  const showRecords = can("attendance:records", "read");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [branchId, setBranchId] = React.useState("");
  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    branchId: branchId || undefined,
  };
  const summaryQuery = useAttendanceSummary(filters);
  const trendsQuery = useAttendanceTrends({ days: 30, ...filters });
  const recordsQuery = useAttendanceRecords({ limit: 200, ...filters });
  const summary = summaryQuery.data;
  const byService = React.useMemo(() => {
    const totals = new Map<string, number>();
    for (const row of recordsQuery.data?.data ?? []) {
      const name = row.serviceName || "Unknown";
      totals.set(name, (totals.get(name) ?? 0) + 1);
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  }, [recordsQuery.data]);
  const buildExportRows = React.useCallback(
    (rows: AttendanceRecord[]) =>
      rows.map((row) => ({
        date: format(new Date(row.checkInAt), "yyyy-MM-dd"),
        time: format(new Date(row.checkInAt), "HH:mm"),
        name: row.memberName || row.visitorName || "",
        type: row.memberId ? "Member" : "Visitor",
        service: row.serviceName || "",
        category:
          ATTENDANCE_CATEGORIES.find(
            (category) => category.value === (row.category ?? "adult"),
          )?.label ?? "Adult",
        source: row.source,
      })),
    [],
  );
  const exportData = React.useMemo(
    () => buildExportRows(recordsQuery.data?.data ?? []),
    [recordsQuery.data, buildExportRows],
  );
  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<AttendanceRecord>((page) =>
      api.get(
        listUrl("/attendance", {
          page,
          limit: 200,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          branchId: branchId || undefined,
        }),
      ),
    );
    return buildExportRows(rows);
  }, [startDate, endDate, branchId, buildExportRows]);
  return (
    <AttendanceWorkspace>
      <AttendanceHeader
        title="Reports"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Attendance", href: "/attendance" },
          { label: "Reports" },
        ]}
      />
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-0">
          <BranchFilter value={branchId} onChange={setBranchId} />
          <span className="flex items-center gap-1.5 self-center text-xs font-medium">
            <CalendarRange className="size-4 text-muted-foreground" />
            Range
          </span>
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-40"
            aria-label="Start date"
          />
          <span className="self-center text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
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
          <p className="self-center text-xs text-muted-foreground">
            Leave empty for all-time totals.
          </p>
        </CardContent>
      </Card>
      <UrlTabs defaultValue="named" values={["named", "totals"]}>
        <TabsList aria-label="Attendance report">
          <TabsTrigger value="named">Named check-ins</TabsTrigger>
          <TabsTrigger value="totals">Reported headcounts</TabsTrigger>
        </TabsList>
        <TabsContent
          value="named"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {showSummary && (
              <p className="text-xs text-muted-foreground">
                Named check-ins ·{" "}
                {startDate || endDate ? "Selected range" : "All time"}:{" "}
                {summaryQuery.error
                  ? "Unavailable"
                  : summaryQuery.isLoading
                    ? "Loading…"
                    : (summary?.totalCheckIns.toLocaleString() ?? "—")}
              </p>
            )}
            {showRecords && (
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
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AttendanceChartCard
              title="Daily trend"
              description={
                startDate || endDate
                  ? "Members vs visitors · selected range"
                  : "Members vs visitors · last 30 days"
              }
              query={trendsQuery}
              className="sm:col-span-2"
            >
              <DashboardTrend
                data={trendsQuery.data ?? []}
                colors={[dashboardColors[0], dashboardColors[2]]}
                split
              />
            </AttendanceChartCard>
            {showSummary && (
              <>
                <AttendanceChartCard
                  title="Members & visitors"
                  description="Named check-ins in the selected scope"
                  query={summaryQuery}
                  tone="violet"
                >
                  <DashboardDonut
                    data={
                      summary
                        ? [
                            { name: "Members", value: summary.memberCheckIns },
                            {
                              name: "Visitors",
                              value: summary.visitorCheckIns,
                            },
                          ]
                        : []
                    }
                  />
                </AttendanceChartCard>
                <AttendanceChartCard
                  title="Attendance categories"
                  description="Complete named-check-in summary"
                  query={summaryQuery}
                  tone="amber"
                >
                  <DashboardBars
                    data={attendanceBreakdown(summary?.byCategory)}
                    colors={[
                      dashboardColors[3],
                      dashboardColors[5],
                      dashboardColors[1],
                    ]}
                  />
                </AttendanceChartCard>
                <AttendanceChartCard
                  title="Gender split"
                  description="Includes unknown linked demographics"
                  query={summaryQuery}
                  tone="pink"
                >
                  <DashboardBars
                    data={attendanceBreakdown(summary?.byGender)}
                    colors={[
                      dashboardColors[0],
                      dashboardColors[2],
                      dashboardColors[1],
                    ]}
                  />
                </AttendanceChartCard>
                <AttendanceChartCard
                  title="By source"
                  description="How people checked in"
                  query={summaryQuery}
                  tone="teal"
                >
                  <DashboardBars
                    data={attendanceBreakdown(summary?.bySource)}
                    colors={[
                      dashboardColors[4],
                      dashboardColors[1],
                      dashboardColors[3],
                    ]}
                  />
                </AttendanceChartCard>
              </>
            )}
          </div>
          {showRecords && (
            <AttendanceChartCard
              title="By service (loaded check-ins)"
              description={`Covers ${recordsQuery.data?.data.length ?? 0} loaded check-ins (up to 200). Export retrieves all matching records.`}
              query={recordsQuery}
              tone="violet"
            >
              <DashboardBars data={byService} colors={dashboardColors} />
            </AttendanceChartCard>
          )}
        </TabsContent>
        <TabsContent
          value="totals"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <GeneralAttendanceReportSummary charts filters={filters} />
          <GeneralAttendancePanel
            presentationClassName={attendanceWorkspaceClass}
            readOnly
            filters={filters}
          />
        </TabsContent>
      </UrlTabs>
    </AttendanceWorkspace>
  );
}
