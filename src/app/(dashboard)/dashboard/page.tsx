import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, CalendarCheck, HandCoins, Calendar } from "lucide-react";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Members" value="0" icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Attendance Today" value="0" icon={<CalendarCheck className="h-5 w-5" />} />
        <StatsCard title="Total Giving" value="₦0" icon={<HandCoins className="h-5 w-5" />} />
        <StatsCard title="Active Events" value="0" icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="bg-white rounded-lg border">
        <EmptyState
          title="Welcome to ChurchOS"
          description="Start by adding your church members, recording attendance, and tracking giving. This dashboard will show key metrics once data is available."
        />
      </div>
    </div>
  );
}
