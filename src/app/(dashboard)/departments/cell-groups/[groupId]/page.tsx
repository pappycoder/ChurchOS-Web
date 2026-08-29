"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { CellGroupFormDialog } from "@/components/departments/cell-group-form-dialog";
import { DeleteCellGroupDialog } from "@/components/departments/delete-cell-group-dialog";
import { CellGroupMemberDialog } from "@/components/departments/cell-group-member-dialog";
import { CellGroupAttendanceDialog } from "@/components/departments/cell-group-attendance-dialog";
import { ArchiveConfirmDialog, type ArchiveDialogKind } from "@/components/shared/archive-confirm-dialog";
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
  const { can } = usePermissions();
  const canCreate = can("cell_groups", "create");
  const canUpdate = can("cell_groups", "update");
  const canDelete = can("cell_groups", "delete");

  const { data: group, isLoading, error } = useCellGroup(groupId);
  const { data: members = [], isLoading: membersLoading } = useCellGroupMembers(groupId);
  const { data: summary } = useCellGroupAttendanceSummary(groupId);
  const { data: nearestGroups } = useNearestCellGroups(group?.latitude, group?.longitude);

  const [meetingDate, setMeetingDate] = React.useState("");
  const { data: attendance = [], isLoading: attendanceLoading } = useCellGroupAttendance(
    groupId,
    meetingDate || undefined
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
            <BreadcrumbPage>{isLoading ? "Loading..." : group?.name}</BreadcrumbPage>
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
                  <h2 className="text-2xl font-semibold">{group.name}</h2>
                  {group.branchName && <Badge variant="secondary">{group.branchName}</Badge>}
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
              <div className="flex gap-2">
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
                    {canDelete && (
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
              </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="rounded-lg border">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" /> Members ({members.length})
                  </p>
                  {canCreate && (
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
                            {m.role.replace(/_/g, " ")} · joined {formatDate(m.joinedAt)}
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

              <section className="rounded-lg border">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" /> Attendance Records ({attendance.length})
                  </p>
                  {canCreate && (
                    <Button size="sm" onClick={() => setAttendanceDialogOpen(true)}>
                      <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> Record Attendance
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                  <Label htmlFor="meeting-date-filter" className="text-sm text-muted-foreground shrink-0">
                    Meeting date
                  </Label>
                  <Input
                    id="meeting-date-filter"
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-44"
                  />
                  {meetingDate && (
                    <Button variant="ghost" size="sm" onClick={() => setMeetingDate("")}>
                      Clear
                    </Button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Attendee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceLoading ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        </TableRow>
                      ) : attendance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                            {meetingDate
                              ? "No attendance recorded for this date."
                              : "No attendance recorded yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {record.memberId ? (
                                <p className="font-medium">
                                  {record.firstName} {record.lastName}
                                </p>
                              ) : (
                                <div>
                                  <p className="font-medium">{record.visitorName || "Visitor"}</p>
                                  <span className="mt-0.5 inline-block">
                                    <Badge variant="outline" className="text-purple-600">
                                      Visitor
                                    </Badge>
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  record.status === "present" || record.status === "late"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="capitalize"
                              >
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(record.meetingDate)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {record.notes ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-lg border">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <UsersRound className="h-4 w-4" /> Nearby Cell Groups
                  </p>
                </div>
                {group.latitude == null || group.longitude == null ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    Add latitude and longitude to this group to see its nearest neighbours.
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
                            <p className="text-sm font-medium truncate">{g.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[g.leaderFirstName, g.leaderLastName]
                                .filter(Boolean)
                                .join(" ") || "No leader"}
                            </p>
                          </div>
                          <Badge variant="secondary">{g.distanceKm.toFixed(1)} km</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Attendance records entered here mirror the same Member-or-Visitor check-in flow
                as main services. Walk-in visitors can be captured inline and are saved as
                real visitor records.
              </div>
            </div>
          </div>
        </>
      )}

      <CellGroupFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        group={group ?? null}
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
          archiveAction === "purge" ? () => router.push("/departments/cell-groups") : undefined
        }
      />
    </div>
  );
}