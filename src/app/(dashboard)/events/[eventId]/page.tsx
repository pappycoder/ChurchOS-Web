"use client";

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
  AlertTriangle,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PageHeader } from "@/components/shared/page-header";
import {
  useEvent,
  useEventRegistrations,
  useEventAttendance,
  useEventStats,
  useDeleteEvent,
  EVENT_TYPE_MAP,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type EventItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type EventRegistration,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type EventAttendanceRecord,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "-"}</span>
    </div>
  );
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = React.use(params);
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdate = can("events", "update");
  const canDelete = can("events", "delete");

  const eventQuery = useEvent(eventId);
  const registrationsQuery = useEventRegistrations(eventId);
  const attendanceQuery = useEventAttendance(eventId);
  const statsQuery = useEventStats(eventId);
  const deleteMutation = useDeleteEvent();

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const isLoading = eventQuery.isLoading || statsQuery.isLoading;
  const event = eventQuery.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
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
        <Button variant="ghost" onClick={() => router.push("/events/list")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Event not found.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
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
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={() => router.push("/events/list")}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Events
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 flex-wrap">
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <Badge variant="outline">{EVENT_TYPE_MAP[event.type] ?? event.type}</Badge>
            <Badge variant={isPast ? "secondary" : "default"}>
              {isPast ? "Past" : "Upcoming"}
            </Badge>
            {event.isFree && <Badge variant="secondary">Free</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-4 flex-wrap">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {format(new Date(event.startDate), "MMM d, yyyy")}
              {event.endDate
                ? ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`
                : ""}
            </span>
            <span>
              {event.capacity
                ? `${event.registrationCount}/${event.capacity} registered`
                : `${event.registrationCount} registered`}
            </span>
          </p>
          {(canUpdate || canDelete) && (
            <div className="flex items-center gap-2 mt-4">
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/events/${eventId}/edit`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {!event.isFree && canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/events/${eventId}/tiers`)}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Manage Tiers
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {statsQuery.isLoading ? "..." : stats.registered.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-muted-foreground" />
              {statsQuery.isLoading ? "..." : stats.attended.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Attended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold flex items-center gap-2">
              <UserX className="h-5 w-5 text-muted-foreground" />
              {statsQuery.isLoading ? "..." : stats.noShows.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">No-Shows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold flex items-center gap-2">
              <Footprints className="h-5 w-5 text-muted-foreground" />
              {statsQuery.isLoading ? "..." : stats.walkIns.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Walk-Ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Registrations tab */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Registrations</CardTitle>
          <span className="text-xs text-muted-foreground">
            {registrationsQuery.isLoading
              ? ""
              : registrations.length === 0
                ? "No registrations"
                : `${registrations.length} registration(s)`}
          </span>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {registrationsQuery.isLoading ? (
            <div className="px-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : registrations.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">
              No registrations for this event yet.
            </p>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
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
                  {registrations.map((reg) => (
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
                        <Badge variant={reg.checkedIn ? "default" : "secondary"}>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance tab */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Attendance</CardTitle>
          <span className="text-xs text-muted-foreground">
            {attendanceQuery.isLoading
              ? ""
              : attendance.length === 0
                ? "No records"
                : `${attendance.length} record(s)`}
          </span>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {attendanceQuery.isLoading ? (
            <div className="px-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : attendance.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">
              No attendance records for this event yet.
            </p>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Check-In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
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
                        {format(new Date(record.checkInAt), "MMM d, yyyy · HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h3 className="text-lg font-semibold">Delete Event</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{event.title}&quot;? This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
