"use client";
import { ErrorState } from "@/components/shared/error-state";
import { GeneralAttendancePanel } from "@/components/attendance/general-attendance-panel";

import { ChurchAttendanceRoster } from "@/components/attendance/church-attendance-roster";

import * as React from "react";
import { format } from "date-fns";
import { getToastErrorMessage, toast } from "@/lib/toast";
import {
  AlertTriangle,
  Calendar,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  EventsHeader as PageHeader,
  eventsWorkspaceClass,
} from "@/components/events/event-presentation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useEventsList,
  useEvent,
  useBulkCheckIn,
  useWalkInCheckIn,
  useEventAttendance,
  EVENT_TYPE_MAP,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";

const walkInSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  gender: z.string().optional(),
});

type WalkInFormValues = z.infer<typeof walkInSchema>;

export default function EventsCheckInPage() {
  const { can } = usePermissions();
  const [checkingIn, setCheckingIn] = React.useState(false);
  const [attendanceDate, setAttendanceDate] = React.useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const canCreate = can("events:checkin", "create");

  // Event selector.
  const eventsQuery = useEventsList({
    limit: 50,
    sortBy: "startDate",
    sortOrder: "asc",
  });
  const events = eventsQuery.data?.data ?? [];
  const [eventId, setEventId] = React.useState("");
  React.useEffect(() => {
    setEventId(
      new URLSearchParams(window.location.search).get("eventId") ?? "",
    );
  }, []);
  const eventQuery = useEvent(eventId);

  const selectedEvent =
    events.find((e) => e.eventId === eventId) ?? eventQuery.data;
  const eventOptions =
    selectedEvent && !events.some((e) => e.eventId === selectedEvent.eventId)
      ? [selectedEvent, ...events]
      : events;

  // Mode switch.
  const [mode, setMode] = React.useState<"members" | "walkIn">("members");

  const bulkMutation = useBulkCheckIn(eventId);

  // ─── Walk-in mode ───────────────────────────────────────
  const walkInMutation = useWalkInCheckIn(eventId);

  const form = useForm<WalkInFormValues>({
    resolver: zodResolver(walkInSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      gender: "",
    },
  });

  const handleWalkInSubmit = async (values: WalkInFormValues) => {
    if (!eventId) return;
    try {
      await walkInMutation.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim() || undefined,
        gender: values.gender || undefined,
      });
      toast.success(`${values.firstName} ${values.lastName} checked in`, {
        description: "Walk-in attendance recorded.",
      });
      form.reset({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        gender: "",
      });
    } catch (error) {
      toast.error("Walk-in check-in failed", {
        description: getToastErrorMessage(error, "Please try again."),
      });
    }
  };

  // ─── Recent attendance ──────────────────────────────────
  const attendanceQuery = useEventAttendance(eventId);
  const recentAttendance = (attendanceQuery.data ?? []).slice(0, 10);

  if (!canCreate) {
    return (
      <div>
        <PageHeader
          title="Event Check-In"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Events", href: "/events" },
            { label: "Check-In" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            You do not have permission to record event attendance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${eventsWorkspaceClass} space-y-4`}>
      <PageHeader
        title="Event Check-In"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: "Check-In" },
        ]}
      />

      {/* Event picker */}
      {eventsQuery.isError && <ErrorState title="Unable to load events" />}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Event</CardTitle>
          <CardDescription>
            Pick an event to start checking attendees in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Event *</p>
            <Select
              disabled={checkingIn}
              value={eventId}
              onValueChange={setEventId}
            >
              <SelectTrigger className="w-full" aria-label="Event">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {eventOptions.map((e) => (
                  <SelectItem key={e.eventId} value={e.eventId}>
                    {e.title} &mdash;{" "}
                    {format(new Date(e.startDate), "MMM d, yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eventsQuery.isLoading && <Skeleton className="h-9 w-full" />}
          </div>
          {selectedEvent && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {EVENT_TYPE_MAP[selectedEvent.type]}
              </Badge>
              <span>
                {format(
                  new Date(selectedEvent.startDate),
                  "EEEE, MMMM d, yyyy h:mm a",
                )}
              </span>
              {selectedEvent.location && (
                <span>&mdash; {selectedEvent.location}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <GeneralAttendancePanel
        requireService
        context={
          selectedEvent
            ? {
                type: "event",
                id: selectedEvent.eventId,
                name: selectedEvent.title,
                branchId: selectedEvent.branchId,
                active: !selectedEvent.archivedAt,
              }
            : undefined
        }
      />

      {/* Mode tabs */}
      <div
        className="flex flex-wrap gap-2 rounded-xl border bg-card p-2"
        role="group"
        aria-label="Check-in mode"
      >
        <Button
          aria-pressed={mode === "members"}
          variant={mode === "members" ? "default" : "ghost"}
          size="sm"
          disabled={checkingIn}
          onClick={() => setMode("members")}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Members (Roster)
        </Button>
        <Button
          aria-pressed={mode === "walkIn"}
          variant={mode === "walkIn" ? "default" : "ghost"}
          size="sm"
          disabled={checkingIn}
          onClick={() => setMode("walkIn")}
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Walk-In
        </Button>
      </div>

      {!eventId ? (
        <Card>
          <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select an event above to start checking people in.
            </p>
          </CardContent>
        </Card>
      ) : mode === "members" ? (
        <ChurchAttendanceRoster
          onBusyChange={setCheckingIn}
          key={`${eventId}:${attendanceDate}`}
          disabled={!attendanceDate}
          controls={
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Attendance Date</span>
              <Input
                type="date"
                aria-label="Attendance Date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                disabled={checkingIn}
                required
                className="w-full sm:w-52"
              />
              <span className="block text-xs text-muted-foreground">
                Attendance will be recorded for this date.
              </span>
            </label>
          }
          branchId={selectedEvent?.branchId}
          onSubmit={async (memberIds) => {
            const result = await bulkMutation.mutateAsync({
              memberIds,
              attendanceDate,
            });
            return { recorded: result.checkedIn, skipped: result.skipped };
          }}
        />
      ) : (
        /* ─── Walk-in check-in ─── */
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Walk-In</CardTitle>
            <CardDescription>
              Record a walk-in attendee for this event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleWalkInSubmit)}
                className={`${eventsWorkspaceClass} space-y-4`}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Amina" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Okafor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+234 803 456 7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="amina@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      form.reset({
                        firstName: "",
                        lastName: "",
                        phone: "",
                        email: "",
                        gender: "",
                      })
                    }
                    disabled={walkInMutation.isPending}
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={walkInMutation.isPending}>
                    {walkInMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Check In Walk-In
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Recent attendance for this event */}
      {eventId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Recent Check-Ins
            </CardTitle>
            <CardDescription>
              Last {recentAttendance.length} attendance records for this event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : recentAttendance.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No check-ins recorded yet for this event.
              </p>
            ) : (
              <div data-export-list className="rounded-md border divide-y">
                {recentAttendance.map((record) => (
                  <div
                    key={record.attendanceId}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {record.memberName ?? record.visitorName ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(
                          new Date(record.checkInAt),
                          "MMM d, yyyy h:mm a",
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={record.memberId ? "secondary" : "outline"}
                      >
                        {record.memberId ? "Member" : "Walk-In"}
                      </Badge>
                      {record.source && (
                        <Badge variant="outline" className="text-xs">
                          {record.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
