"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import {
  CalendarCheck,
  ClipboardList,
  FileBarChart2,
  Settings2,
} from "lucide-react";
import { PermissionLink } from "@/components/shared/permission-link";
import { Button } from "@/components/ui/button";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useAttendanceSummary,
  useAttendanceTrends,
} from "@/hooks/use-attendance";
import {
  DashboardBars,
  DashboardDonut,
  DashboardTrend,
  dashboardColors,
} from "@/components/dashboard/dashboard-plots";
import {
  attendanceBreakdown,
  AttendanceWorkspace,
  AttendanceHeader,
} from "@/components/attendance/attendance-presentation";
import { AttendanceChartCard } from "@/components/attendance/attendance-chart-card";
import { AttendanceHeadcountCharts } from "@/components/attendance/attendance-headcount-charts";

export default function AttendanceDashboardPage() {
  const { can } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const [range] = React.useState(() => {
    const today = new Date();
    return {
      startDate: format(subDays(today, 29), "yyyy-MM-dd"),
      endDate: `${format(today, "yyyy-MM-dd")}T23:59:59.999Z`,
    };
  });
  const params = {
    ...range,
    branchId: profile?.isAdminHq ? undefined : profile?.branchId,
  };
  const summaryQuery = useAttendanceSummary(params, { enabled: !!profile });
  const trendsQuery = useAttendanceTrends(params, { enabled: !!profile });
  const summary = summaryQuery.data;
  const showSummary = can("attendance:dashboard", "read");
  const showTrends = can("attendance:reports", "read");
  return (
    <AttendanceWorkspace>
      <AttendanceHeader
        title="Attendance"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Attendance" },
        ]}
        action={
          can("attendance:checkin", "create") && (
            <Button asChild>
              <PermissionLink href="/attendance/check-in">
                <ClipboardList className="mr-2 size-4" />
                Check-In
              </PermissionLink>
            </Button>
          )
        }
      />
      <nav aria-label="Attendance tasks" className="flex flex-wrap gap-2">
        {can("attendance:records", "read") && (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <PermissionLink href="/attendance/records">
              <CalendarCheck className="size-3.5" />
              Records
            </PermissionLink>
          </Button>
        )}
        {can("attendance:services", "read") && (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <PermissionLink href="/attendance/services">
              <Settings2 className="size-3.5" />
              Services
            </PermissionLink>
          </Button>
        )}
        {showTrends && (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <PermissionLink href="/attendance/reports">
              <FileBarChart2 className="size-3.5" />
              Reports
            </PermissionLink>
          </Button>
        )}
      </nav>
      <p className="text-xs text-muted-foreground">
        Last 30 days ·{" "}
        {profile?.isAdminHq
          ? "All permitted branches"
          : (profile?.branch?.name ?? "Your branch")}
      </p>
      <section aria-label="Named check-ins" className="space-y-3">
        <h2 className="text-sm font-semibold">Named check-ins</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {showTrends && (
            <AttendanceChartCard
              title="Check-in trend"
              description="Members and visitors over time"
              query={trendsQuery}
              className="sm:col-span-2"
            >
              <DashboardTrend
                data={trendsQuery.data ?? []}
                colors={[dashboardColors[0], dashboardColors[2]]}
                split
              />
            </AttendanceChartCard>
          )}
          {showSummary && (
            <>
              <AttendanceChartCard
                title="Members & visitors"
                description="Named check-ins by attendee"
                query={summaryQuery}
                tone="violet"
              >
                <DashboardDonut
                  data={
                    summary
                      ? [
                          { name: "Members", value: summary.memberCheckIns },
                          { name: "Visitors", value: summary.visitorCheckIns },
                        ]
                      : []
                  }
                />
              </AttendanceChartCard>
              <AttendanceChartCard
                title="Attendance categories"
                description="Adults, children and unspecified"
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
                title="Gender breakdown"
                description="Linked attendees, including unknown"
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
                title="Check-in sources"
                description="How attendance was recorded"
                query={summaryQuery}
                tone="teal"
              >
                <DashboardBars
                  data={attendanceBreakdown(summary?.bySource)}
                  colors={[
                    dashboardColors[4],
                    dashboardColors[0],
                    dashboardColors[1],
                    dashboardColors[3],
                  ]}
                />
              </AttendanceChartCard>
            </>
          )}
        </div>
      </section>
      {showSummary && (
        <AttendanceHeadcountCharts
          summary={summary?.generalAttendance}
          query={summaryQuery}
        />
      )}
    </AttendanceWorkspace>
  );
}
