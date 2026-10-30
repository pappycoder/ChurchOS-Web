"use client";

import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEntry } from "@/lib/event-calendar";
import { EVENT_TYPE_MAP, type EventItem } from "@/hooks/use-events";
import { eventTones } from "./event-presentation";
import { cn } from "@/lib/utils";
import { PermissionLink } from "@/components/shared/permission-link";
import { usePermissions } from "@/hooks/use-permissions";

export function CalendarSidebar({
  selectedDate,
  entries,
  onEventClick,
  onCreate,
  isLoading,
  incomplete,
}: {
  selectedDate: Date;
  entries: CalendarEntry[];
  onEventClick: (event: EventItem) => void;
  onCreate?: () => void;
  isLoading: boolean;
  incomplete: boolean;
}) {
  const { can } = usePermissions();
  return (
    <Card
      tabIndex={-1}
      aria-label="Selected day agenda"
      className="min-w-0 self-start lg:sticky lg:top-4"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Selected day</p>
          <CardTitle>{format(selectedDate, "EEEE, MMM d")}</CardTitle>
        </div>
        {onCreate && (
          <Button
            size="icon"
            variant="outline"
            aria-label="Create event on selected day"
            onClick={onCreate}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && entries.length === 0 ? (
          <Skeleton className="h-24" />
        ) : entries.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {incomplete
              ? "Some calendar data is unavailable. Retry above to check this day."
              : "No loaded events or services on this day."}
          </p>
        ) : (
          entries.map((entry) => {
            const type =
              entry.type === "event" ? entry.item.type : "attendance";
            const content = (
              <>
                <p className="text-[11px] font-medium opacity-80">
                  {format(entry.start, "h:mm a")}
                  {entry.end ? ` – ${format(entry.end, "h:mm a")}` : ""}
                </p>
                <p className="mt-1 break-words text-sm font-semibold">
                  {entry.title}
                </p>
                <p className="mt-1 text-[11px] opacity-80">
                  {entry.type === "event"
                    ? EVENT_TYPE_MAP[entry.item.type]
                    : "Attendance service"}
                </p>
              </>
            );
            const classes = cn(
              "block w-full rounded-xl border p-3 text-left transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-ring",
              eventTones[type],
            );
            return entry.type === "event" ? (
              <button
                key={entry.id}
                className={classes}
                onClick={() => onEventClick(entry.item)}
              >
                {content}
              </button>
            ) : can("attendance:services", "read") ? (
              <PermissionLink
                key={entry.id}
                className={classes}
                href={`/gatherings/attendance/services/${entry.item.serviceId}`}
              >
                {content}
              </PermissionLink>
            ) : (
              <div key={entry.id} className={classes}>
                {content}
              </div>
            );
          })
        )}
        {incomplete && entries.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing available calendar data.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
