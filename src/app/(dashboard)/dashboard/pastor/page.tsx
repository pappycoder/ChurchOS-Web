import { PageHeader } from "@/components/shared/page-header";
import { LeaderDashboard } from "@/components/dashboard/leader-dashboard";

export default function PastorDashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Pastor Dashboard"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Pastor Dashboard" },
        ]}
      />
      <LeaderDashboard />
    </div>
  );
}
