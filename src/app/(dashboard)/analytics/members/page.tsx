"use client";

import * as React from "react";
import { AlertTriangle, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsTrendChart } from "@/components/analytics/analytics-charts";
import { DonutChart, colorize } from "@/components/analytics/pie-chart";
import { HistogramChart } from "@/components/analytics/histogram-chart";
import { useAnalyticsMembers } from "@/hooks/use-analytics";

const AGE_LABELS: Record<string, string> = {
  under_18: "Under 18",
  age_18_30: "18–30",
  age_31_45: "31–45",
  age_46_60: "46–60",
  age_60_plus: "60+",
  unspecified: "Unknown",
};

export default function AnalyticsMembersPage() {
  const query = useAnalyticsMembers();
  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Member Analytics"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Analytics" },
          { label: "Members" },
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
          <p className="text-destructive">Failed to load member analytics.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatsCard
              title="Total Members"
              value={data?.total ?? (query.isLoading ? "..." : "—")}
              icon={<Users className="h-4 w-4" />}
              variant="primary"
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Member Growth</CardTitle>
              <CardDescription>Monthly membership growth.</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsTrendChart data={data?.growth ?? []} loading={query.isLoading} />
            </CardContent>
          </Card>

          {/* Age distribution — histogram */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Age Distribution</CardTitle>
              <CardDescription>Members by age group (bins).</CardDescription>
            </CardHeader>
            <CardContent>
              <HistogramChart
                data={Object.entries(data?.byAgeGroup ?? {}).map(([key, value]) => ({
                  label: AGE_LABELS[key] ?? key.replace(/_/g, " "),
                  value,
                }))}
                loading={query.isLoading}
                unit="members"
                color="var(--chart-2)"
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Status</CardTitle>
                <CardDescription>Members per membership status.</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={colorize(
                    Object.entries(data?.byStatus ?? {}).map(([key, value]) => ({
                      name: key.replace(/_/g, " "),
                      value,
                    }))
                  )}
                  loading={query.isLoading}
                  unit="members"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Gender</CardTitle>
                <CardDescription>Members by gender.</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={colorize(
                    Object.entries(data?.byGender ?? {}).map(([key, value]) => ({
                      name: key.replace(/_/g, " "),
                      value,
                    }))
                  )}
                  loading={query.isLoading}
                  unit="members"
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
