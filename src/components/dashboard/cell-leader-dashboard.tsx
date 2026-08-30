"use client";

import { Boxes, Network, Users } from "lucide-react";
import Link from "next/link";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMembersList } from "@/hooks/use-members";
import { useGivingTransactions } from "@/hooks/use-giving";
import { useCellGroupsList } from "@/hooks/use-admin";
import { RecentGiving } from "@/components/dashboard/dashboard-widgets";

export function CellLeaderDashboard() {
  const members = useMembersList({ page: 1, limit: 1 });
  const giving = useGivingTransactions({ page: 1, limit: 1 });
  const groups = useCellGroupsList();

  const groupsList = groups.data ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Cell Groups"
          value={groupsList.length ?? (groups.isLoading ? "..." : "—")}
          icon={<Network className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Total Members"
          value={members.data?.meta?.total ?? (members.isLoading ? "..." : "—")}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Giving Transactions"
          value={giving.data?.meta?.total ?? (giving.isLoading ? "..." : "—")}
          icon={<Boxes className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              My Cell Groups
            </CardTitle>
            <Link
              href="/departments/cell-groups"
              className="text-xs text-primary hover:underline shrink-0"
            >
              Manage
            </Link>
          </CardHeader>
          <CardContent>
            {groups.isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : groupsList.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No cell groups yet.</p>
            ) : (
              <ul className="divide-y">
                {groupsList.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.leaderFirstName && g.leaderLastName
                          ? `${g.leaderFirstName} ${g.leaderLastName}`
                          : g.branchName || "Cell group"}
                      </p>
                    </div>
                    {g.branchName && (
                      <span className="shrink-0 text-xs text-muted-foreground">{g.branchName}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <RecentGiving />
      </div>
    </div>
  );
}
