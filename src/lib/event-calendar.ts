import { eachDayOfInterval, format, isSameDay } from "date-fns";
import type { EventItem } from "@/hooks/use-events";
import type { ChurchService } from "@/hooks/use-attendance";

export type CalendarEntry = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
} & (
  { type: "event"; item: EventItem } | { type: "service"; item: ChurchService }
);

/** Loaded records only. Preserve event start-day and local recurring-service semantics. */
export function calendarEntries(
  events: EventItem[],
  services: ChurchService[],
  start: Date,
  end: Date,
): CalendarEntry[] {
  const items: CalendarEntry[] = events.map((item) => ({
    id: `event-${item.eventId}`,
    title: item.title,
    start: new Date(item.startDate),
    end: item.endDate ? new Date(item.endDate) : undefined,
    type: "event",
    item,
  }));
  for (const day of eachDayOfInterval({ start, end })) {
    for (const item of services) {
      if (
        item.dayOfWeek == null ||
        !item.isActive ||
        day.getDay() !== item.dayOfWeek
      )
        continue;
      const at = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        const date = new Date(day);
        date.setHours(hours, minutes, 0, 0);
        return date;
      };
      items.push({
        id: `svc-${item.serviceId}-${format(day, "yyyy-MM-dd")}`,
        title: item.name,
        start: at(item.startTime || "09:00"),
        end: item.endTime ? at(item.endTime) : undefined,
        type: "service",
        item,
      });
    }
  }
  return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}
export function entriesForDay(entries: CalendarEntry[], day: Date) {
  return entries.filter((entry) => isSameDay(entry.start, day));
}
