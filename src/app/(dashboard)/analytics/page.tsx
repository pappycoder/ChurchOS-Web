"use client";

import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  ClipboardCheck,
  HeartHandshake,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  WorkspaceHeader,
  SummaryMetric,
  DistributionChart,
} from "@/components/workspace/workspace-presentation";
import { Button } from "@/components/ui/button";
import { useAnalyticsDashboard, formatNaira } from "@/hooks/use-analytics";

export default function AnalyticsOverviewPage() {
  const query = useAnalyticsDashboard();
  const data = query.data;
  const pending = query.isLoading ? "..." : "—";
  return (
    <div className="space-y-4">
      <WorkspaceHeader
        title="Analytics Overview"
        breadcrumbs={[{ label: "Analytics" }, { label: "Overview" }]}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />
      <DistributionChart
        title="Engagement distribution"
        description="Members by latest engagement bucket in your permitted scope. Other figures below retain their existing reporting periods."
        query={query}
        data={Object.entries(data?.engagementDistribution ?? {}).map(
          ([key, value]) => ({ label: key.replace(/_/g, " "), value }),
        )}
      />
      {!query.error && (
        <section
          aria-label="Analytics summary"
          className="grid grid-cols-2 gap-2 lg:grid-cols-3"
        >
          <SummaryMetric
            title="Total Members"
            value={data?.totalMembers ?? pending}
            icon={<Users />}
          />
          <SummaryMetric
            title="Active Members"
            value={data?.activeMembers ?? pending}
            icon={<HeartHandshake />}
          />
          <SummaryMetric
            title="New Members"
            value={data?.newMembers ?? pending}
            icon={<Users />}
          />
          <SummaryMetric
            title="Total Branches"
            value={data?.totalBranches ?? pending}
            icon={<Users />}
          />
          <SummaryMetric
            title="Total Attendance"
            value={data?.totalAttendance ?? pending}
            icon={<CalendarDays />}
          />
          <SummaryMetric
            title="Total Giving"
            value={data ? formatNaira(data.totalGiving) : pending}
            icon={<Banknote />}
          />
          <SummaryMetric
            title="At Risk"
            value={data?.atRiskCount ?? pending}
            icon={<AlertTriangle />}
          />
          <SummaryMetric
            title="Upcoming Events"
            value={data?.upcomingEvents ?? pending}
            icon={<CalendarDays />}
          />
          <SummaryMetric
            title="Pending Form Submissions"
            value={data?.pendingSubmissions ?? pending}
            icon={<ClipboardCheck />}
            subtitle="Submissions awaiting review."
          />
        </section>
      )}
    </div>
  );
}
