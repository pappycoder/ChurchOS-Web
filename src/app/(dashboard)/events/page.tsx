"use client";
import { ErrorState } from "@/components/shared/error-state";
import { BranchFilter } from "@/components/shared/branch-filter";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  EventsWorkspace,
  EventsHeader as PageHeader,
} from "@/components/events/event-presentation";
import { calendarEntries, entriesForDay } from "@/lib/event-calendar";
import { PermissionLink } from "@/components/shared/permission-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEventsList, type EventItem } from "@/hooks/use-events";
import { useAttendanceServices } from "@/hooks/use-attendance";
import { usePermissions } from "@/hooks/use-permissions";
import { CalendarView } from "@/components/events/calendar-view";
import { CalendarSidebar } from "@/components/events/calendar-sidebar";
import { AddEventModal } from "@/components/events/add-event-modal";
import { EventDetailModal } from "@/components/events/event-detail-modal";

export default function EventsDashboardPage() {
  const { can } = usePermissions();
  const canCreate = can("events", "create");

  const [branchId, setBranchId] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addModalDate, setAddModalDate] = React.useState<Date | undefined>();
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<EventItem | null>(
    null,
  );

  const eventsQuery = useEventsList({
    branchId: branchId || undefined,
    limit: 100,
    sortBy: "startDate",
    sortOrder: "asc",
  });
  const servicesQuery = useAttendanceServices({
    branchId: branchId || undefined,
    limit: 100,
  });

  const allEvents = eventsQuery.data?.data ?? [];
  const listEvents = eventsQuery.data?.data ?? [];
  const services = servicesQuery.data?.data ?? [];

  const handleDateClick = React.useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleEventClick = React.useCallback((event: EventItem) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  }, []);

  const handleCreateClick = React.useCallback(() => {
    setAddModalDate(selectedDate);
    setAddModalOpen(true);
  }, [selectedDate]);

  return (
    <EventsWorkspace>
      <PageHeader
        title="Events"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events" },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canCreate && (
              <Button onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <BranchFilter value={branchId} onChange={setBranchId} />
          <Input
            type="date"
            aria-label="Jump to date"
            className="w-40"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(event) => {
              if (event.target.value)
                setSelectedDate(parseISO(event.target.value));
            }}
          />
        </div>
        <nav aria-label="Event shortcuts" className="flex flex-wrap gap-2">
          {[
            ["/events/list", "Directory"],
            ["/events/registrations", "Registrations"],
            ["/events/check-in", "Check-In"],
            ["/events/management", "Tickets"],
          ].map(([href, label]) => (
            <PermissionLink
              key={href}
              href={href}
              className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              {label}
            </PermissionLink>
          ))}
        </nav>
      </div>
      {eventsQuery.isError && (
        <ErrorState
          title="Unable to load calendar events"
          onRetry={() => {
            void eventsQuery.refetch();
          }}
          className="py-4 sm:py-4"
        />
      )}
      {servicesQuery.isError && (
        <ErrorState
          title="Unable to load calendar services"
          onRetry={() => {
            void servicesQuery.refetch();
          }}
          className="py-4 sm:py-4"
        />
      )}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="min-w-0 overflow-hidden p-0">
          <CalendarView
            events={listEvents}
            services={services}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            isLoading={eventsQuery.isLoading || servicesQuery.isLoading}
          />
        </Card>
        <CalendarSidebar
          selectedDate={selectedDate}
          entries={entriesForDay(
            calendarEntries(allEvents, services, selectedDate, selectedDate),
            selectedDate,
          )}
          onEventClick={handleEventClick}
          onCreate={canCreate ? handleCreateClick : undefined}
          isLoading={eventsQuery.isLoading || servicesQuery.isLoading}
          incomplete={eventsQuery.isError || servicesQuery.isError}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Calendar coverage: {allEvents.length} loaded events and{" "}
        {services.length} services (up to 100 of each). Open the event or
        service directory to search the complete collection.
      </p>

      <AddEventModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        defaultDate={addModalDate}
      />

      <EventDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        event={selectedEvent}
      />
    </EventsWorkspace>
  );
}
