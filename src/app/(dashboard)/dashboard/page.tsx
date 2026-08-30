import { PageHeader } from "@/components/shared/page-header";
import { MyDashboard } from "@/components/dashboard/my-dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />
      <MyDashboard />
    </div>
  );
}
