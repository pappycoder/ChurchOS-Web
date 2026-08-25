"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  useBulkCheckIn,
  useWalkInCheckIn,
  useEventAttendance,
  EVENT_TYPE_MAP,
} from "@/hooks/use-events";
import {
  useMembersList,
  useSearchMembers,
  type Member,
} from "@/hooks/use-members";
import { usePermissions } from "@/hooks/use-permissions";

const walkInSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  gender: z.string().optional(),
});

type WalkInFormValues = z.infer<typeof walkInSchema>;

export default function EventsCheckInPage() {
  const { can } = usePermissions();
  const canCreate = can("events", "create");

  // Event selector.
  const eventsQuery = useEventsList({ limit: 50, sortBy: "startDate", sortOrder: "asc" });
  const events = eventsQuery.data?.data ?? [];
  const [eventId, setEventId] = React.useState("");

  const selectedEvent = events.find((e) => e.eventId === eventId);

  // Mode switch.
  const [mode, setMode] = React.useState<"members" | "walkIn">("members");

  // ─── Roster mode ────────────────────────────────────────
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [rosterLimit, setRosterLimit] = React.useState(50);
  const rosterQuery = useMembersList({
    page: 1,
    limit: rosterLimit,
    status: "active",
  });
  const searchQuery = useSearchMembers(search, 50);

  const searching = search.trim().length >= 2;
  const members: Member[] = searching
    ? (searchQuery.data?.data ?? [])
    : (rosterQuery.data?.data ?? []);
  const rosterTotal = searching ? members.length : (rosterQuery.data?.meta?.total ?? 0);
  const hasMoreRoster =
    !searching && rosterTotal > rosterLimit && !rosterQuery.isLoading;

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const bulkMutation = useBulkCheckIn(eventId);

  const toggleMember = (memberId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  };

  const handleBulkSubmit = async () => {
    if (!eventId || selectedIds.size === 0) return;
    try {
      const result = await bulkMutation.mutateAsync({
        memberIds: Array.from(selectedIds),
      });
      toast.success(`${result.checkedIn} checked in`, {
        description:
          result.skipped > 0
            ? `${result.skipped} skipped — already checked in for this event.`
            : undefined,
      });
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Bulk check-in failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

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
      toast.success(
        `${values.firstName} ${values.lastName} checked in`,
        { description: "Walk-in attendance recorded." }
      );
      form.reset({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        gender: "",
      });
    } catch (error) {
      toast.error("Walk-in check-in failed", {
        description: error instanceof Error ? error.message : "Please try again.",
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
    <div className="space-y-4">
      <PageHeader
        title="Event Check-In"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: "Check-In" },
        ]}
      />

      {/* Event picker */}
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
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.eventId} value={e.eventId}>
                    {e.title} &mdash; {format(new Date(e.startDate), "MMM d, yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eventsQuery.isLoading && <Skeleton className="h-9 w-full" />}
          </div>
          {selectedEvent && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{EVENT_TYPE_MAP[selectedEvent.type]}</Badge>
              <span>{format(new Date(selectedEvent.startDate), "EEEE, MMMM d, yyyy h:mm a")}</span>
              {selectedEvent.location && (
                <span>&mdash; {selectedEvent.location}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <Button
          variant={mode === "members" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("members")}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Members (Roster)
        </Button>
        <Button
          variant={mode === "walkIn" ? "default" : "outline"}
          size="sm"
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
        /* ─── Roster bulk check-in ─── */
        <Card>
          <CardHeader className="pb-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Roster</CardTitle>
              <CardDescription>
                Tick everyone present, then submit once. Duplicates are skipped
                automatically.
              </CardDescription>
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search members..."
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Selection bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2.5">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleBulkSubmit} disabled={bulkMutation.isPending}>
                    {bulkMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        Checking in...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1.5" />
                        Check In {selectedIds.size}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {rosterQuery.isLoading || (searching && searchQuery.isLoading) ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No members match your search.
              </p>
            ) : (
              <div className="rounded-md border divide-y max-h-[52vh] overflow-y-auto">
                {members.map((member) => {
                  const checked = selectedIds.has(member.memberId);
                  return (
                    <label
                      key={member.memberId}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/40 ${
                        checked ? "bg-primary/5" : ""
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) =>
                          toggleMember(member.memberId, !!c)
                        }
                        aria-label={`Select ${member.firstName} ${member.lastName}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        {member.phone && (
                          <p className="text-xs text-muted-foreground truncate">
                            {member.phone}
                          </p>
                        )}
                      </div>
                      {checked && <Badge variant="secondary">Selected</Badge>}
                    </label>
                  );
                })}
              </div>
            )}
            {hasMoreRoster && (
              <div className="flex items-center justify-center pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRosterLimit((n) => n + 50)}
                >
                  Load more ({rosterTotal - rosterLimit} remaining)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
                className="space-y-4"
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
            <CardTitle className="text-sm font-semibold">Recent Check-Ins</CardTitle>
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
              <div className="rounded-md border divide-y">
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
                        {format(new Date(record.checkInAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.memberId ? "secondary" : "outline"}>
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
