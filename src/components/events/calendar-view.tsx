"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getHours,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventItem } from "@/hooks/use-events";
import type { ChurchService } from "@/hooks/use-attendance";

const EVENT_COLOR_MAP: Record<string, string> = {
  service: "bg-blue-500",
  conference: "bg-purple-500",
  lifecycle: "bg-pink-500",
  training: "bg-amber-500",
  social: "bg-green-500",
};

const SERVICE_COLOR = "bg-slate-400";

type ViewMode = "month" | "week" | "day";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  colorClass: string;
  type: "event" | "service";
  item: EventItem | ChurchService;
}

interface CalendarViewProps {
  events: EventItem[];
  services: ChurchService[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: EventItem) => void;
  isLoading: boolean;
}

function parseEventDate(dateStr: string): Date {
  return new Date(dateStr);
}

function buildAllEvents(
  events: EventItem[],
  services: ChurchService[],
  anchorDate: Date,
): CalendarEvent[] {
  const items: CalendarEvent[] = [];

  for (const e of events) {
    items.push({
      id: `event-${e.eventId}`,
      title: e.title,
      start: parseEventDate(e.startDate),
      end: e.endDate ? parseEventDate(e.endDate) : undefined,
      colorClass: EVENT_COLOR_MAP[e.type] ?? "bg-slate-500",
      type: "event",
      item: e,
    });
  }

  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (const svc of services) {
    if (!svc.dayOfWeek || !svc.isActive) continue;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      if (d.getDay() === svc.dayOfWeek) {
        const [sh, sm] = svc.startTime ? svc.startTime.split(":").map(Number) : [9, 0];
        const start = new Date(d);
        start.setHours(sh, sm, 0, 0);
        let end: Date | undefined;
        if (svc.endTime) {
          const [eh, em] = svc.endTime.split(":").map(Number);
          end = new Date(d);
          end.setHours(eh, em, 0, 0);
        }
        items.push({
          id: `svc-${svc.serviceId}-${format(d, "yyyy-MM-dd")}`,
          title: svc.name,
          start,
          end,
          colorClass: SERVICE_COLOR,
          type: "service",
          item: svc,
        });
      }
    }
  }

  return items;
}

function eventsForDay(allEvents: CalendarEvent[], day: Date): CalendarEvent[] {
  return allEvents.filter((e) => isSameDay(e.start, day));
}

