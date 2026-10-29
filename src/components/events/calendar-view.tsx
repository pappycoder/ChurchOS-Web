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
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  calendarEntries,
  entriesForDay,
  type CalendarEntry,
} from "@/lib/event-calendar";
import { EVENT_TYPE_MAP, type EventItem } from "@/hooks/use-events";
import type { ChurchService } from "@/hooks/use-attendance";
import { eventTones } from "./event-presentation";

type ViewMode = "month" | "week" | "day";
export function CalendarView({
  events,
  services,
  selectedDate,
  onDateClick,
  onEventClick,
  isLoading,
}: {
  events: EventItem[];
  services: ChurchService[];
  selectedDate: Date;
  onDateClick: (date: Date) => void;
  onEventClick: (event: EventItem) => void;
  isLoading: boolean;
}) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("month");
  const start =
    viewMode === "month"
      ? startOfWeek(startOfMonth(selectedDate))
      : viewMode === "week"
        ? startOfWeek(selectedDate)
        : selectedDate;
  const end =
    viewMode === "month"
      ? endOfWeek(endOfMonth(selectedDate))
      : viewMode === "week"
        ? endOfWeek(selectedDate)
        : selectedDate;
  const entries = calendarEntries(events, services, start, end);
  const days = eachDayOfInterval({ start, end });
  const move = (direction: number) =>
    onDateClick(
      viewMode === "month"
        ? direction < 0
          ? subMonths(selectedDate, 1)
          : addMonths(selectedDate, 1)
        : viewMode === "week"
          ? direction < 0
            ? subWeeks(selectedDate, 1)
            : addWeeks(selectedDate, 1)
          : direction < 0
            ? subDays(selectedDate, 1)
            : addDays(selectedDate, 1),
    );
  const openEntry = (entry: CalendarEntry) => {
    onDateClick(entry.start);
    if (entry.type === "event") onEventClick(entry.item);
  };
  const chip = (entry: CalendarEntry) => (
    <button
      key={entry.id}
      type="button"
      title={`${entry.title} · ${format(entry.start, "h:mm a")} · ${entry.type === "event" ? EVENT_TYPE_MAP[entry.item.type] : "Attendance service"}`}
      className={cn(
        "block w-full truncate rounded-md border px-1 py-1 text-left text-[10px] font-medium leading-tight sm:px-1.5 sm:text-xs focus-visible:outline-2 focus-visible:outline-ring",
        eventTones[entry.type === "event" ? entry.item.type : "attendance"],
      )}
      onClick={() => openEntry(entry)}
    >
      {entry.title}
    </button>
  );
  const title =
    viewMode === "month"
      ? format(selectedDate, "MMMM yyyy")
      : viewMode === "week"
        ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
        : format(selectedDate, "EEE, MMM d, yyyy");

  return (
    <section aria-label="Events calendar" className="min-w-0 p-2 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-base font-semibold tracking-tight sm:text-lg"
          aria-live="polite"
        >
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-lg border bg-muted/40 p-0.5"
            aria-label="Calendar view"
          >
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                aria-pressed={viewMode === mode}
                className={cn(
                  "min-h-9 rounded-md px-2 text-xs font-medium capitalize sm:px-3",
                  viewMode === mode
                    ? "border border-primary/20 bg-background text-[var(--workspace-accent-readable,var(--primary))] shadow-xs"
                    : "border border-transparent text-muted-foreground hover:bg-background",
                )}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous period"
              onClick={() => move(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateClick(new Date())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next period"
              onClick={() => move(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      {isLoading && (
        <p
          className="mb-3 animate-pulse text-xs text-muted-foreground"
          role="status"
        >
          Loading calendar…
        </p>
      )}
      {viewMode === "month" ? (
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="border-b bg-muted/35 py-2.5 text-center text-[10px] font-medium text-muted-foreground sm:text-xs"
            >
              {day}
            </div>
          ))}
          {days.map((day) => {
            const items = entriesForDay(entries, day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-w-0 border-b border-r p-0.5 pb-2 sm:min-h-28 sm:p-1.5",
                  !isSameMonth(day, selectedDate) && "bg-muted/25",
                  isSameDay(day, selectedDate) &&
                    "bg-primary/5 ring-1 ring-inset ring-primary/40",
                )}
              >
                <button
                  type="button"
                  aria-label={format(day, "EEEE, MMMM d, yyyy")}
                  aria-pressed={isSameDay(day, selectedDate)}
                  className={cn(
                    "mb-1 flex min-h-9 w-full items-center justify-center rounded-lg text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring sm:w-9",
                    isToday(day) &&
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                    !isSameMonth(day, selectedDate) && "text-muted-foreground",
                  )}
                  onClick={() => onDateClick(day)}
                >
                  {format(day, "d")}
                </button>
                <div className="space-y-1">
                  {items.slice(0, 3).map(chip)}
                  {items.length > 3 && (
                    <button
                      type="button"
                      className="min-h-8 w-full rounded px-0.5 text-left text-[10px] font-medium text-muted-foreground hover:bg-muted sm:text-xs"
                      aria-label={`${items.length - 3} more on ${format(day, "MMMM d")}`}
                      onClick={() => {
                        onDateClick(day);
                        requestAnimationFrame(() =>
                          document
                            .querySelector<HTMLElement>(
                              '[aria-label="Selected day agenda"]',
                            )
                            ?.focus(),
                        );
                      }}
                    >
                      +{items.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="max-h-[620px] overflow-auto rounded-xl border">
          <div style={{ minWidth: viewMode === "week" ? 600 : undefined }}>
            <div
              className="grid sticky top-0 z-10 bg-card"
              style={{
                gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0,1fr))`,
              }}
            >
              <div className="border-b" />
              {days.map((day) => (
                <button
                  type="button"
                  key={day.toISOString()}
                  className="border-b border-l p-3 text-xs font-medium"
                  onClick={() => onDateClick(day)}
                >
                  {format(day, "EEE d")}
                </button>
              ))}
            </div>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="grid"
                style={{
                  gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0,1fr))`,
                }}
              >
                <div className="border-b p-2 text-right text-[10px] text-muted-foreground">
                  {format(new Date(2026, 0, 1, hour), "ha")}
                </div>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="relative min-h-11 min-w-0 space-y-1 border-b border-l p-1"
                  >
                    <button
                      type="button"
                      aria-label={`Select ${format(day, "MMM d")} at ${hour}:00`}
                      className="absolute inset-0 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-ring"
                      onClick={() => {
                        const date = new Date(day);
                        date.setHours(hour, 0, 0, 0);
                        onDateClick(date);
                      }}
                    />
                    <div className="relative pointer-events-none space-y-1 [&_button]:pointer-events-auto">
                      {entriesForDay(entries, day)
                        .filter((entry) => entry.start.getHours() === hour)
                        .map(chip)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        aria-label="Calendar legend"
        className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[10px] text-muted-foreground sm:text-xs"
      >
        {Object.entries(eventTones).map(([type, tone]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span
              className={cn("size-2.5 rounded-full border", tone)}
              aria-hidden="true"
            />
            {type === "attendance"
              ? "Attendance service"
              : EVENT_TYPE_MAP[type as keyof typeof EVENT_TYPE_MAP]}
          </span>
        ))}
      </div>
    </section>
  );
}
