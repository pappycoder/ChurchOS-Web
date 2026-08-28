"use client";

import * as React from "react";
import { CalendarDays, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
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
  useEventsList,
  useEventRegistrations,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";

const PAYMENT_BADGE: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "secondary",
};

export default function EventRegistrationsPage() {
  const { can } = usePermissions();
  const canRead = can("events", "read");

  const [selectedEventId, setSelectedEventId] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  React.useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedEventId]);

  const eventsQuery = useEventsList({ limit: 100, sortBy: "startDate", sortOrder: "desc" });
  const registrationsQuery = useEventRegistrations(selectedEventId);

  const events = React.useMemo(() => eventsQuery.data?.data ?? [], [eventsQuery.data?.data]);
  const allRegistrations = React.useMemo(() => registrationsQuery.data ?? [], [registrationsQuery.data]);

  const registrations = React.useMemo(() => {
    if (!search.trim()) return allRegistrations;
    const q = search.toLowerCase();
    return allRegistrations.filter(
      (r) =>
        r.memberId.toLowerCase().includes(q) ||
        r.memberName?.toLowerCase().includes(q) ||
        r.tierName?.toLowerCase().includes(q) ||
        r.ticketCode?.toLowerCase().includes(q) ||
        r.paymentStatus.toLowerCase().includes(q)
    );
  }, [allRegistrations, search]);

  const pagedRegistrations = React.useMemo(
    () => registrations.slice((page - 1) * perPage, page * perPage),
    [registrations, page, perPage]
  );

  const selectedEvent = React.useMemo(
    () => events.find((e) => e.eventId === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const stats = React.useMemo(() => {
    const total = allRegistrations.length;
    const checkedIn = allRegistrations.filter((r) => r.checkedIn).length;
    const pending = allRegistrations.filter((r) => r.paymentStatus === "pending").length;
    const paid = allRegistrations.filter((r) => r.paymentStatus === "paid").length;
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
          <p className="text-muted-foreground">You do not have permission to view event registrations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Event Registrations"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: "Registrations" },
        ]}
      />

      {/* Event selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="event-select" className="text-sm font-medium shrink-0">
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
                <SelectTrigger id="event-select" className="w-full sm:w-72">
                  <SelectValue placeholder="Choose an event to view registrations" />
                </SelectTrigger>
                <SelectContent>
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
                {selectedEvent.registrationCount} registration{selectedEvent.registrationCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empty state: no event selected */}
      {!selectedEventId && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">Select an event above to view its registrations.</p>
        </div>
      )}

      {/* Event selected */}
      {selectedEventId && (
        <>
          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total"
              value={stats.total}
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Checked In"
              value={stats.checkedIn}
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Pending"
              value={stats.pending}
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Paid"
              value={stats.paid}
              icon={<Users className="h-4 w-4" />}
            />
          </div>

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
            }
          >
              {registrationsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member ID</TableHead>
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
                        <TableCell className="font-mono text-xs">
                          <span title={reg.memberId}>
                            {reg.memberId.slice(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>{reg.tierName || "-"}</TableCell>
                        <TableCell className="text-center">{reg.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_BADGE[reg.paymentStatus] ?? "secondary"}>
                            {reg.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reg.checkedIn ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
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
        </>
      )}
    </div>
  );
}
