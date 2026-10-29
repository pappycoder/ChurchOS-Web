import type { AttendanceRecord } from "@/hooks/use-attendance";

/** The service endpoint returns all named check-ins, independent of reported totals. */
export function serviceAttendanceBreakdown(records: AttendanceRecord[]) {
  const age = { Adults: 0, Children: 0, "Not supplied": 0 };
  const identity = { Members: 0, "Visitors / walk-ins": 0, Unlinked: 0 };
  for (const record of records) {
    age[
      record.category === "adult"
        ? "Adults"
        : record.category === "children"
          ? "Children"
          : "Not supplied"
    ]++;
    identity[
      record.memberId
        ? "Members"
        : record.visitorId || record.visitorName || record.source === "walk_in"
          ? "Visitors / walk-ins"
          : "Unlinked"
    ]++;
  }
  const series = (counts: Record<string, number>) =>
    Object.entries(counts).map(([name, value]) => ({ name, value }));
  return {
    age: series(age),
    identity: series(identity).filter(
      (item) => item.name !== "Unlinked" || item.value > 0,
    ),
  };
}
