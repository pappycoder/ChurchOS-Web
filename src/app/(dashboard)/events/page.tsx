"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useEventsList,
  useEventsSummary,
  type EventItem,
} from "@/hooks/use-events";
import { useAttendanceServices } from "@/hooks/use-attendance";
import { usePermissions } from "@/hooks/use-permissions";
import { CalendarView } from "@/components/events/calendar-view";
import { CalendarSidebar } from "@/components/events/calendar-sidebar";
import { AddEventModal } from "@/components/events/add-event-modal";
import { EventDetailModal } from "@/components/events/event-detail-modal";

export default function EventsDashboardPage() {
  const { can } = usePermissions();
  const canCreate = can("events", "create");

  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addModalDate, setAddModalDate] = React.useState<Date | undefined>();
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<EventItem | null>(null);

  const summaryQuery = useEventsSummary();
  const eventsQuery = useEventsList({ limit: 100, sortBy: "startDate", sortOrder: "asc" });
  const servicesQuery = useAttendanceServices({ limit: 100 });

  const allEvents = summaryQuery.data?.data ?? [];
  const listEvents = eventsQuery.data?.data ?? [];
  const services = servicesQuery.data?.data ?? [];

  const handleDateClick = React.useCallback(
    (date: Date) => {
      setSelectedDate(date);
      if (canCreate) {
        setAddModalDate(date);
        setAddModalOpen(true);
      }
    },
    [canCreate],
  );

  const handleEventClick = React.useCallback((event: EventItem) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  }, []);

  const handleCreateClick = React.useCallback(() => {
    setAddModalDate(undefined);
    setAddModalOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Events"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Events" }]}
        action={
          canCreate && (
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <CalendarSidebar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            events={allEvents}
            isLoading={summaryQuery.isLoading}
          />
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3">
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
