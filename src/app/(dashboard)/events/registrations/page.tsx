"use client";
import { useUrlQueryState } from "@/hooks/use-url-query-state";
import { ErrorState } from "@/components/shared/error-state";
import { RegisterAttendeeButton } from "@/components/events/register-attendee-button";
import { LoadingState } from "@/components/shared/loading-state";
import { BranchFilter } from "@/components/shared/branch-filter";

import * as React from "react";
import { CalendarDays, Search, Users } from "lucide-react";
import { format } from "date-fns";
import {
  EventsHeader as PageHeader,
  eventsWorkspaceClass,
  EventStateBadge,
} from "@/components/events/event-presentation";
import { EmptyState } from "@/components/shared/empty-state";
import { TableCard } from "@/components/shared/table-card";
import { SearchInput } from "@/components/shared/search-input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEvent,
  useEventsList,
  useEventRegistrations,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";

function EventRegistrationsPageContent() {
  const { can } = usePermissions();
  const canRead = can("events:registrations", "read");

  const [selectedEventId, setSelectedEventId] = useUrlQueryState("eventId");
  const [branchId, setBranchId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  React.useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedEventId]);

  const eventsQuery = useEventsList({
    limit: 100,
    sortBy: "startDate",
    sortOrder: "desc",
    branchId: branchId || undefined,
  });
  const registrationsQuery = useEventRegistrations(
    selectedEventId,
    branchId || undefined,
  );

  const events = React.useMemo(
    () => eventsQuery.data?.data ?? [],
    [eventsQuery.data?.data],
  );
  const allRegistrations = React.useMemo(
    () => (selectedEventId ? (registrationsQuery.data ?? []) : []),
    [selectedEventId, registrationsQuery.data],
  );

  const registrations = React.useMemo(() => {
    if (!search.trim()) return allRegistrations;
    const q = search.toLowerCase();
    return allRegistrations.filter(
      (r) =>
        r.memberId.toLowerCase().includes(q) ||
        r.memberName?.toLowerCase().includes(q) ||
        r.tierName?.toLowerCase().includes(q) ||
        r.ticketCode?.toLowerCase().includes(q) ||
        r.paymentStatus.toLowerCase().includes(q),
    );
  }, [allRegistrations, search]);

  const pagedRegistrations = React.useMemo(
    () => registrations.slice((page - 1) * perPage, page * perPage),
    [registrations, page, perPage],
  );

  const listedEvent = events.find((event) => event.eventId === selectedEventId);
  const selectedEventQuery = useEvent(
    selectedEventId && !listedEvent ? selectedEventId : "",
  );
  const selectedEvent = listedEvent ?? selectedEventQuery.data ?? null;

  const stats = React.useMemo(() => {
    const total = allRegistrations.length;
    const checkedIn = allRegistrations.filter((r) => r.checkedIn).length;
    const pending = allRegistrations.filter(
      (r) => r.paymentStatus === "pending",
    ).length;
    const paid = allRegistrations.filter(
      (r) => r.paymentStatus === "paid",
    ).length;
    return { total, checkedIn, pending, paid };
  }, [allRegistrations]);

  if (!canRead) {
    return (
      <div>
        <PageHeader
          title="Event Registrations"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Events", href: "/events" },
            { label: "Registrations" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">
            You do not have permission to view event registrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${eventsWorkspaceClass} space-y-4`}>
      <PageHeader
        title="Event Registrations"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: "Registrations" },
        ]}
      />

      {eventsQuery.isError && (
        <ErrorState title="Unable to load the event selector" />
      )}
      {selectedEventQuery.isError && (
        <ErrorState title="Unable to load the selected event" />
      )}
      {/* Event selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center">
            <BranchFilter
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setSelectedEventId("");
                setPage(1);
              }}
            />
            <label
              htmlFor="event-select"
              className="text-sm font-medium shrink-0"
            >
              Select Event
            </label>
            {eventsQuery.isLoading ? (
              <Skeleton className="h-10 w-full sm:w-72" />
            ) : (
              <Select
                value={selectedEventId}
                onValueChange={(v) => {
                  setSelectedEventId(v);
                  setSearch("");
                }}
              >
                <SelectTrigger
                  id="event-select"
                  className="w-full min-w-0 max-w-full sm:w-72"
                >
                  <SelectValue placeholder="Choose an event to view registrations" />
                </SelectTrigger>
                <SelectContent>
                  {selectedEvent && !listedEvent && (
                    <SelectItem value={selectedEvent.eventId}>
                      {selectedEvent.title}
                    </SelectItem>
                  )}
                  {events.map((e) => (
                    <SelectItem key={e.eventId} value={e.eventId}>
                      {e.title} ({format(new Date(e.startDate), "MMM d, yyyy")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedEvent && (
              <Badge variant="outline" className="w-fit">
                {selectedEvent.registrationCount} registration
                {selectedEvent.registrationCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {selectedEvent && (
              <RegisterAttendeeButton
                key={selectedEvent.eventId}
                event={selectedEvent}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEventId &&
        !registrationsQuery.isLoading &&
        !registrationsQuery.isError && (
          <div
            aria-label="Registration summary"
            className="flex flex-wrap gap-x-6 gap-y-2 px-1 text-xs text-muted-foreground"
          >
            <span>{stats.total} registrations</span>
            <span>{stats.checkedIn} checked in</span>
            <span>
              Payments: {stats.paid} paid · {stats.pending} pending
            </span>
          </div>
        )}

      {/* Registrations table */}
      <TableCard
        title="Registrations"
        itemName="registrations"
        page={page}
        perPage={perPage}
        total={registrations.length}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        toolbar={
          selectedEventId ? (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <SearchInput
                placeholder="Search by member, tier, ticket code, or status..."
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                className="max-w-sm"
              />
            </div>
          ) : undefined
        }
      >
        {!selectedEventId ? (
          <div className="py-12">
            <EmptyState
              icon={<CalendarDays className="h-12 w-12" />}
              title="No event selected"
              description="Select an event above to view its registrations."
            />
          </div>
        ) : registrationsQuery.isError ? (
          <ErrorState title="Unable to load registrations" />
        ) : registrationsQuery.isLoading ? (
          <LoadingState variant="table" />
        ) : registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">
              {search
                ? "No registrations match your search."
                : "No registrations for this event yet."}
            </p>
          </div>
        ) : (
          <Table exportable>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Checked In</TableHead>
                <TableHead>Ticket Code</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRegistrations.map((reg) => (
                <TableRow key={reg.registrationId}>
                  <TableCell className="font-medium">
                    <span title={reg.memberId}>
                      {reg.memberName || reg.memberId}
                    </span>
                  </TableCell>
                  <TableCell>{reg.tierName || "-"}</TableCell>
                  <TableCell className="text-center">{reg.quantity}</TableCell>
                  <TableCell>
                    <EventStateBadge status={reg.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    {reg.checkedIn ? (
                      <EventStateBadge status="Checked in" />
                    ) : (
                      <EventStateBadge status="Not checked in" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {reg.ticketCode || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(reg.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>
    </div>
  );
}

export default function EventRegistrationsPage() {
  return (
    <React.Suspense fallback={<p role="status">Loading workspace…</p>}>
      <EventRegistrationsPageContent />
    </React.Suspense>
  );
}
