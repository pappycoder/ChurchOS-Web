import { PageHeader } from "@/components/shared/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />
      <DashboardShell />
    </div>
  );
}
