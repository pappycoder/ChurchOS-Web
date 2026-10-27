"use client";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { RecordActions } from "@/components/shared/record-actions";
import { UrlTabs } from "@/components/shared/url-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { LiveCallButton } from "@/components/members/live-call-button";
import { ErrorState } from "@/components/shared/error-state";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getToastErrorMessage, toast } from "@/lib/toast";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  User,
  HandCoins,
  CalendarCheck,
  StickyNote,
  Tag,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableCard } from "@/components/shared/table-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useMember,
  useMemberGivingHistory,
  useMemberAttendanceHistory,
  useAddMemberNote,
  useArchiveMember,
  useRestoreArchiveMember,
  useDeleteMember,
  type MemberStatus,
} from "@/hooks/use-members";
import { useBranchesList } from "@/hooks/use-branches";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog";

const STATUS_BADGE: Record<MemberStatus, { variant: "default" | "secondary" | "destructive" | "outline"; dot: string }> = {
  active: { variant: "default", dot: "bg-green-500" },
  inactive: { variant: "secondary", dot: "bg-gray-400" },
  suspended: { variant: "destructive", dot: "bg-red-500" },
  transferred: { variant: "outline", dot: "bg-blue-500" },
};

function DataRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex items-center gap-2 w-40 shrink-0 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium break-words min-w-0">{value || "-"}</span>
    </div>
  );
}

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = React.use(params);
  const router = useRouter();
  const { can, canAny } = usePermissions();
  const canUpdateMembers = can("members:all", "update");
  const canDeleteMembers = can("members:all", "delete");

  const { data: member, isLoading, error } = useMember(memberId);
  const givingQuery = useMemberGivingHistory(memberId);
  const attendanceQuery = useMemberAttendanceHistory(memberId);
  const branchesQuery = useBranchesList({ limit: 100 });
  const addNoteMutation = useAddMemberNote(memberId);
  const archiveMutation = useArchiveMember();
  const restoreArchiveMutation = useRestoreArchiveMember();
  const purgeMutation = useDeleteMember();

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [archiveAction, setArchiveAction] = React.useState<ArchiveDialogKind | null>(null);
  const [noteDraft, setNoteDraft] = React.useState("");
  useUnsavedChanges(!!noteDraft.trim());

  const [givePage, setGivePage] = React.useState(1);
  const [givePerPage, setGivePerPage] = React.useState(15);
  const [attPage, setAttPage] = React.useState(1);
  const [attPerPage, setAttPerPage] = React.useState(15);

  const givingRows = React.useMemo(
    () => givingQuery.data?.data ?? [],
    [givingQuery.data]
  );
  const attendanceRows = React.useMemo(
    () => attendanceQuery.data?.data ?? [],
    [attendanceQuery.data]
  );
  const pagedGiving = React.useMemo(
    () => givingRows.slice((givePage - 1) * givePerPage, givePage * givePerPage),
    [givingRows, givePage, givePerPage]
  );
  const pagedAttendance = React.useMemo(
    () => attendanceRows.slice((attPage - 1) * attPerPage, attPage * attPerPage),
    [attendanceRows, attPage, attPerPage]
  );

  // Optimistic display state so dialog edits reflect instantly.
  const [display, setDisplay] = React.useState<typeof member>(undefined);
  React.useEffect(() => {
    if (member) setDisplay(member);
  }, [member]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !display) {
    return (
      <div>
        <Button variant="ghost" onClick={() => { if (confirmDiscardChanges()) router.push("/members"); }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
        <ErrorState />
      </div>
    );
  }

  const branchName = display.branchId
    ? branchesQuery.data?.data.find((b) => b.branchId === display.branchId)?.name
    : undefined;
  const statusBadge = STATUS_BADGE[display.status as MemberStatus] ?? STATUS_BADGE.inactive;
  const initials = `${display.firstName.charAt(0)}${display.lastName.charAt(0)}`.toUpperCase();

  const handleAddNote = () => {
    const note = noteDraft.trim();
    if (!note) return;
    addNoteMutation.mutate(note, {
      onSuccess: () => {
        setNoteDraft("");
        toast.success("Note added");
      },
      onError: (e) =>
        toast.error(getToastErrorMessage(e, "Failed to add note")),
    });
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={() => { if (confirmDiscardChanges()) router.push("/members"); }}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Members
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {display.photoUrl && (
                <AvatarImage src={display.photoUrl} alt={`${display.firstName} ${display.lastName}`} />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">
                  {display.firstName} {display.lastName}
                </h1>
                <Badge variant={statusBadge.variant}>
                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                  {display.status.charAt(0).toUpperCase() + display.status.slice(1)}
                </Badge>
                {display.archivedAt && (
                  <Badge variant="destructive">
                    <Archive className="mr-1 h-3 w-3" />
                    Archived
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {[
                  branchName,
                  `Member since ${format(new Date(display.memberSince), "MMM yyyy")}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <LiveCallButton memberId={display.memberId} memberName={`${display.firstName} ${display.lastName}`} disabled={!display.phone || !!display.archivedAt} />
          {(canUpdateMembers || canDeleteMembers) && (
            <RecordActions>
              {display.archivedAt ? (
                <>
                  {canUpdateMembers && (
                    <Button
                      variant="outline"
                      onClick={() => setArchiveAction("restore")}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  )}
                  {canDeleteMembers && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setArchiveAction("purge")}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Forever
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {canDeleteMembers && display.status !== "inactive" && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                  )}
                  {canUpdateMembers && (
                    <Button variant="outline" onClick={() => setArchiveAction("archive")}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  )}
                  {canUpdateMembers && (
                    <Button onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Member
                    </Button>
                  )}
                </>
              )}
            </RecordActions>
          )}
        </CardContent>
      </Card>

      <UrlTabs defaultValue="overview" values={["overview", "attendance", ...(canAny("giving:records:read") ? ["giving"] : [])]}>
        <TabsList aria-label="Member workspace"><TabsTrigger value="overview">Overview & notes</TabsTrigger><TabsTrigger value="attendance">Attendance</TabsTrigger>{canAny("giving:records:read") && <TabsTrigger value="giving">Giving</TabsTrigger>}</TabsList>
<TabsContent value="overview" forceMount className="space-y-4 data-[state=inactive]:hidden">
      {/* Info cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <DataRow icon={<Mail className="h-4 w-4" />} label="Email" value={display.email} />
            <DataRow icon={<Phone className="h-4 w-4" />} label="Phone" value={display.phone} />
            <DataRow icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={display.whatsappNumber} />
            <DataRow icon={<User className="h-4 w-4" />} label="Gender" value={display.gender ? display.gender.charAt(0).toUpperCase() + display.gender.slice(1) : undefined} />
            <DataRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Date of Birth"
              value={display.dateOfBirth ? format(new Date(display.dateOfBirth), "MMM d, yyyy") : undefined}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Location & Membership</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <DataRow icon={<MapPin className="h-4 w-4" />} label="Address" value={display.address} />
            <DataRow icon={<MapPin className="h-4 w-4" />} label="City" value={display.city} />
            <DataRow icon={<MapPin className="h-4 w-4" />} label="State" value={display.state} />
            <DataRow icon={<User className="h-4 w-4" />} label="Branch" value={branchName} />
            <DataRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Member Since"
              value={format(new Date(display.memberSince), "MMMM d, yyyy")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Custom fields */}
      {display.customFields && Object.keys(display.customFields).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Custom Fields
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {Object.entries(display.customFields)
              .filter(([, value]) => value !== null && value !== undefined)
              .map(([key, value]) => (
                <DataRow key={key} label={key} value={String(value)} />
              ))}
          </CardContent>
        </Card>
      )}

      {/* Admin notes */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {display.notes && (
            <p className="text-sm whitespace-pre-wrap rounded-lg border bg-muted/40 p-3">
              {display.notes}
            </p>
          )}
          {canUpdateMembers && (
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Add an admin note for this member..."
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!noteDraft.trim() || addNoteMutation.isPending}
                >
                  {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


</TabsContent><TabsContent value="attendance" forceMount className="space-y-4 data-[state=inactive]:hidden">
      {/* Attendance history */}
      <TableCard
        title={
          <span className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Attendance History
          </span>
        }
        action={<span className="text-xs text-muted-foreground">{attendanceRows.length} check-in(s)</span>}
        itemName="records"
        page={attPage}
        perPage={attPerPage}
        total={attendanceRows.length}
        onPageChange={setAttPage}
        onPerPageChange={(n) => {
          setAttPerPage(n);
          setAttPage(1);
        }}
      >
        {attendanceQuery.isError ? <ErrorState title="Unable to load attendance history" /> : attendanceQuery.isLoading ? (
          <div className="px-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : attendanceRows.length === 0 ? (
          <p className="px-6 text-sm text-muted-foreground">No attendance records yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Checked In</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedAttendance.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium">{rec.serviceName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(rec.checkInAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {rec.source}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>


</TabsContent><TabsContent value="giving" forceMount className="space-y-4 data-[state=inactive]:hidden">
      {/* Giving history */}
      {canAny("giving:records:read") && <TableCard
        title={
          <span className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Giving History
          </span>
        }
        action={<span className="text-xs text-muted-foreground">{givingRows.length} record(s)</span>}
        itemName="records"
        page={givePage}
        perPage={givePerPage}
        total={givingRows.length}
        onPageChange={setGivePage}
        onPerPageChange={(n) => {
          setGivePerPage(n);
          setGivePage(1);
        }}
      >
        {givingQuery.isError ? <ErrorState title="Unable to load giving history" /> : givingQuery.isLoading ? (
          <div className="px-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : givingRows.length === 0 ? (
          <p className="px-6 text-sm text-muted-foreground">No giving records yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedGiving.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">
                    {format(parseISO(tx.givingDate ?? tx.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {tx.currency} {Number(tx.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.status === "success" ? "default" : "secondary"}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>}


</TabsContent>
</UrlTabs>
      <MemberFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditOpen(false);
        }}
        member={display}
        onSaved={(saved) => setDisplay(saved)}
      />
      <DeleteMemberDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        members={[display]}
        onDeleted={() => router.push("/members")}
      />
      <ArchiveConfirmDialog
        open={!!archiveAction}
        onOpenChange={(open) => !open && setArchiveAction(null)}
        kind={archiveAction ?? "archive"}
        entityLabel="member"
        targetName={`${display.firstName} ${display.lastName}`}
        targetId={display.memberId}
        mutation={
          archiveAction === "archive"
            ? archiveMutation
            : archiveAction === "restore"
              ? restoreArchiveMutation
              : purgeMutation
        }
      />
    </div>
  );
}
