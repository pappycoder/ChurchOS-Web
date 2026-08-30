import { PageHeader } from "@/components/shared/page-header";
import { OperationsDashboard } from "@/components/dashboard/operations-dashboard";

export default function SecretaryDashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Secretary Dashboard"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Secretary Dashboard" },
        ]}
      />
      <OperationsDashboard />
    </div>
  );
}
