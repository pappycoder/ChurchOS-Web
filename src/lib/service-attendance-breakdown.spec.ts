import { describe, it, expect } from "vitest";
import { serviceAttendanceBreakdown } from "./service-attendance-breakdown";
import type { AttendanceRecord } from "@/hooks/use-attendance";
const record = (fields: Partial<AttendanceRecord>) => ({
  attendanceId: "a",
  churchId: "c",
  source: "manual",
  checkInAt: "2026-10-29T09:00:00Z",
  createdAt: "2026-10-29T09:00:00Z",
  ...fields,
});
describe("service named check-in breakdown", () => {
  it("keeps missing age and unlinked identities separate", () => {
    const result = serviceAttendanceBreakdown([
      record({ memberId: "m", category: "adult" }),
      record({ visitorId: "v", category: "children" }),
      record({ category: "unspecified" }),
      record({ visitorName: "Walk-in", source: "walk_in" }),
    ]);
    expect(result.age).toEqual([
      { name: "Adults", value: 1 },
      { name: "Children", value: 1 },
      { name: "Not supplied", value: 2 },
    ]);
    expect(result.identity).toEqual([
      { name: "Members", value: 1 },
      { name: "Visitors / walk-ins", value: 2 },
      { name: "Unlinked", value: 1 },
    ]);
  });
  it("uses every returned record and each dimension sums to the same total", () => {
    const rows = Array.from({ length: 125 }, () =>
      record({ memberId: "m", category: "adult" }),
    );
    const result = serviceAttendanceBreakdown(rows);
    expect(result.age.reduce((sum, item) => sum + item.value, 0)).toBe(125);
    expect(result.identity).toEqual([
      { name: "Members", value: 125 },
      { name: "Visitors / walk-ins", value: 0 },
    ]);
  });
  it("keeps zero values for an empty-state chart", () => {
    const result = serviceAttendanceBreakdown([]);
    expect(result.age.every((item) => item.value === 0)).toBe(true);
    expect(result.identity.every((item) => item.value === 0)).toBe(true);
  });
});
