import { describe, it, expect } from "vitest";
import { calendarEntries, entriesForDay } from "./event-calendar";
import type { ChurchService } from "@/hooks/use-attendance";
import type { EventItem } from "@/hooks/use-events";

const service = {
  serviceId: "sunday",
  name: "Sunday worship",
  dayOfWeek: 0,
  isActive: true,
  startTime: "09:30",
  endTime: "11:00",
} as ChurchService;
describe("loaded event calendar projection", () => {
  it("includes Sunday zero and adjacent-month occurrences within the displayed range", () => {
    const result = calendarEntries(
      [],
      [service],
      new Date(2026, 9, 25),
      new Date(2026, 10, 7),
    );
    expect(result).toHaveLength(2);
    expect(result.map((item) => item.start.getDate())).toEqual([25, 1]);
    expect(result[0].start.getHours()).toBe(9);
    expect(result[0].end?.getHours()).toBe(11);
    expect(new Set(result.map((item) => item.id)).size).toBe(2);
  });
  it("excludes inactive and unspecified weekdays without inventing occurrences", () => {
    expect(
      calendarEntries(
        [],
        [
          { ...service, isActive: false },
          { ...service, dayOfWeek: undefined },
        ],
        new Date(2026, 10, 1),
        new Date(2026, 10, 7),
      ),
    ).toEqual([]);
  });
  it("sorts agenda entries and keeps events on their existing start day", () => {
    const event = {
      eventId: "event",
      title: "Conference",
      startDate: new Date(2026, 10, 1, 8).toISOString(),
      endDate: new Date(2026, 10, 2, 15).toISOString(),
      type: "conference",
    } as EventItem;
    const entries = calendarEntries(
      [event],
      [service],
      new Date(2026, 10, 1),
      new Date(2026, 10, 2),
    );
    expect(
      entriesForDay(entries, new Date(2026, 10, 1)).map((item) => item.title),
    ).toEqual(["Conference", "Sunday worship"]);
    expect(entriesForDay(entries, new Date(2026, 10, 2))).toEqual([]);
  });
});
