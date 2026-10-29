"use client";

import { AnalyticsScope } from "@/components/analytics/analytics-scope";
import type { ReportRange } from "@/components/reports/report-date-range";
import { useCurrentProfile } from "@/hooks/use-profile";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { CalendarCheck, UserCheck, UserRound, Users } from "lucide-react";
import { WorkspaceHeader as PageHeader } from "@/components/workspace/workspace-presentation";
import { SummaryMetric as StatsCard } from "@/components/workspace/workspace-presentation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreakdownBars } from "@/components/reports/breakdown-bars";
import {
  AnalyticsTrendChart,
  AnalyticsLegend,
} from "@/components/analytics/analytics-charts";
import { LoadingIndicator } from "@/components/shared/loading-indicator";
import { useAnalyticsAttendance } from "@/hooks/use-analytics";

export default function AnalyticsAttendancePage() {
  const { data: profile } = useCurrentProfile();
  const [range, setRange] = React.useState<ReportRange>({
    startDate: "",
    endDate: "",
  });
  const [branchId, setBranchId] = React.useState("");
  const query = useAnalyticsAttendance(
    {
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined,
      branchId:
        (profile?.isAdminHq ? branchId : profile?.branchId) || undefined,
    },
    { enabled: !!profile },
  );
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={query.isLoading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <AnalyticsScope
        range={range}
        onRangeChange={setRange}
        branchId={branchId}
        onBranchChange={setBranchId}
      />

      {query.error ? (
        <ErrorState title="Failed to load attendance analytics." />
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
              <CardTitle className="text-sm font-semibold">
                Attendance Trend
              </CardTitle>
              <CardDescription>
                Daily check-ins — members vs visitors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnalyticsTrendChart
                data={data?.trend ?? []}
                loading={query.isLoading}
                kind="split"
              />
              <AnalyticsLegend
                entries={[
                  {
                    name: "Members",
                    value: data?.members ?? 0,
                    color: "var(--chart-1)",
                  },
                  {
                    name: "Visitors",
                    value: data?.visitors ?? 0,
                    color: "var(--chart-2)",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  By Service
                </CardTitle>
                <CardDescription>Check-ins per service.</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBars
                  colorful
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
                <CardTitle className="text-sm font-semibold">
                  By Source & Branch
                </CardTitle>
                <CardDescription>
                  Check-in source and branch breakdown.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data && Object.keys(data.bySource).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      By source
                    </p>
                    <BreakdownBars
                      colorful
                      items={Object.entries(data.bySource).map(
                        ([key, value]) => ({
                          name: key.replace(/_/g, " "),
                          value,
                        }),
                      )}
                    />
                  </div>
                )}
                {data && data.byBranch.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      By branch
                    </p>
                    <BreakdownBars
                      colorful
                      items={data.byBranch.map((branch) => ({
                        name: branch.branchName,
                        value: branch.total,
                      }))}
                    />
                  </div>
                )}
                {(!data ||
                  (Object.keys(data.bySource).length === 0 &&
                    data.byBranch.length === 0)) && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {query.isLoading ? (
                      <LoadingIndicator label="Loading attendance breakdown" />
                    ) : (
                      "No breakdown data yet."
                    )}
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
