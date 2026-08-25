"use client";

import { useMemo } from "react";
import { format, isAfter } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EventItem,
  EventType,
  EVENT_TYPE_MAP,
} from "@/hooks/use-events";

export const EVENT_TYPE_COLORS: Record<EventType | "service", string> = {
  service: "bg-blue-500",
  conference: "bg-purple-500",
  lifecycle: "bg-pink-500",
  training: "bg-amber-500",
  social: "bg-green-500",
};

const EVENT_TYPE_BORDER_COLORS: Record<EventType, string> = {
  service: "border-l-blue-500",
  conference: "border-l-purple-500",
  lifecycle: "border-l-pink-500",
  training: "border-l-amber-500",
  social: "border-l-green-500",
};

const LEGEND_ITEMS: { label: string; key: string; colorClass: string }[] = [
  { label: EVENT_TYPE_MAP.service, key: "service", colorClass: EVENT_TYPE_COLORS.service },
  { label: EVENT_TYPE_MAP.conference, key: "conference", colorClass: EVENT_TYPE_COLORS.conference },
  { label: EVENT_TYPE_MAP.lifecycle, key: "lifecycle", colorClass: EVENT_TYPE_COLORS.lifecycle },
  { label: EVENT_TYPE_MAP.training, key: "training", colorClass: EVENT_TYPE_COLORS.training },
  { label: EVENT_TYPE_MAP.social, key: "social", colorClass: EVENT_TYPE_COLORS.social },
  { label: "Attendance Service", key: "services", colorClass: "bg-slate-400" },
];

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events: EventItem[];
  isLoading: boolean;
}

export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  events,
  isLoading,
}: CalendarSidebarProps) {
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => isAfter(new Date(e.startDate), now))
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )
      .slice(0, 5);
  }, [events]);

  return (
    <Card className="sticky top-4">
      <CardContent className="space-y-0 divide-y">
        <div className="pb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Datepicker
          </p>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) onDateSelect(date);
            }}
            className="w-full"
          />
        </div>

        <div className="py-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            Event Types
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.colorClass}`} />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            Upcoming Events
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming events.
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={`border-l-4 ${EVENT_TYPE_BORDER_COLORS[event.type]} pl-3 py-1.5`}
                >
                  <p className="text-sm font-medium leading-snug line-clamp-1">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.startDate), "MMM d, yyyy")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
