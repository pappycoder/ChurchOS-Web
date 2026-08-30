import { PageHeader } from "@/components/shared/page-header";
import { OperationsDashboard } from "@/components/dashboard/operations-dashboard";

export default function DepartmentDashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Department Dashboard"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Department Dashboard" },
        ]}
      />
      <OperationsDashboard />
    </div>
  );
}
