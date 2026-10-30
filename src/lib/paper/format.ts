import { format, formatDistanceToNow, parseISO } from "date-fns";

/** Fixed "today" for deterministic preview rendering. Never call new Date()
 * during render under cache components — use DEMO_TODAY until runtime. */
export const PAPER_TODAY = "2026-10-30";

export function currency(value: number, opts?: { compact?: boolean; code?: string }): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts?.code ?? "USD",
    maximumFractionDigits: opts?.compact ? 1 : 0,
    notation: opts?.compact ? "compact" : "standard",
  }).format(value);
}

export function number(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function shortDate(value: string): string {
  return format(parseISO(value), "MMM d");
}

export function longDate(value: string): string {
  return format(parseISO(value), "EEEE, MMMM d");
}

export function dayMonth(value: string): string {
  return format(parseISO(value), "EEE, MMM d");
}

export function monthYear(value: string): string {
  return format(parseISO(value), "MMMM yyyy");
}

export function timeLabel(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function percent(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export { formatDistanceToNow };
