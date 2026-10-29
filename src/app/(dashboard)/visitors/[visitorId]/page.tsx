"use client";
import { DetailManagementMenu } from "@/components/shared/detail-management-menu";
import {
  VisitorAvatar,
  VisitorStatusBadge,
  VisitorSectionHeading,
  visitorWorkspaceClass,
} from "@/components/visitors/visitor-presentation";
import { PermissionLink } from "@/components/shared/permission-link";
import { UrlTabs } from "@/components/shared/url-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { ErrorState } from "@/components/shared/error-state";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  CalendarDays,
  Building2,
  User,
  StickyNote,
  Tag,
  Repeat,
  Archive,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ATTENDANCE_CATEGORIES,
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
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-3">
      <div className="flex items-center gap-2 w-40 shrink-0 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium break-words min-w-0">
        {value || "-"}
      </span>
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
  const managementRef = React.useRef<HTMLButtonElement>(null);
  const restoreEditFocus = React.useRef(false);
  const { can } = usePermissions();
  const canUpdateVisitors = can("visitors:list", "update");
  const canConvertVisitor = can("visitors:followup", "update");
  const canDeleteVisitors = can("visitors:list", "delete");

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
  const totalVisits = visitsQuery.data?.meta.total;

  const [editOpen, setEditOpen] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [archiveAction, setArchiveAction] =
    React.useState<ArchiveDialogKind | null>(null);

  const [visitPage, setVisitPage] = React.useState(1);
  const [visitPerPage, setVisitPerPage] = React.useState(15);
  const visitsRows = React.useMemo(
    () => visitsQuery.data?.data ?? [],
    [visitsQuery.data],
  );
  const pagedVisits = React.useMemo(
    () =>
      visitsRows.slice(
        (visitPage - 1) * visitPerPage,
        visitPage * visitPerPage,
      ),
    [visitsRows, visitPage, visitPerPage],
  );

  // Optimistic display state so edits reflect instantly.
  const [display, setDisplay] = React.useState<typeof visitor>(undefined);
  React.useEffect(() => {
    if (visitor) setDisplay(visitor);
  }, [visitor]);

  React.useEffect(() => {
    if (
      !editOpen &&
      !isLoading &&
      restoreEditFocus.current &&
      managementRef.current
    ) {
      managementRef.current.focus();
      restoreEditFocus.current = false;
    }
  }, [editOpen, isLoading]);
  if (isLoading) {
    return (
      <div className={`${visitorWorkspaceClass} space-y-4`}>
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
        <Button
          variant="ghost"
          onClick={() => {
            if (confirmDiscardChanges()) router.push("/visitors");
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Visitors
        </Button>
        <ErrorState />
      </div>
    );
  }

  const isConverted =
    !!display.convertedMemberId ||
    display.followUpStatus === ("converted" as FollowUpStatus);
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
      },
    );
  };

  return (
    <div className={`${visitorWorkspaceClass} space-y-4`}>
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={() => {
          if (confirmDiscardChanges()) router.push("/visitors");
        }}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Visitors
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="flex items-start justify-between gap-3 p-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <VisitorAvatar
              id={display.id}
              name={fullName}
              className="size-11"
            />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2 flex-wrap">
                <h1 className="break-words text-xl font-semibold">
                  {fullName}
                </h1>
                <VisitorStatusBadge status={display.followUpStatus} />
                {isConverted &&
                  display.convertedMemberId &&
                  can("members:all", "read") && (
                    <Badge variant="outline" asChild>
                      <PermissionLink
                        href={`/members/${display.convertedMemberId}`}
                      >
                        Member Profile
                      </PermissionLink>
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
          <DetailManagementMenu
            label="Visitor management"
            triggerRef={managementRef}
            actions={[
              ...(!display.archivedAt && !isConverted && canUpdateVisitors
                ? [
                    {
                      label: "Edit Visitor",
                      icon: Pencil,
                      onSelect: () => setEditOpen(true),
                    },
                  ]
                : []),
              ...(!display.archivedAt && !isConverted && canConvertVisitor
                ? [
                    {
                      label: "Convert to Member",
                      icon: Repeat,
                      onSelect: () => setConvertOpen(true),
                    },
                  ]
                : []),
              ...(canUpdateVisitors
                ? [
                    {
                      label: display.archivedAt ? "Restore" : "Archive",
                      icon: display.archivedAt ? RotateCcw : Archive,
                      onSelect: () =>
                        setArchiveAction(
                          display.archivedAt ? "restore" : "archive",
                        ),
                    },
                  ]
                : []),
              ...(canDeleteVisitors
                ? [
                    {
                      label: display.archivedAt ? "Delete Forever" : "Delete",
                      icon: Trash2,
                      destructive: true,
                      onSelect: () =>
                        display.archivedAt
                          ? setArchiveAction("purge")
                          : setDeleteOpen(true),
                    },
                  ]
                : []),
            ]}
          />
        </CardContent>
      </Card>

      <UrlTabs defaultValue="overview" values={["overview", "history"]}>
        <TabsList aria-label="Visitor workspace">
          <TabsTrigger value="overview">Follow-up & details</TabsTrigger>
          <TabsTrigger value="history">Visit history</TabsTrigger>
        </TabsList>
        <TabsContent
          value="overview"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          {/* Info cards */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  <VisitorSectionHeading>
                    Contact Information
                  </VisitorSectionHeading>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <DataRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={display.email}
                />
                <DataRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={display.phone}
                />
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
                      ? display.gender.charAt(0).toUpperCase() +
                        display.gender.slice(1)
                      : undefined
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  <VisitorSectionHeading>
                    Visit &amp; Follow-Up
                  </VisitorSectionHeading>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <DataRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Branch"
                  value={
                    display.branchName ||
                    (display.branchId
                      ? "Branch name unavailable"
                      : "Not assigned")
                  }
                />
                <DataRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="First Visit"
                  value={format(
                    new Date(display.firstVisitDate),
                    "MMMM d, yyyy",
                  )}
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
                      {FOLLOW_UP_STATUSES.find(
                        (s) => s.value === display.followUpStatus,
                      )?.label ?? display.followUpStatus}
                    </span>
                  )}
                </div>
                <DataRow
                  icon={<User className="h-4 w-4" />}
                  label="Assigned To"
                  value={
                    display.assignedToName ||
                    (assignee
                      ? `${assignee.firstName} ${assignee.lastName}`
                      : undefined)
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Visit history */}

          {/* Custom fields */}
          {display.customFields &&
            Object.keys(display.customFields).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Custom Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                  {Object.entries(display.customFields)
                    .filter(
                      ([, value]) => value !== null && value !== undefined,
                    )
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
        </TabsContent>
        <TabsContent
          value="history"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <TableCard
            title="Visit History"
            action={
              <span className="text-xs text-muted-foreground">
                {(totalVisits ?? 0) === 0
                  ? visitsQuery.isLoading
                    ? ""
                    : "No check-ins yet"
                  : `${totalVisits ?? 0} check-in(s)`}
              </span>
            }
            itemName="check-ins"
            page={visitPage}
            perPage={visitPerPage}
            total={totalVisits ?? visitsRows.length}
            onPageChange={setVisitPage}
            onPerPageChange={(n) => {
              setVisitPerPage(n);
              setVisitPage(1);
            }}
          >
            {visitsQuery.isError ? (
              <ErrorState title="Unable to load visit history" />
            ) : visitsQuery.isLoading ? (
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
                        {format(
                          new Date(visit.checkInAt),
                          "MMM d, yyyy · HH:mm",
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ATTENDANCE_CATEGORIES.find(
                            (c) => c.value === (visit.category ?? "adult"),
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
        </TabsContent>
      </UrlTabs>
      <VisitorFormDialog
        presentationClassName={visitorWorkspaceClass}
        returnFocusRef={managementRef}
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            restoreEditFocus.current = true;
            setEditOpen(false);
          }
        }}
        visitor={display}
        onSaved={(saved) => setDisplay(saved)}
      />
      {!isConverted && (
        <ConvertVisitorDialog
          presentationClassName={visitorWorkspaceClass}
          returnFocusRef={managementRef}
          open={convertOpen}
          onOpenChange={(open) => !open && setConvertOpen(false)}
          visitor={display}
          onConverted={() => router.push("/visitors")}
        />
      )}
      <DeleteVisitorDialog
        presentationClassName={visitorWorkspaceClass}
        returnFocusRef={managementRef}
        open={deleteOpen}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
        visitors={[display]}
        onDeleted={() => router.push("/visitors")}
      />
      <ArchiveConfirmDialog
        returnFocusRef={managementRef}
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
