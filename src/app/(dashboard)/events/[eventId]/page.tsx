"use client";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";
import { BranchDetail } from "@/components/shared/branch-assignment";
import { GeneralAttendancePanel } from "@/components/attendance/general-attendance-panel";
import { RegisterAttendeeButton } from "@/components/events/register-attendee-button";

import { ErrorState } from "@/components/shared/error-state";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Users,
  UserCheck,
  UserX,
  Footprints,
  Ticket,
  Archive,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UrlTabs } from "@/components/shared/url-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDeleteDialog } from "@/components/pastoral/confirm-delete-dialog";
import { DetailManagementMenu } from "@/components/shared/detail-management-menu";
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
  EventsHeader as PageHeader,
  eventsWorkspaceClass,
  EventTypeBadge,
  EventStateBadge,
} from "@/components/events/event-presentation";
import {
  useEvent,
  useEventRegistrations,
  useEventAttendance,
  useEventStats,
  useDeleteEvent,
  useArchiveEvent,
  useRestoreArchiveEvent,
  type EventItem,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = React.use(params);
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdate = can("events", "update");
  const canReadTiers = can("events:tickets", "read");
  const canDelete = can("events", "delete");
  const canCheckIn = can("events:checkin", "create");
  const canRegister = can("events:registrations", "create");
  const canReadRegistrations = can("events:registrations", "read");
  const canReadAttendance = can("events:checkin", "read");

  const showRegistrations = canReadRegistrations || canRegister;
  const showAttendance = canReadAttendance || canCheckIn;

  const eventQuery = useEvent(eventId);
  const registrationsQuery = useEventRegistrations(eventId);
  const attendanceQuery = useEventAttendance(eventId);
  const statsQuery = useEventStats(eventId);
  const deleteMutation = useDeleteEvent();
  const archiveMutation = useArchiveEvent();
  const restoreArchiveMutation = useRestoreArchiveEvent();

  const eventActionsRef = React.useRef<HTMLButtonElement>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    event: EventItem;
  } | null>(null);
  const [regPage, setRegPage] = React.useState(1);
  const [regPerPage, setRegPerPage] = React.useState(15);
  const [attPage, setAttPage] = React.useState(1);
  const [attPerPage, setAttPerPage] = React.useState(15);

  const pagedRegistrations = React.useMemo(() => {
    const rows = registrationsQuery.data ?? [];
    return rows.slice((regPage - 1) * regPerPage, regPage * regPerPage);
  }, [registrationsQuery.data, regPage, regPerPage]);

  const pagedAttendance = React.useMemo(() => {
    const rows = attendanceQuery.data ?? [];
    return rows.slice((attPage - 1) * attPerPage, attPage * attPerPage);
  }, [attendanceQuery.data, attPage, attPerPage]);

  const isLoading = eventQuery.isLoading;
  const event = eventQuery.data;

  if (isLoading) {
    return (
      <div className={`${eventsWorkspaceClass} space-y-4`}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (eventQuery.error || !event) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirmDiscardChanges()) router.push("/events/list");
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <ErrorState />
      </div>
    );
  }

  const isPast = new Date(event.startDate) < new Date();
  const stats = statsQuery.data;
  const registrations = registrationsQuery.data ?? [];
  const attendance = attendanceQuery.data ?? [];

  const handleDelete = () => {
    deleteMutation.mutate(eventId, {
      onSuccess: () => {
        toast.success("Event deleted");
        router.push("/events/list");
      },
      onError: (err) => {
        toast.error("Failed to delete event", {
          description: err?.message || "Please try again.",
        });
      },
    });
  };

  return (
    <div className={`${eventsWorkspaceClass} space-y-4`}>
      <PageHeader
        title={event.title}
        breadcrumbs={[
          { label: "Events", href: "/events/list" },
          { label: event.title },
        ]}
        action={
          <DetailManagementMenu
            label="Event management"
            triggerRef={eventActionsRef}
            actions={[
              ...(!event.archivedAt && canUpdate
                ? [
                    {
                      label: "Edit",
                      icon: Pencil,
                      onSelect: () => {
                        if (confirmDiscardChanges())
                          router.push(`/events/${eventId}/edit`);
                      },
                    },
                  ]
                : []),
              ...(!event.archivedAt && !event.isFree && canReadTiers
                ? [
                    {
                      label: "Manage Tiers",
                      icon: Ticket,
                      onSelect: () => {
                        if (confirmDiscardChanges())
                          router.push(`/events/${eventId}/tiers`);
                      },
                    },
                  ]
                : []),
              ...(canUpdate
                ? [
                    {
                      label: event.archivedAt ? "Restore" : "Archive",
                      icon: event.archivedAt ? RotateCcw : Archive,
                      onSelect: () =>
                        setArchiveTarget({
                          kind: event.archivedAt ? "restore" : "archive",
                          event,
                        }),
                    },
                  ]
                : []),
              ...(canDelete
                ? [
                    {
                      label: event.archivedAt ? "Delete Forever" : "Delete",
                      icon: Trash2,
                      destructive: true,
                      onSelect: () =>
                        event.archivedAt
                          ? setArchiveTarget({ kind: "purge", event })
                          : setDeleteOpen(true),
                    },
                  ]
                : []),
            ]}
          />
        }
      />
      <section
        aria-label="Event details"
        className="space-y-3 rounded-xl border bg-card p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <EventTypeBadge type={event.type} />
          <EventStateBadge status={isPast ? "Past" : "Upcoming"} />
          {event.isFree && <Badge variant="secondary">Free</Badge>}
          {event.archivedAt && <EventStateBadge status="Archived" />}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {format(new Date(event.startDate), "MMM d, yyyy · HH:mm")}
            {event.endDate
              ? ` – ${format(new Date(event.endDate), "MMM d, yyyy · HH:mm")}`
              : ""}
          </span>
          {event.location && (
            <span className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="break-words">{event.location}</span>
            </span>
          )}
          <span>
            {event.capacity
              ? `${event.registrationCount}/${event.capacity} registered`
              : `${event.registrationCount} registered`}
          </span>
        </div>
        <BranchDetail record={event} />
        {event.description && (
          <p className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-relaxed">
            {event.description}
          </p>
        )}
      </section>

      <dl
        aria-label="Event summary"
        className="grid grid-cols-2 gap-x-6 gap-y-3 border-b pb-4 lg:grid-cols-4"
      >
        {[
          {
            label: "Registered",
            icon: Users,
            value:
              !canReadRegistrations || registrationsQuery.isError
                ? "—"
                : registrationsQuery.isLoading
                  ? "..."
                  : stats.registered.toLocaleString(),
          },
          {
            label: "Named Check-Ins",
            icon: UserCheck,
            value:
              !canReadAttendance || attendanceQuery.isError
                ? "—"
                : attendanceQuery.isLoading
                  ? "..."
                  : stats.attended.toLocaleString(),
          },
          {
            label: "No-Shows",
            icon: UserX,
            value:
              !canReadRegistrations ||
              !canReadAttendance ||
              registrationsQuery.isError ||
              attendanceQuery.isError
                ? "—"
                : statsQuery.isLoading
                  ? "..."
                  : stats.noShows.toLocaleString(),
          },
          {
            label: "Walk-Ins",
            icon: Footprints,
            value:
              !canReadAttendance || attendanceQuery.isError
                ? "—"
                : attendanceQuery.isLoading
                  ? "..."
                  : stats.walkIns.toLocaleString(),
          },
        ].map(({ label, icon: Icon, value }) => (
          <div key={label} className="space-y-1 py-2">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </dt>
            <dd className="text-base font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {(showRegistrations || showAttendance) && (
        <UrlTabs
          defaultValue={showRegistrations ? "registrations" : "attendance"}
          values={[
            ...(showRegistrations ? ["registrations"] : []),
            ...(showAttendance ? ["attendance"] : []),
          ]}
          className="gap-4"
        >
          <TabsList aria-label="Event workspace">
            {showRegistrations && (
              <TabsTrigger value="registrations">Registrations</TabsTrigger>
            )}
            {showAttendance && (
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            )}
          </TabsList>
          {showRegistrations && (
            <TabsContent
              value="registrations"
              forceMount
              className="data-[state=inactive]:hidden"
            >
              {/* Registration controls apply only to this roster. */}
              <TableCard
                title={<h2>Registrations</h2>}
                description="People with a reserved place. Registration does not mark attendance."
                action={<RegisterAttendeeButton event={event} />}
                itemName="registrations"
                page={regPage}
                perPage={regPerPage}
                total={registrations.length}
                onPageChange={setRegPage}
                onPerPageChange={(n) => {
                  setRegPerPage(n);
                  setRegPage(1);
                }}
              >
                {!canReadRegistrations ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    You can register attendees, but your role cannot view the
                    registration roster.
                  </p>
                ) : registrationsQuery.isError ? (
                  <ErrorState title="Unable to load registrations" />
                ) : registrationsQuery.isLoading ? (
                  <div className="px-6 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : registrations.length === 0 ? (
                  <p className="px-6 text-sm text-muted-foreground">
                    No registrations for this event yet.
                  </p>
                ) : (
                  <Table exportable>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Checked In</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedRegistrations.map((reg) => (
                        <TableRow key={reg.registrationId}>
                          <TableCell className="font-medium">
                            {reg.memberName || reg.memberId}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {reg.tierName || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                reg.paymentStatus === "success"
                                  ? "default"
                                  : reg.paymentStatus === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {reg.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={reg.checkedIn ? "default" : "secondary"}
                            >
                              {reg.checkedIn ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(reg.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableCard>
            </TabsContent>
          )}
          {showAttendance && (
            <TabsContent
              value="attendance"
              forceMount
              className="space-y-4 data-[state=inactive]:hidden"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Attendance</h2>
                  <p className="text-sm text-muted-foreground">
                    Record aggregate totals or review individual check-ins for
                    this event.
                  </p>
                </div>
                {canCheckIn && !event.archivedAt && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (confirmDiscardChanges())
                        router.push(
                          `/events/check-in?eventId=${encodeURIComponent(eventId)}`,
                        );
                    }}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Check In Attendees
                  </Button>
                )}
              </div>
              <GeneralAttendancePanel
                context={{
                  type: "event",
                  id: eventId,
                  name: event.title,
                  branchId: event.branchId,
                  active: !event.archivedAt,
                }}
              />

              {/* Named attendance is independently permission gated. */}
              {canReadAttendance && (
                <TableCard
                  title={<h3>Named Check-Ins</h3>}
                  description="Individual attendees recorded at check-in; aggregate totals are managed separately above."
                  action={
                    <span className="text-xs text-muted-foreground">
                      {attendanceQuery.isLoading
                        ? ""
                        : attendance.length === 0
                          ? "No records"
                          : `${attendance.length} record(s)`}
                    </span>
                  }
                  itemName="records"
                  page={attPage}
                  perPage={attPerPage}
                  total={attendance.length}
                  onPageChange={setAttPage}
                  onPerPageChange={(n) => {
                    setAttPerPage(n);
                    setAttPage(1);
                  }}
                >
                  {attendanceQuery.isError ? (
                    <ErrorState title="Unable to load named check-ins" />
                  ) : attendanceQuery.isLoading ? (
                    <div className="px-6 space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : attendance.length === 0 ? (
                    <p className="px-6 text-sm text-muted-foreground">
                      No attendance records for this event yet.
                    </p>
                  ) : (
                    <Table exportable>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Check-In</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedAttendance.map((record) => (
                          <TableRow key={record.attendanceId}>
                            <TableCell className="font-medium">
                              {record.memberName || record.visitorName || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground capitalize">
                              {record.category || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground capitalize">
                              {record.source}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(
                                new Date(record.checkInAt),
                                "MMM d, yyyy · HH:mm",
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TableCard>
              )}
            </TabsContent>
          )}
        </UrlTabs>
      )}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        returnFocusRef={eventActionsRef}
        title="Delete Event"
        description={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        pending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        returnFocusRef={eventActionsRef}
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="event"
        targetName={archiveTarget?.event.title}
        targetId={archiveTarget?.event.eventId ?? ""}
        mutation={
          archiveTarget?.kind === "restore"
            ? restoreArchiveMutation
            : archiveTarget?.kind === "archive"
              ? archiveMutation
              : deleteMutation
        }
      />
    </div>
  );
}
