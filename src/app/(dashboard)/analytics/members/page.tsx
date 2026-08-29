"use client";

import * as React from "react";
import { AlertTriangle, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsTrendChart } from "@/components/analytics/analytics-charts";
import { useAnalyticsMembers } from "@/hooks/use-analytics";

function RecordGrid({ data, loading }: { data: Record<string, number> | undefined; loading: boolean }) {
  const entries = data ? Object.entries(data) : [];
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {loading ? "Loading…" : "No data yet."}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-sm">
          <span className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
          <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

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

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Status</CardTitle>
                <CardDescription>Members per membership status.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecordGrid data={data?.byStatus} loading={query.isLoading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Gender</CardTitle>
                <CardDescription>Members by gender.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecordGrid data={data?.byGender} loading={query.isLoading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Age Group</CardTitle>
                <CardDescription>Members by age range.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecordGrid data={data?.byAgeGroup} loading={query.isLoading} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
