"use client";

import { useCellGroupsList } from "@/hooks/use-admin";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
import { CellGroupGivingPanel } from "./cell-group-giving-panel";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";

/** Leaders can record meeting totals directly from their landing pages. */
export function LeaderMeetingGiving() {
  const { canAny } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const enabled = canAny("cell_groups:own:read") && canAny("cell_groups:giving:create");
  const query = useCellGroupsList({}, enabled);
  if (!enabled) return null;
  if (query.isLoading) return <LoadingState label="Loading your cell group giving" />;
  if (query.error) return <ErrorState title="Could not load your cell groups" onRetry={() => void query.refetch()} />;
  const groups = (query.data ?? []).filter((group) => group.leaderId === profile?.memberId && !group.archivedAt);
  return <section className="my-6 space-y-6" aria-label="My cell group meeting giving">
    <div><h2 className="text-xl font-semibold">My Cell Group Giving</h2><p className="text-sm text-muted-foreground">Record one combined total for each meeting. It appears in your branch’s giving records.</p></div>
    {groups.length ? groups.map((group) => <div key={group.id} className="space-y-3"><h3 className="font-semibold">{group.name}</h3><CellGroupGivingPanel groupId={group.id} /></div>) : <EmptyState title="No active cell group assigned" description="Ask your church administrator to assign you as the leader of your cell group." />}
  </section>;
}
