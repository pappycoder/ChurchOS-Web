"use client";

import { AlertTriangle, Banknote, CalendarDays, HeartHandshake, Users } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsDashboard, formatNaira } from "@/hooks/use-analytics";
import { UpcomingEvents, RecentGiving } from "@/components/dashboard/dashboard-widgets";

export function LeaderDashboard() {
  const query = useAnalyticsDashboard();
  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Members"
          value={data?.totalMembers ?? (query.isLoading ? "..." : "—")}
          icon={<Users className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Total Attendance"
          value={data?.totalAttendance ?? (query.isLoading ? "..." : "—")}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Giving"
          value={data ? formatNaira(data.totalGiving) : query.isLoading ? "..." : "—"}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatsCard
          title="Upcoming Events"
          value={data?.upcomingEvents ?? (query.isLoading ? "..." : "—")}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Members"
          value={data?.activeMembers ?? (query.isLoading ? "..." : "—")}
          icon={<HeartHandshake className="h-4 w-4" />}
        />
        <StatsCard
          title="New Members"
          value={data?.newMembers ?? (query.isLoading ? "..." : "—")}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Branches"
          value={data?.totalBranches ?? (query.isLoading ? "..." : "—")}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="At Risk"
          value={data?.atRiskCount ?? (query.isLoading ? "..." : "—")}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingEvents />
        <RecentGiving />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Engagement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data && Object.keys(data.engagementDistribution).length > 0 ? (
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {Object.entries(data.engagementDistribution).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
                    <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {query.isLoading ? "Loading…" : "No engagement data yet."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
