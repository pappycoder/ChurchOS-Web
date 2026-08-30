"use client";

import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEventsList } from "@/hooks/use-events";
import { useGivingTransactions } from "@/hooks/use-giving";
import { formatNaira } from "@/hooks/use-analytics";
import type { EventItem } from "@/hooks/use-events";

function formatDateRange(ev: EventItem): string {
  const start = new Date(ev.startDate);
  const date = start.toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!ev.endDate) return date;
  const end = new Date(ev.endDate);
  if (end.getTime() === start.getTime()) return date;
  return `${date} – ${end.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`;
}

interface UpcomingEventsProps {
  enabled?: boolean;
  limit?: number;
}

export function UpcomingEvents({ enabled = true, limit = 5 }: UpcomingEventsProps) {
  const query = useEventsList({
    page: 1,
    limit,
    status: "upcoming",
    sortBy: "startDate",
    sortOrder: "asc",
  });

  if (!enabled) return null;
  const events = query.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Upcoming Events
        </CardTitle>
        <Link
          href="/events/list"
          className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No upcoming events.</p>
        ) : (
          <ul className="divide-y">
            {events.map((ev) => (
              <li key={ev.eventId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium capitalize">{ev.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {ev.type} · {formatDateRange(ev)}
                  </p>
                </div>
                <Link
                  href={`/events/${ev.eventId}`}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Details
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface RecentGivingProps {
  enabled?: boolean;
  limit?: number;
}

export function RecentGiving({ enabled = true, limit = 5 }: RecentGivingProps) {
  const query = useGivingTransactions({
    page: 1,
    limit,
    sortBy: "created_at",
    sortOrder: "desc",
  });
  if (!enabled) return null;
  const txns = query.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Recent Giving</CardTitle>
        <Link
          href="/giving"
          className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
        >
          Records <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
        ) : txns.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No giving yet.</p>
        ) : (
          <ul className="divide-y">
            {txns.map((t) => (
              <li key={t.transactionId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.memberName || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.categoryName}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatNaira(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
