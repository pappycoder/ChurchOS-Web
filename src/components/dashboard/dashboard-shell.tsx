"use client";

import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
import { LeaderDashboard } from "@/components/dashboard/leader-dashboard";
import { GivingDashboard } from "@/components/dashboard/giving-dashboard";
import { OperationsDashboard } from "@/components/dashboard/operations-dashboard";
import { CellLeaderDashboard } from "@/components/dashboard/cell-leader-dashboard";
import { MemberDashboard } from "@/components/dashboard/member-dashboard";
import { SuperAdminDashboard } from "@/components/dashboard/super-admin-dashboard";

export function DashboardShell() {
  const { ready, hasRole } = usePermissions();
  const profile = useCurrentProfile();

  if (!ready || !profile.data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const primary = profile.data.role[0];

  if (primary === "super_admin") {
    return <SuperAdminDashboard />;
  }

  if (hasRole("senior_pastor", "church_admin", "branch_pastor")) {
    return <LeaderDashboard />;
  }

  if (primary === "treasurer") {
    return <GivingDashboard />;
  }

  if (primary === "secretary" || primary === "department_head" || hasRole("secretary", "department_head")) {
    return <OperationsDashboard />;
  }

  if (primary === "cell_leader" || hasRole("cell_leader")) {
    return <CellLeaderDashboard />;
  }

  return <MemberDashboard />;
}
