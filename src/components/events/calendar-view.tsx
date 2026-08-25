"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/daygrid/index.css";
import "@fullcalendar/timegrid/index.css";

import type { EventItem } from "@/hooks/use-events";
import type { ChurchService } from "@/hooks/use-attendance";
import type { PluginInput } from "@fullcalendar/react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color: string;
  extendedProps: {
    type: "event" | "service";
    item: EventItem | ChurchService;
  };
}

const EVENT_COLOR_MAP: Record<string, string> = {
  service: "#3b82f6",
  conference: "#a855f7",
  lifecycle: "#ec4899",
  training: "#f59e0b",
  social: "#22c55e",
};

const SERVICE_COLOR = "#94a3b8";

function buildServiceEvents(
  services: ChurchService[],
  year: number,
  month: number
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (const service of services) {
    if (!service.dayOfWeek || !service.isActive) continue;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === service.dayOfWeek) {
        const dateStr = date.toISOString().split("T")[0];
        const start = service.startTime
          ? `${dateStr}T${service.startTime}`
          : `${dateStr}T09:00:00`;
        const end = service.endTime
          ? `${dateStr}T${service.endTime}`
          : undefined;

        events.push({
          id: `service-${service.serviceId}-${dateStr}`,
          title: service.name,
          start,
          end,
          color: SERVICE_COLOR,
          extendedProps: {
            type: "service",
            item: service,
          },
        });
      }
    }
  }

  return events;
}

function buildEventEvents(events: EventItem[]): CalendarEvent[] {
  return events.map((event) => ({
    id: `event-${event.eventId}`,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    color: EVENT_COLOR_MAP[event.type] ?? "#64748b",
    extendedProps: {
      type: "event" as const,
      item: event,
    },
  }));
}

interface CalendarViewProps {
  events: EventItem[];
  services: ChurchService[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: EventItem) => void;
  isLoading: boolean;
}

export function CalendarView({
  events,
  services,
  onDateClick,
  onEventClick,
  isLoading,
}: CalendarViewProps) {
  const now = new Date();
  const calendarEvents: CalendarEvent[] = [
    ...buildEventEvents(events),
    ...buildServiceEvents(services, now.getFullYear(), now.getMonth()),
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px rounded-lg border bg-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`header-${i}`} className="h-10 animate-pulse bg-muted" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={`day-${i}`} className="h-24 animate-pulse bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin] as unknown as PluginInput[]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={calendarEvents}
        dateClick={(info) => onDateClick(new Date(info.date))}
        eventClick={(info) => {
          const item = info.event.extendedProps.item;
          if (info.event.extendedProps.type === "event") {
            onEventClick(item as EventItem);
          }
        }}
        height="auto"
        dayMaxEvents={3}
        moreLinkText={(n) => `+${n} more`}
      />

      <style jsx global>{`
        .calendar-view .fc {
          font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
        }

        .calendar-view .fc .fc-button-primary {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        .calendar-view .fc .fc-button-primary:hover {
          background-color: hsl(var(--primary) / 0.9);
          border-color: hsl(var(--primary) / 0.9);
        }

        .calendar-view .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        .calendar-view .fc .fc-button {
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
          padding: 0.375rem 0.75rem;
        }

        .calendar-view .fc .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .calendar-view .fc .fc-event {
          border-radius: 0.375rem;
          padding: 1px 4px;
          border: none;
          font-size: 0.75rem;
          line-height: 1.25;
        }

        .calendar-view .fc .fc-daygrid-event {
          border-left-width: 3px;
          border-left-style: solid;
        }

        .calendar-view .fc .fc-day-today {
          background-color: hsl(var(--primary) / 0.05);
        }

        .calendar-view .fc .fc-col-header-cell {
          padding: 0.5rem 0;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--muted-foreground));
        }

        .calendar-view .fc th {
          border-color: hsl(var(--border));
        }

        .calendar-view .fc td,
        .calendar-view .fc th {
          border-color: hsl(var(--border));
        }

        .calendar-view .fc .fc-daygrid-day-number {
          padding: 0.375rem 0.5rem;
          font-size: 0.8125rem;
        }

        .calendar-view .fc .fc-timegrid-slot {
          height: 2rem;
        }

        .calendar-view .fc .fc-timegrid-slot-label-cushion {
          font-size: 0.6875rem;
        }
      `}</style>
    </div>
  );
}
