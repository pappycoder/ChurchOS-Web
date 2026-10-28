"use client";

import * as React from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { Bell, Calendar, CalendarCheck, Users, Wallet } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";
import {
  useMemberDashboard,
  useGivingDashboardCharts,
} from "@/hooks/use-dashboard-charts";
import {
  useAttendanceSummary,
  useAttendanceTrends,
} from "@/hooks/use-attendance";
import {
  ReportDateRange,
  type ReportRange,
} from "@/components/reports/report-date-range";
import { AnalyticsTrendChart } from "@/components/analytics/analytics-charts";
import { DonutChart, colorize } from "@/components/analytics/pie-chart";
import { HistogramChart } from "@/components/analytics/histogram-chart";
import { BarsChart } from "@/components/analytics/bars-chart";
import { StatsCard } from "@/components/shared/stats-card";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function recentRange(): ReportRange {
  const today = new Date();
  return {
    startDate: format(subDays(today, 29), "yyyy-MM-dd"),
    endDate: format(today, "yyyy-MM-dd"),
  };
}

function ChartCard({
  title,
  description,
  href,
  children,
}: {
  title: string;
  description: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={href}>
              View details<span className="sr-only">: {title}</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DashboardCharts({
  upcomingEvents,
  eventsLoading,
  eventsError,
  canViewEvents,
  unreadCount,
  notificationsLoading,
  notificationsError,
}: {
  upcomingEvents: number;
  eventsLoading: boolean;
  eventsError: boolean;
  canViewEvents: boolean;
  unreadCount: number;
  notificationsLoading: boolean;
  notificationsError: boolean;
}) {
  const { can } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const showAttendance = can("attendance:dashboard", "read");
  const showGiving = can("giving:dashboard", "read");
  const showMembers = can("members:all", "read");
  const showAttendanceTrend = can("attendance:reports", "read");
  const hasCharts =
    showAttendance || showAttendanceTrend || showGiving || showMembers;
  const [range, setRange] = React.useState<ReportRange>(recentRange);
  const [branch, setBranch] = React.useState("");
  const [currency, setCurrency] = React.useState("NGN");
  const branchId =
    (profile?.isAdminHq ? branch : profile?.branchId) || undefined;
  const invalidRange = !!(
    range.startDate &&
    range.endDate &&
    range.startDate > range.endDate
  );
  const params = {
    startDate: range.startDate || undefined,
    endDate: range.endDate ? `${range.endDate}T23:59:59.999Z` : undefined,
    branchId,
  };
  const attendance = useAttendanceSummary(params, {
    enabled: !!profile && !invalidRange,
  });
  const giving = useGivingDashboardCharts(
    { ...params, currency },
    { enabled: !!profile && !invalidRange },
  );
  const members = useMemberDashboard({ branchId }, { enabled: !!profile });
  const attendanceTrend = useAttendanceTrends(params, {
    enabled: !!profile && !invalidRange,
  });
  const attendanceHref = can("analytics:attendance", "read")
    ? "/analytics/attendance"
    : "/attendance";
  const givingHref = can("analytics:giving", "read")
    ? "/analytics/giving"
    : "/giving";
  const membersHref = can("analytics:members", "read")
    ? "/analytics/members"
    : "/members";
  const branches = useBranchesList(
    { limit: 100 },
    {
      enabled: hasCharts && !!profile?.isAdminHq && can("branches", "read"),
    },
  );
  const money = (value: number) =>
    `${currency} ${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
  const period = `${range.startDate || "Beginning"} – ${range.endDate || "Today"}`;
  const currentScope = profile?.isAdminHq
    ? (branches.data?.data.find((b) => b.branchId === branchId)?.name ??
      (branchId ? "Selected branch" : "All permitted branches"))
    : (profile?.branch?.name ?? "Your branch");
  const ageLabels: Record<string, string> = {
    under_18: "Under 18",
    age_18_30: "18–30",
    age_31_45: "31–45",
    age_46_60: "46–60",
    age_60_plus: "Over 60",
    unspecified: "Unspecified",
  };
  const refresh = () => {
    if (showAttendance && !invalidRange) void attendance.refetch();
    if (showAttendanceTrend && !invalidRange) void attendanceTrend.refetch();
    if (showGiving && !invalidRange) void giving.refetch();
    if (showMembers) void members.refetch();
  };
  const memberContent = (children: React.ReactNode) =>
    members.error ? (
      <ErrorState
        title="Unable to load member dashboard"
        onRetry={async () => {
          await members.refetch();
        }}
      />
    ) : (
      children
    );

  return (
    <div className="space-y-4">
      {hasCharts && (
        <section
          aria-label="Dashboard filters"
          className="space-y-3 rounded-lg border p-4"
        >
          <ReportDateRange value={range} onChange={setRange} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Branch
              <select
                aria-label="Dashboard branch"
                className="h-9 max-w-full rounded-md border bg-background px-3"
                value={branchId ?? ""}
                disabled={!profile?.isAdminHq || !can("branches", "read")}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="">
                  {profile?.isAdminHq
                    ? "All permitted branches"
                    : (profile?.branch?.name ?? "Your branch")}
                </option>
                {profile?.isAdminHq
                  ? branches.data?.data.map((b) => (
                      <option key={b.branchId} value={b.branchId}>
                        {b.name}
                      </option>
                    ))
                  : profile?.branchId && (
                      <option value={profile.branchId}>
                        {profile.branch?.name ?? "Your branch"}
                      </option>
                    )}
              </select>
            </label>
            {showGiving && (
              <label className="grid gap-1 text-sm font-medium">
                Giving currency
                <select
                  aria-label="Dashboard giving currency"
                  className="h-9 rounded-md border bg-background px-3"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
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
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={
                attendance.isFetching ||
                attendanceTrend.isFetching ||
                giving.isFetching ||
                members.isFetching
              }
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRange(recentRange());
                setBranch("");
                setCurrency("NGN");
              }}
            >
              Reset filters
            </Button>
          </div>
          {invalidRange && (
            <p role="alert" className="text-sm text-destructive">
              Start date must be on or before end date.
            </p>
          )}
          {branches.error && (
            <ErrorState
              title="Unable to load branch choices"
              onRetry={async () => {
                await branches.refetch();
              }}
            />
          )}
          <p className="text-xs text-muted-foreground">
            {currentScope}. Dates apply to attendance and giving. Membership
            shows the current snapshot and full growth history for this branch
            scope.
          </p>
        </section>
      )}

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
        }}
      >
        {showAttendance && (
          <StatsCard
            title="Check-ins · selected period"
            value={
              invalidRange || attendance.error
                ? "—"
                : (attendance.data?.totalCheckIns.toLocaleString() ?? "…")
            }
            icon={<CalendarCheck className="h-4 w-4" />}
          />
        )}
        {showGiving && (
          <StatsCard
            title="Giving · selected period"
            value={
              invalidRange || giving.error
                ? "—"
                : giving.data
                  ? money(giving.data.total)
                  : "…"
            }
            icon={<Wallet className="h-4 w-4" />}
            variant="primary"
          />
        )}
        {showMembers && (
          <StatsCard
            title="Current members"
            value={
              members.error
                ? "—"
                : (members.data?.total.toLocaleString() ?? "…")
            }
            icon={<Users className="h-4 w-4" />}
          />
        )}
        {canViewEvents && (
          <StatsCard
            title="Upcoming events"
            value={
              eventsError
                ? "—"
                : eventsLoading
                  ? "…"
                  : upcomingEvents.toLocaleString()
            }
            icon={<Calendar className="h-4 w-4" />}
          />
        )}
        <StatsCard
          title="Unread notifications"
          value={
            notificationsError
              ? "—"
              : notificationsLoading
                ? "…"
                : unreadCount.toLocaleString()
          }
          icon={<Bell className="h-4 w-4" />}
        />
      </div>

      {(showAttendance || showAttendanceTrend || showGiving) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {showAttendance && (
            <ChartCard
              title="Attendance breakdown"
              description={`Member and visitor check-ins · ${period}`}
              href={attendanceHref}
            >
              {invalidRange ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Choose a valid date range.
                </p>
              ) : attendance.error ? (
                <ErrorState
                  title="Unable to load attendance summary"
                  onRetry={async () => {
                    await attendance.refetch();
                  }}
                />
              ) : (
                <BarsChart
                  data={
                    attendance.data?.totalCheckIns
                      ? [
                          {
                            label: "Members",
                            value: attendance.data.memberCheckIns,
                          },
                          {
                            label: "Visitors",
                            value: attendance.data.visitorCheckIns,
                          },
                        ]
                      : []
                  }
                  loading={attendance.isLoading}
                  valueLabel="check-ins"
                />
              )}
            </ChartCard>
          )}
          {showAttendanceTrend && (
            <ChartCard
              title="Attendance trend"
              description={`Members and visitors · ${period}`}
              href={
                can("analytics:attendance", "read")
                  ? "/analytics/attendance"
                  : "/attendance/reports"
              }
            >
              {invalidRange ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Choose a valid date range.
                </p>
              ) : attendanceTrend.error ? (
                <ErrorState
                  title="Unable to load attendance trend"
                  onRetry={async () => {
                    await attendanceTrend.refetch();
                  }}
                />
              ) : (
                <AnalyticsTrendChart
                  data={attendanceTrend.data ?? []}
                  loading={attendanceTrend.isLoading}
                  kind="split"
                />
              )}
            </ChartCard>
          )}
          {showGiving && (
            <ChartCard
              title="Giving trend"
              description={`Successful giving · ${currency} · ${period}`}
              href={givingHref}
            >
              {invalidRange ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Choose a valid date range.
                </p>
              ) : giving.error ? (
                <ErrorState
                  title="Unable to load giving charts"
                  onRetry={async () => {
                    await giving.refetch();
                  }}
                />
              ) : (
                <AnalyticsTrendChart
                  data={(giving.data?.trend ?? []).map((point) => ({
                    ...point,
                    members: 0,
                    visitors: 0,
                  }))}
                  loading={giving.isLoading}
                  formatValue={money}
                />
              )}
            </ChartCard>
          )}
        </div>
      )}

      {showMembers && (
        <section aria-label="Membership snapshot" className="space-y-4">
          <div>
            <h2 className="font-semibold">Membership · {currentScope}</h2>
            <p className="text-sm text-muted-foreground">
              Current demographics and full growth history. Independent of the
              selected dates.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Member growth"
              description="Cumulative members by joining month · full history"
              href={membersHref}
            >
              {memberContent(
                <AnalyticsTrendChart
                  data={members.data?.growth ?? []}
                  loading={members.isLoading}
                />,
              )}
            </ChartCard>
            <ChartCard
              title="Member composition"
              description="Current membership status"
              href={membersHref}
            >
              {memberContent(
                <DonutChart
                  data={colorize(
                    Object.entries(members.data?.byStatus ?? {}).map(
                      ([name, value]) => ({
                        name: name.replace(/_/g, " "),
                        value,
                      }),
                    ),
                  )}
                  loading={members.isLoading}
                  unit="members"
                />,
              )}
            </ChartCard>
            <ChartCard
              title="Age distribution"
              description="Current members by age group"
              href={membersHref}
            >
              {memberContent(
                <HistogramChart
                  data={Object.entries(members.data?.byAgeGroup ?? {}).map(
                    ([key, value]) => ({ label: ageLabels[key] ?? key, value }),
                  )}
                  loading={members.isLoading}
                  unit="members"
                />,
              )}
            </ChartCard>
          </div>
        </section>
      )}

      {showGiving && (
        <ChartCard
          title="Giving by category"
          description={`Successful giving · ${currency} · ${period}`}
          href={givingHref}
        >
          {invalidRange ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Choose a valid date range.
            </p>
          ) : giving.error ? (
            <ErrorState
              title="Unable to load giving breakdown"
              onRetry={async () => {
                await giving.refetch();
              }}
            />
          ) : (
            <BarsChart
              data={(giving.data?.byCategory ?? []).map((c) => ({
                label: c.categoryName,
                value: c.total,
              }))}
              loading={giving.isLoading}
              formatValue={money}
            />
          )}
        </ChartCard>
      )}
    </div>
  );
}
