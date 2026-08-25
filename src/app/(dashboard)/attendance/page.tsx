"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Users,
  Baby,
  ArrowRight,
  ClipboardList,
  Settings2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useEventsList, EVENT_TYPE_MAP } from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";

const trendConfig = {
  total: { label: "Check-ins", color: "var(--chart-1)" },
} satisfies ChartConfig;

function categoryLabel(category?: string): string {
  return (
    SERVICE_CATEGORIES.find((c) => c.value === category)?.label ??
    category ??
    "Adult"
  );
}

function RecordRow({ record }: { record: AttendanceRecord }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">
          {record.memberName || record.visitorName || "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {record.serviceName || "-"} ·{" "}
          {format(new Date(record.checkInAt), "MMM d, HH:mm")}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-3">
        {!record.memberId && record.visitorName && (
          <Badge variant="outline">Visitor</Badge>
        )}
        <Badge variant="secondary">{categoryLabel(record.category)}</Badge>
      </div>
    </div>
  );
}

export default function AttendanceDashboardPage() {
  const { can } = usePermissions();
  const canCreate = can("attendance", "create");

  const monthStart = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }, []);

  const summaryQuery = useAttendanceSummary();
  const monthQuery = useAttendanceSummary({ startDate: monthStart });
  const trendsQuery = useAttendanceTrends({ days: 30 });
  const recentQuery = useAttendanceRecords({ limit: 8 });
  const eventsQuery = useEventsList({ limit: 5, sortBy: "startDate", sortOrder: "desc" });

  const summary = summaryQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Attendance" }]}
        action={
          canCreate && (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/attendance/services">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Services
                </Link>
              </Button>
              <Button asChild>
                <Link href="/attendance/check-in">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Check-In
                </Link>
              </Button>
            </div>
          )
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Check-Ins"
          value={summary?.totalCheckIns ?? 0}
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <StatsCard
          title="This Month"
          value={monthQuery.data?.totalCheckIns ?? 0}
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <StatsCard
          title="Members"
          value={summary?.memberCheckIns ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Visitors"
          value={summary?.visitorCheckIns ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Event Attendance */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Event Attendance
            </CardTitle>
            <CardDescription>Check-ins at recent events.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/events">
              View all
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (eventsQuery.data?.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No events yet.
            </p>
          ) : (
            (eventsQuery.data?.data ?? []).map((event) => (
              <div
                key={event.eventId}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {EVENT_TYPE_MAP[event.type] ?? event.type} ·{" "}
                    {format(new Date(event.startDate), "MMM d, HH:mm")}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <Badge variant="outline">
                    {event.registrationCount} registered
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Last 30 Days</CardTitle>
              <CardDescription>Daily check-ins across all services.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Baby className="h-3.5 w-3.5" />
              Children: {summary?.byCategory?.children ?? 0}
            </div>
          </CardHeader>
          <CardContent>
            {trendsQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (trendsQuery.data ?? []).length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No check-ins recorded in this period.
              </div>
            ) : (
              <ChartContainer config={trendConfig} className="h-64 w-full">
                <AreaChart
                  data={trendsQuery.data ?? []}
                  margin={{ left: -16, right: 8 }}
                >
                  <defs>
                    <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value: string) =>
                      format(new Date(value), "MMM d")
                    }
                  />
                  <ChartTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) =>
                          format(new Date(String(label)), "EEE, MMM d, yyyy")
                        }
                      />
                    }
                  />
                  <Area
                    dataKey="total"
                    type="monotone"
                    stroke="var(--color-total)"
                    strokeWidth={2}
                    fill="url(#fillTotal)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent check-ins */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Check-Ins</CardTitle>
              <CardDescription>Latest recorded attendance.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/attendance/records">
                View all
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (recentQuery.data?.data ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No check-ins yet.
              </p>
            ) : (
              (recentQuery.data?.data ?? []).map((record) => (
                <RecordRow key={record.attendanceId} record={record} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
