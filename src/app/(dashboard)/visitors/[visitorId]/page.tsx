"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  CalendarDays,
  User,
  StickyNote,
  Tag,
  AlertTriangle,
  Repeat,
  Archive,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useVisitor,
  useUpdateVisitor,
  useArchiveVisitor,
  useRestoreArchiveVisitor,
  useDeleteVisitor,
  FOLLOW_UP_STATUSES,
  type FollowUpStatus,
} from "@/hooks/use-visitors";
import {
  useAttendanceRecords,
  SERVICE_CATEGORIES,
} from "@/hooks/use-attendance";
import { useUsers } from "@/hooks/use-users";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { VisitorFormDialog } from "@/components/visitors/visitor-form-dialog";
import { DeleteVisitorDialog } from "@/components/visitors/delete-visitor-dialog";
import { ConvertVisitorDialog } from "@/components/visitors/convert-visitor-dialog";

const STATUS_BADGE: Record<FollowUpStatus, { variant: "default" | "secondary" | "destructive" | "outline"; dot: string }> = {
  new: { variant: "default", dot: "bg-blue-500" },
  contacted: { variant: "outline", dot: "bg-purple-500" },
  follow_up_scheduled: { variant: "outline", dot: "bg-amber-500" },
  interested: { variant: "default", dot: "bg-green-500" },
  converted: { variant: "secondary", dot: "bg-emerald-600" },
  dropped_off: { variant: "destructive", dot: "bg-gray-400" },
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

export default function VisitorDetailPage({
  params,
}: {
  params: Promise<{ visitorId: string }>;
}) {
  const { visitorId } = React.use(params);
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdateVisitors = can("visitors", "update");
  const canDeleteVisitors = can("visitors", "delete");

  const { data: visitor, isLoading, error } = useVisitor(visitorId);
  const updateMutation = useUpdateVisitor(visitorId);
  const archiveMutation = useArchiveVisitor();
  const restoreArchiveMutation = useRestoreArchiveVisitor();
  const purgeMutation = useDeleteVisitor();
  const usersQuery = useUsers({ limit: 100, status: "active" });
  // Check-ins linked to this visitor via attendance.visitor_id.
  const visitsQuery = useAttendanceRecords({
    visitorId,
    limit: 200,
    sortBy: "checkinAt",
    sortOrder: "desc",
  });
  const totalVisits = useAttendanceRecords({ visitorId, limit: 1 });

  const [editOpen, setEditOpen] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [archiveAction, setArchiveAction] = React.useState<ArchiveDialogKind | null>(null);

  const [visitPage, setVisitPage] = React.useState(1);
  const [visitPerPage, setVisitPerPage] = React.useState(15);
  const visitsRows = React.useMemo(
    () => visitsQuery.data?.data ?? [],
    [visitsQuery.data]
  );
  const pagedVisits = React.useMemo(
    () => visitsRows.slice((visitPage - 1) * visitPerPage, visitPage * visitPerPage),
    [visitsRows, visitPage, visitPerPage]
  );

  // Optimistic display state so edits reflect instantly.
  const [display, setDisplay] = React.useState<typeof visitor>(undefined);
  React.useEffect(() => {
    if (visitor) setDisplay(visitor);
  }, [visitor]);

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
        <Button variant="ghost" onClick={() => router.push("/visitors")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Visitors
        </Button>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Visitor not found.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isConverted =
    !!display.convertedMemberId || display.followUpStatus === ("converted" as FollowUpStatus);
  const statusBadge = STATUS_BADGE[display.followUpStatus as FollowUpStatus] ?? STATUS_BADGE.new;
  const initials = `${display.firstName.charAt(0)}${(display.lastName ?? "").charAt(0)}`.toUpperCase();
  const fullName = `${display.firstName}${display.lastName ? ` ${display.lastName}` : ""}`;
  const assignee = display.assignedToId
    ? usersQuery.data?.data.find((u) => u.profileId === display.assignedToId)
    : undefined;

  const handleStatusChange = (status: string) => {
    if (!display || status === display.followUpStatus) return;
    const previous = display.followUpStatus;
    setDisplay({ ...display, followUpStatus: status as FollowUpStatus });
    updateMutation.mutate(
      { followUpStatus: status as FollowUpStatus },
      {
        onSuccess: () => {
          toast.success("Follow-up status updated");
        },
        onError: (err) => {
          setDisplay({ ...display, followUpStatus: previous });
          toast.error("Failed to update status", {
            description: err?.message || "Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={() => router.push("/visitors")}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Visitors
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold">{fullName}</h2>
                <Badge variant={statusBadge.variant}>
                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                  {FOLLOW_UP_STATUSES.find((s) => s.value === display.followUpStatus)
                    ?.label ?? display.followUpStatus}
                </Badge>
                {isConverted && display.convertedMemberId && (
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/members/${display.convertedMemberId}`)
                    }
                  >
                    Member Profile
                  </Badge>
                )}
                {display.archivedAt && (
                  <Badge variant="destructive">
                    <Archive className="mr-1 h-3 w-3" />
                    Archived
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {[
                  `First visit ${format(new Date(display.firstVisitDate), "MMM d, yyyy")}`,
                  `Registered ${format(new Date(display.createdAt), "MMM yyyy")}`,
                ].join(" · ")}
              </p>
            </div>
          </div>
          {(canUpdateVisitors || canDeleteVisitors) && (
            <div className="flex items-center gap-2">
              {display.archivedAt ? (
                <>
                  {canUpdateVisitors && (
                    <Button
                      variant="outline"
                      onClick={() => setArchiveAction("restore")}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  )}
                  {canDeleteVisitors && (
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
                  {canDeleteVisitors && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setArchiveAction("archive")}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                  {canUpdateVisitors && !isConverted && (
                    <>
                      <Button variant="outline" onClick={() => setConvertOpen(true)}>
                        <Repeat className="h-4 w-4 mr-2" />
                        Convert to Member
                      </Button>
                      <Button onClick={() => setEditOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Visitor
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <DataRow icon={<Mail className="h-4 w-4" />} label="Email" value={display.email} />
            <DataRow icon={<Phone className="h-4 w-4" />} label="Phone" value={display.phone} />
            <DataRow
              icon={<Phone className="h-4 w-4" />}
              label="WhatsApp"
              value={display.whatsappNumber}
            />
            <DataRow
              icon={<User className="h-4 w-4" />}
              label="Gender"
              value={
                display.gender
                  ? display.gender.charAt(0).toUpperCase() + display.gender.slice(1)
                  : undefined
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Visit &amp; Follow-Up</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <DataRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="First Visit"
              value={format(new Date(display.firstVisitDate), "MMMM d, yyyy")}
            />
            <div className="flex items-center gap-3 py-2">
              <div className="flex items-center gap-2 w-40 shrink-0 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Status</span>
              </div>
              {canUpdateVisitors && !isConverted ? (
                <Select
                  value={display.followUpStatus}
                  onValueChange={handleStatusChange}
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="w-44 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOW_UP_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm font-medium">
                  {FOLLOW_UP_STATUSES.find((s) => s.value === display.followUpStatus)
                    ?.label ?? display.followUpStatus}
                </span>
              )}
            </div>
            <DataRow
              icon={<User className="h-4 w-4" />}
              label="Assigned To"
              value={assignee ? `${assignee.firstName} ${assignee.lastName}` : undefined}
            />
          </CardContent>
        </Card>
      </div>

      {/* Visit history */}
      <TableCard
        title="Visit History"
        action={
          <span className="text-xs text-muted-foreground">
            {(totalVisits.data?.meta.total ?? 0) === 0
              ? visitsQuery.isLoading
                ? ""
                : "No check-ins yet"
              : `${totalVisits.data?.meta.total ?? 0} check-in(s)`}
          </span>
        }
        itemName="check-ins"
        page={visitPage}
        perPage={visitPerPage}
        total={totalVisits.data?.meta.total ?? visitsRows.length}
        onPageChange={setVisitPage}
        onPerPageChange={(n) => {
          setVisitPerPage(n);
          setVisitPage(1);
        }}
      >
        {visitsQuery.isLoading ? (
          <div className="px-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : visitsRows.length === 0 ? (
          <p className="px-6 text-sm text-muted-foreground">
            No check-ins recorded for this visitor yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Checked In</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedVisits.map((visit) => (
                <TableRow key={visit.attendanceId}>
                  <TableCell className="font-medium">
                    {visit.serviceName || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(visit.checkInAt), "MMM d, yyyy · HH:mm")}
                  </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {SERVICE_CATEGORIES.find(
                            (c) => c.value === (visit.category ?? "adult")
                          )?.label ?? "Adult"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                    {visit.source}
                  </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

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

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {display.notes ? (
            <p className="text-sm whitespace-pre-wrap">{display.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          )}
        </CardContent>
      </Card>

      <VisitorFormDialog
        open={editOpen}
        onOpenChange={(open) => !open && setEditOpen(false)}
        visitor={display}
        onSaved={(saved) => setDisplay(saved)}
      />
      {!isConverted && (
        <ConvertVisitorDialog
          open={convertOpen}
          onOpenChange={(open) => !open && setConvertOpen(false)}
          visitor={display}
          onConverted={() => router.push("/visitors")}
        />
      )}
      <DeleteVisitorDialog
        open={deleteOpen}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
        visitors={[display]}
        onDeleted={() => router.push("/visitors")}
      />
      <ArchiveConfirmDialog
        open={!!archiveAction}
        onOpenChange={(open) => !open && setArchiveAction(null)}
        kind={archiveAction ?? "archive"}
        entityLabel="visitor"
        targetName={fullName}
        targetId={display.id}
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
