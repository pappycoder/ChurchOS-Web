"use client";

import * as React from "react";
import { AlertTriangle, Banknote, CalendarDays, ClipboardCheck, HeartHandshake, RefreshCw, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalyticsDashboard, formatNaira } from "@/hooks/use-analytics";

export default function AnalyticsOverviewPage() {
  const query = useAnalyticsDashboard();
  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics Overview"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Analytics" },
          { label: "Overview" },
        ]}
        action={
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {query.error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load analytics.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Members"
              value={data?.totalMembers ?? (query.isLoading ? "..." : "—")}
              icon={<Users className="h-4 w-4" />}
              variant="primary"
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
              title="Total Branches"
              value={data?.totalBranches ?? (query.isLoading ? "..." : "—")}
              icon={<Users className="h-4 w-4" />}
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
              title="At Risk"
              value={data?.atRiskCount ?? (query.isLoading ? "..." : "—")}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <StatsCard
              title="Upcoming Events"
              value={data?.upcomingEvents ?? (query.isLoading ? "..." : "—")}
              icon={<CalendarDays className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  Pending Form Submissions
                </CardTitle>
                <CardDescription>Submissions awaiting review.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {data?.pendingSubmissions ?? (query.isLoading ? "..." : "—")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                  Engagement Distribution
                </CardTitle>
                <CardDescription>Members by engagement bucket.</CardDescription>
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
        </>
      )}
    </div>
  );
}
