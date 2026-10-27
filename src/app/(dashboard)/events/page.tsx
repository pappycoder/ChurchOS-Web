"use client";
import { ErrorState } from "@/components/shared/error-state";
import { BranchFilter } from "@/components/shared/branch-filter";

import * as React from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
    <div className="space-y-4">
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
      <p className="text-sm text-muted-foreground">
        Calendar coverage: {allEvents.length} loaded events and{" "}
        {services.length} services (up to 100 of each). Open the event or
        service directory to search the complete collection.
      </p>

      {(eventsQuery.isError || servicesQuery.isError) && (
        <ErrorState title="Unable to load calendar data" />
      )}
      <BranchFilter value={branchId} onChange={setBranchId} />

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        {/* Sidebar */}
        <div>
          <CalendarSidebar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            events={allEvents}
            isLoading={eventsQuery.isLoading}
          />
        </div>

        {/* Calendar */}
        <div className="order-1 min-w-0 lg:order-none">
          <Card className="p-0 overflow-hidden">
            <CalendarView
              events={listEvents}
              services={services}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              isLoading={eventsQuery.isLoading || servicesQuery.isLoading}
            />
          </Card>
        </div>
      </div>

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
    </div>
  );
}