function MonthView({
  allEvents,
  currentDate,
  onDateClick,
  onEventClick,
}: {
  allEvents: CalendarEvent[];
  currentDate: Date;
  onDateClick: (d: Date) => void;
  onEventClick: (e: EventItem) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="grid grid-cols-7 border-l border-t">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div
          key={d}
          className="border-b border-r px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          {d}
        </div>
      ))}
      {days.map((day) => {
        const dayEvents = eventsForDay(allEvents, day);
        const inMonth = isSameMonth(day, currentDate);
        const today = isToday(day);
        const maxShow = 3;
        const shown = dayEvents.slice(0, maxShow);
        const overflow = dayEvents.length - maxShow;

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "min-h-[5.5rem] border-b border-r p-1.5 cursor-pointer transition-colors hover:bg-muted/50",
              !inMonth && "bg-muted/30 text-muted-foreground",
            )}
            onClick={() => onDateClick(day)}
          >
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                today && "bg-primary text-primary-foreground",
                !today && inMonth && "text-foreground",
              )}
            >
              {format(day, "d")}
            </span>
            <div className="mt-0.5 space-y-px">
              {shown.map((ev) => (
                <button
                  key={ev.id}
                  className={cn(
                    "flex w-full items-center gap-1 truncate rounded px-1 py-px text-left text-[10px] font-medium leading-tight text-white",
                    ev.colorClass,
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (ev.type === "event") onEventClick(ev.item as EventItem);
                  }}
                >
                  <span className="truncate">{ev.title}</span>
                </button>
              ))}
              {overflow > 0 && (
                <p className="px-1 text-[10px] text-muted-foreground">
                  +{overflow} more
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgendaView({
  allEvents,
  currentDate,
  onDateClick,
  onEventClick,
}: {
  allEvents: CalendarEvent[];
  currentDate: Date;
  onDateClick: (d: Date) => void;
  onEventClick: (e: EventItem) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const rows: { day: Date; events: CalendarEvent[] }[] = days
    .map((day) => ({ day, events: eventsForDay(allEvents, day) }))
    .filter((r) => r.events.length > 0)
    .sort((a, b) => a.day.getTime() - b.day.getTime());

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
        <p className="font-medium text-foreground">No events this month</p>
        <p className="text-sm">Tap a day to add an event.</p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {rows.map(({ day, events }) => (
        <div key={day.toISOString()} className="px-3 py-2.5">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium",
                isToday(day) && "bg-primary text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {format(day, "EEE")}
            </span>
            <button
              type="button"
              className="ml-auto text-xs text-muted-foreground hover:text-primary"
              onClick={() => onDateClick(day)}
            >
              Add
            </button>
          </div>
          <div className="space-y-1">
            {events.map((ev) => (
              <button
                key={ev.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left",
                  ev.colorClass,
                )}
                onClick={() => {
                  if (ev.type === "event") onEventClick(ev.item as EventItem);
                }}
              >
                {ev.type === "event" && ev.start && (
                  <span className="shrink-0 text-xs font-medium text-white/90">
                    {format(ev.start, "h:mm a")}
                  </span>
                )}
                <span className="truncate text-sm font-medium text-white">{ev.title}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeGridView({
  allEvents,
  days,
  onDateClick,
  onEventClick,
}: {
  allEvents: CalendarEvent[];
  days: Date[];
  onDateClick: (d: Date) => void;
  onEventClick: (e: EventItem) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="overflow-auto max-h-[700px]">
      <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, 1fr)` }}>
        {/* Header row */}
        <div className="sticky top-0 z-10 border-b bg-background" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "sticky top-0 z-10 border-b border-l bg-background px-1 py-2 text-center text-xs font-medium",
              isToday(day) && "text-primary font-semibold",
            )}
          >
            <div>{format(day, "EEE")}</div>
            <div
              className={cn(
                "mx-auto mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                isToday(day) && "bg-primary text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}

        {/* Time rows */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="border-b border-r px-1 py-2 text-right text-xs sm:text-[10px] text-muted-foreground">
              {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
            </div>
            {days.map((day) => {
              const cellEvents = allEvents.filter((ev) => {
                if (!isSameDay(ev.start, day)) return false;
                return getHours(ev.start) === hour;
              });

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="relative min-h-[2.5rem] border-b border-l cursor-pointer hover:bg-muted/30"
                  onClick={() => {
                    const d = new Date(day);
                    d.setHours(hour, 0, 0, 0);
                    onDateClick(d);
                  }}
                >
                  {cellEvents.map((ev) => (
                    <button
                      key={ev.id}
                      className={cn(
                        "absolute inset-x-0.5 top-0.5 z-10 truncate rounded px-1 py-0.5 text-[10px] font-medium text-white",
                        ev.colorClass,
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ev.type === "event") onEventClick(ev.item as EventItem);
                      }}
                    >
                      {ev.title}
                      {ev.end && (
                        <span className="ml-1 opacity-75">
                          {format(ev.start, "HH:mm")}–{format(ev.end, "HH:mm")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function CalendarView({
  events,
  services,
  onDateClick,
  onEventClick,
  isLoading,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>("month");

  const allEvents = React.useMemo(
    () => buildAllEvents(events, services, currentDate),
    [events, services, currentDate],
  );

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(currentDate);
    return eachDayOfInterval({ start, end: endOfWeek(start) });
  }, [currentDate]);

  const dayArray = React.useMemo(() => [currentDate], [currentDate]);

  const navigatePrev = React.useCallback(() => {
    setCurrentDate((d) => {
      if (viewMode === "month") return subMonths(d, 1);
      if (viewMode === "week") return subWeeks(d, 1);
      return subDays(d, 1);
    });
  }, [viewMode]);

  const navigateNext = React.useCallback(() => {
    setCurrentDate((d) => {
      if (viewMode === "month") return addMonths(d, 1);
      if (viewMode === "week") return addWeeks(d, 1);
      return addDays(d, 1);
    });
  }, [viewMode]);

  const navigateToday = React.useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const titleText = React.useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
      }
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [currentDate, viewMode]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
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
            <div key={`h-${i}`} className="h-10 animate-pulse bg-muted" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={`d-${i}`} className="h-24 animate-pulse bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{titleText}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  viewMode === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => setViewMode(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigatePrev} aria-label="Previous period">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={navigateToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigateNext} aria-label="Next period">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar body */}
      {viewMode === "month" ? (
        <>
          {/* Mobile: agenda/list month view */}
          <div className="md:hidden">
            <AgendaView
              allEvents={allEvents}
              currentDate={currentDate}
              onDateClick={onDateClick}
              onEventClick={onEventClick}
            />
          </div>
          {/* Desktop: 7-column month grid */}
          <div className="hidden md:block">
            <MonthView
              allEvents={allEvents}
              currentDate={currentDate}
              onDateClick={onDateClick}
              onEventClick={onEventClick}
            />
          </div>
        </>
      ) : viewMode === "week" ? (
        <TimeGridView
          allEvents={allEvents}
          days={weekDays}
          onDateClick={onDateClick}
          onEventClick={onEventClick}
        />
      ) : (
        <TimeGridView
          allEvents={allEvents}
          days={dayArray}
          onDateClick={onDateClick}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
}
