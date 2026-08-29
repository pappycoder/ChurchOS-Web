"use client";

import * as React from "react";
import { AlertTriangle, CalendarCheck, UserCheck, UserRound, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreakdownBars } from "@/components/reports/breakdown-bars";
import { AnalyticsTrendChart, AnalyticsLegend } from "@/components/analytics/analytics-charts";
import { useAnalyticsAttendance } from "@/hooks/use-analytics";

export default function AnalyticsAttendancePage() {
  const query = useAnalyticsAttendance();
  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance Analytics"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Analytics" },
          { label: "Attendance" },
        ]}
        action={
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isLoading}>
            Refresh
          </Button>
        }
      />

      {query.error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load attendance analytics.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatsCard
              title="Total Check-ins"
              value={data?.total ?? (query.isLoading ? "..." : "—")}
              icon={<CalendarCheck className="h-4 w-4" />}
              variant="primary"
            />
            <StatsCard
              title="Members"
              value={data?.members ?? (query.isLoading ? "..." : "—")}
              icon={<UserCheck className="h-4 w-4" />}
            />
            <StatsCard
              title="Visitors"
              value={data?.visitors ?? (query.isLoading ? "..." : "—")}
              icon={<UserRound className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard
              title="First-Time Visitors"
              value={data?.firstTimeVisitors ?? (query.isLoading ? "..." : "—")}
              icon={<UserRound className="h-4 w-4" />}
            />
            <StatsCard
              title="Returning Visitors"
              value={data?.returningVisitors ?? (query.isLoading ? "..." : "—")}
              icon={<Users className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Attendance Trend</CardTitle>
              <CardDescription>Daily check-ins — members vs visitors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnalyticsTrendChart data={data?.trend ?? []} loading={query.isLoading} kind="split" />
              <AnalyticsLegend
                entries={[
                  { name: "Members", value: data?.members ?? 0, color: "var(--chart-1)" },
                  { name: "Visitors", value: data?.visitors ?? 0, color: "var(--chart-2)" },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Service</CardTitle>
                <CardDescription>Check-ins per service.</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBars
                  items={(data?.byService ?? []).map((s) => ({
                    name: s.serviceName,
                    value: s.total,
                    count: s.members,
                  }))}
                  labelSuffix={(item) => `${item.count} members`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Source & Branch</CardTitle>
                <CardDescription>Check-in source and branch breakdown.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data && Object.keys(data.bySource).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">By source</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {Object.entries(data.bySource).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="capitalize text-muted-foreground">{key}</span>
                          <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data && data.byBranch.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">By branch</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {data.byBranch.map((b) => (
                        <div key={b.branchName} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{b.branchName}</span>
                          <span className="font-semibold tabular-nums">{b.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!data || (Object.keys(data.bySource).length === 0 && data.byBranch.length === 0)) && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {query.isLoading ? "Loading…" : "No breakdown data yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
