"use client";
import { RecordActions } from "@/components/shared/record-actions";
import { UrlTabs } from "@/components/shared/url-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { GeneralAttendancePanel } from "@/components/attendance/general-attendance-panel";

import * as React from "react";
import { MeetingAttendanceTable } from "@/components/departments/meeting-attendance-table";
import { CellGroupGivingPanel } from "@/components/giving/cell-group-giving-panel";
import { PermissionLink as Link } from "@/components/shared/permission-link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
  Archive,
  RotateCcw,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/shared/loading-indicator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "@/lib/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { CellGroupFormDialog } from "@/components/departments/cell-group-form-dialog";
import { DeleteCellGroupDialog } from "@/components/departments/delete-cell-group-dialog";
import { CellGroupMemberDialog } from "@/components/departments/cell-group-member-dialog";
import { CellGroupAttendanceDialog } from "@/components/departments/cell-group-attendance-dialog";
import { ArchiveConfirmDialog, type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import {
  useCellGroup,
  useCellGroupAttendance,
  useCellGroupAttendanceSummary,
  useCellGroupMembers,
  useNearestCellGroups,
  useRemoveCellGroupMember,
  useArchiveCellGroup,
  useRestoreArchiveCellGroup,
  useDeleteCellGroup,
} from "@/hooks/use-admin";

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

export default function CellGroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = React.use(params);
  const router = useRouter();
  const { can, canAny } = usePermissions();
  const { data: profile } = useCurrentProfile();
  // Cell group leaders may manage their own group — edit details (minus branch
  // + leader), add/remove members, and record attendance — but get no Archive
  // or Delete affordances.
  const canReadDetails = canAny("cell_groups:details:read");
  const isCellLeader = canAny("cell_groups:own:read") && !canAny("cell_groups:delete");

  const { data: group, isLoading, error } = useCellGroup(groupId);
  // Only the group's own leader (reading their linked member id) may manage it.
  const isOwnGroup =
    isCellLeader &&
    !!group &&
    !!profile?.memberId &&
    profile.memberId === group.leaderId;
  const canManageMembers = can("cell_groups", "create") && (!isCellLeader || isOwnGroup);
  const canUpdate = can("cell_groups", "update") && (!isCellLeader || isOwnGroup);
  const canDelete = can("cell_groups", "delete") && !isCellLeader;
  const { data: members = [], isLoading: membersLoading } = useCellGroupMembers(canReadDetails ? groupId : "",
  );
  const { data: summary } = useCellGroupAttendanceSummary(canReadDetails ? groupId : "",
  );
  const { data: nearestGroups } = useNearestCellGroups(canReadDetails ? group?.latitude : undefined, canReadDetails ? group?.longitude : undefined,
  );

  const [meetingDate, setMeetingDate] = React.useState("");
  const { data: attendance = [], isLoading: attendanceLoading, isError: attendanceError,
  } = useCellGroupAttendance(
    canReadDetails ? groupId : "",
    meetingDate || undefined,
  );

  const removeMember = useRemoveCellGroupMember(groupId);
  const archiveMutation = useArchiveCellGroup();
  const restoreArchiveMutation = useRestoreArchiveCellGroup();
  const purgeMutation = useDeleteCellGroup();

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [archiveAction, setArchiveAction] = React.useState<ArchiveDialogKind | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = React.useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = React.useState(false);

  const handleRemoveMember = (memberId: string) => {
    removeMember.mutate(memberId, {
      onSuccess: () => toast.success("Member removed from cell group"),
      onError: (err) => {
        toast.error("Failed to remove member", {
          description: err?.message || "Please try again.",
        });
      },
    });
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/departments/cell-groups">Cell Groups</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="text-sm text-red-600">Failed to load this cell group.</p>
      </div>
    );
  }

  if (!canReadDetails && group) {
    return (
      <div className="space-y-6">
      <Button asChild variant="outline"><Link href="/departments/cell-groups"><ArrowLeft className="mr-2 size-4" />Cell Groups</Link></Button>
      <div><h1 className="text-2xl font-semibold">{group.name}</h1><p className="text-sm text-muted-foreground">{group.branchName} · Group meeting giving</p></div>
      {canAny("cell_groups:giving:read") ? (
          <CellGroupGivingPanel groupId={groupId} archived={!!group.archivedAt} />
        ) : (
          <p className="text-muted-foreground">You do not have permission to view group giving.</p>
        )}
    </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/departments">Departments</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/departments/cell-groups">Cell Groups</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isLoading ? (
                <LoadingIndicator label="Loading cell group" size="sm" />
              ) : (
                group?.name
              )}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {isLoading || !group ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold">{group.name}</h1>
                  {group.branchName && (
                    <Badge variant="secondary">{group.branchName}</Badge>
                  )}
                  {group.archivedAt && (
                    <Badge variant="destructive">
                      <Archive className="mr-1 h-3 w-3" />
                      Archived
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Leader:{" "}
                  {[group.leaderFirstName, group.leaderLastName].filter(Boolean).join(" ") ||
                    "None assigned"}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {group.meetingDay && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {group.meetingDay}
                      {group.meetingTime && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {group.meetingTime}
                        </span>
                      )}
                    </span>
                  )}
                  {group.address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {group.address}
                    </span>
                  )}
                  {group.latitude != null && group.longitude != null && (
                    <span className="inline-flex items-center gap-1" title="Has location coordinates">
                      <MapPin className="h-3.5 w-3.5" />
                      {group.latitude.toFixed(4)}, {group.longitude.toFixed(4)}
                    </span>
                  )}
                  <span>Added {formatDate(group.createdAt)}</span>
                </div>
              </div>
              <RecordActions>
                {group.archivedAt ? (
                  <>
                    {canUpdate && (
                      <Button variant="outline" onClick={() => setArchiveAction("restore")}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Restore
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setArchiveAction("purge")}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete Forever
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {canUpdate && (
                      <Button variant="outline" onClick={() => setArchiveAction("archive")}>
                        <Archive className="h-4 w-4 mr-1" /> Archive
                      </Button>
                    )}
                    {canUpdate && (
                      <Button variant="outline" onClick={() => setEditOpen(true)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    )}
                  </>
                )}
              </RecordActions>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">Members</p>
              <h3 className="text-2xl font-semibold">{members.length}</h3>
            </div>
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">Meetings Held</p>
              <h3 className="text-2xl font-semibold">{summary?.totalMeetings ?? "—"}</h3>
            </div>
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">Avg Attendance</p>
              <h3 className="text-2xl font-semibold">{summary?.averageAttendance ?? "—"}</h3>
            </div>
          </div>

          <UrlTabs defaultValue="members" values={["members", "attendance", "location", ...(canAny("cell_groups:giving:read") ? ["giving"] : [])]}>
            <TabsList aria-label="Cell group workspace"><TabsTrigger value="members">Members</TabsTrigger><TabsTrigger value="attendance">Attendance</TabsTrigger>{canAny("cell_groups:giving:read") && <TabsTrigger value="giving">Giving</TabsTrigger>}<TabsTrigger value="location">Location</TabsTrigger></TabsList>
<TabsContent value="members" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <section className="rounded-lg border">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" /> Members ({members.length})
                  </p>
                  {canManageMembers && (
                    <Button size="sm" onClick={() => setMemberDialogOpen(true)}>
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> Add Member
                    </Button>
                  )}
                </div>
                {membersLoading ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No members in this cell group yet.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {members.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {m.role.replace(/_/g, " ")} · joined {" "}
                            {formatDate(m.joinedAt)}
                          </p>
                        </div>
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={removeMember.isPending}
                            aria-label={`Remove ${m.firstName} ${m.lastName}`}
                            onClick={() => handleRemoveMember(m.memberId)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>


</TabsContent><TabsContent value="attendance" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <GeneralAttendancePanel
                context={{
                  type: "cell_group",
                  id: groupId,
                  name: group.name,
                  branchId: group.branchId,
                  active: !group.archivedAt,
                }}
                canManage={!isCellLeader || isOwnGroup}
              />

              <MeetingAttendanceTable
                title="Cell group attendance"
                records={attendance}
                loading={attendanceLoading}
                error={attendanceError}
                date={meetingDate}
                onDateChange={setMeetingDate}
                action={
                  canManageMembers ? (
                    <Button
                      size="sm"
                      onClick={() => setAttendanceDialogOpen(true)}
                    >
                      Record Attendance
                    </Button>
                  ) : undefined
                }
              />

</TabsContent><TabsContent value="giving" forceMount className="space-y-4 data-[state=inactive]:hidden">
          {canAny("cell_groups:giving:read") && (
            <CellGroupGivingPanel groupId={groupId} archived={!!group.archivedAt} />
          )}


</TabsContent><TabsContent value="location" forceMount className="space-y-4 data-[state=inactive]:hidden">
            <div className="space-y-6">
              <section className="rounded-lg border">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <UsersRound className="h-4 w-4" /> Nearby Cell Groups
                  </p>
                </div>
                {group.latitude == null || group.longitude == null ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    Add latitude and longitude to this group to see its nearest
                    neighbours.
                  </p>
                ) : !nearestGroups || nearestGroups.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    No nearby groups with coordinates found.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {nearestGroups.map((g) => (
                      <li key={g.id} className="px-4 py-3">
                        <Link
                          href={`/departments/cell-groups/${g.id}`}
                          className="flex items-center justify-between gap-3 hover:text-primary"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {g.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {[g.leaderFirstName, g.leaderLastName]
                                .filter(Boolean)
                                .join(" ") || "No leader"}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {g.distanceKm.toFixed(1)} km
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Attendance records entered here mirror the same
                Member-or-Visitor check-in flow as main services. Walk-in
                visitors can be captured inline and are saved as real visitor
                records.
              </div>
            </div>

</TabsContent>
</UrlTabs>
        </>
      )}

      <CellGroupFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        group={group ?? null}
        lockedLeaderBranch={isOwnGroup}
      />

      <DeleteCellGroupDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        group={group ?? null}
        onDeleted={() => router.push("/departments/cell-groups")}
      />

      <CellGroupMemberDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        groupId={groupId}
        groupName={group?.name ?? ""}
        existingMembers={members}
      />

      <CellGroupAttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        groupId={groupId}
        groupName={group?.name ?? ""}
        members={members}
        loadingMembers={membersLoading}
      />

      <ArchiveConfirmDialog
        open={!!archiveAction}
        onOpenChange={(open) => !open && setArchiveAction(null)}
        kind={archiveAction ?? "archive"}
        entityLabel="cell group"
        targetName={group?.name ?? null}
        targetId={group?.id ?? ""}
        mutation={
          archiveAction === "archive"
            ? archiveMutation
            : archiveAction === "restore"
              ? restoreArchiveMutation
              : purgeMutation
        }
        onConfirmed={
          archiveAction === "purge"
            ? () => router.push("/departments/cell-groups")
            : undefined
        }
      />
    </div>
  );
}
