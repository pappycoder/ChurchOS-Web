import { PageHeader } from "@/components/shared/page-header";
import { GivingDashboard } from "@/components/dashboard/giving-dashboard";

export default function TreasurerDashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Treasurer Dashboard"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Treasurer Dashboard" },
        ]}
      />
      <GivingDashboard />
    </div>
  );
}
