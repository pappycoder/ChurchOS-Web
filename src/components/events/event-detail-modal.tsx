"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { EventItem, EVENT_TYPE_MAP, useDeleteEvent } from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";
import { EVENT_TYPE_COLORS } from "./calendar-sidebar";

const BADGE_TEXT_CLASSES: Record<string, string> = {
  "bg-blue-500": "text-blue-700 bg-blue-50 border-blue-200",
  "bg-purple-500": "text-purple-700 bg-purple-50 border-purple-200",
  "bg-pink-500": "text-pink-700 bg-pink-50 border-pink-200",
  "bg-amber-500": "text-amber-700 bg-amber-50 border-amber-200",
  "bg-green-500": "text-green-700 bg-green-50 border-green-200",
};

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventItem | null;
}

function formatDateRange(start: string, end?: string): string {
  const startDate = new Date(start);
  if (!end) return format(startDate, "MMM d, yyyy");

  const endDate = new Date(end);
  if (isSameDay(startDate, endDate)) return format(startDate, "MMM d, yyyy");
  return `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`;
}

function formatTimeRange(start: string, end?: string): string | null {
  const startDate = new Date(start);
  const time = format(startDate, "h:mm a");
  if (!end) return time;
  const endDate = new Date(end);
  return `${time} – ${format(endDate, "h:mm a")}`;
}

export function EventDetailModal({
  open,
  onOpenChange,
  event,
}: EventDetailModalProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdate = can("events", "update");
  const canDelete = can("events", "delete");
  const deleteMutation = useDeleteEvent();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (!event) return null;

  const colorClass = EVENT_TYPE_COLORS[event.type];
  const badgeClasses = BADGE_TEXT_CLASSES[colorClass] ?? "";
  const timeRange = formatTimeRange(event.startDate, event.endDate);

  const handleDelete = () => {
    deleteMutation.mutate(event.eventId, {
      onSuccess: () => {
        toast.success("Event deleted");
        onOpenChange(false);
        setDeleteOpen(false);
      },
      onError: (err) => {
        toast.error("Failed to delete event", {
          description: err?.message || "Please try again.",
        });
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="bg-gray-900 text-white px-6 py-5">
          <DialogTitle className="text-white text-xl leading-tight">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={badgeClasses}>
              {EVENT_TYPE_MAP[event.type]}
            </Badge>
            <Badge variant={event.isFree ? "secondary" : "outline"}>
              {event.isFree ? "Free" : "Paid"}
            </Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <span className="font-medium">
                  {formatDateRange(event.startDate, event.endDate)}
                </span>
                {timeRange && (
                  <p className="text-muted-foreground">{timeRange}</p>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                {event.registrationCount} registered
                {event.capacity ? ` / ${event.capacity} capacity` : ""}
              </span>
            </div>

            {!event.isFree && event.price != null && (
              <div className="flex items-start gap-2.5">
                <DollarSign className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>₦{event.price.toLocaleString()}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground leading-relaxed border-t pt-4">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canUpdate && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                router.push(`/events/${event.eventId}/edit`);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button asChild>
            <Link href={`/events/${event.eventId}`}>View Details</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{event.title}&quot;? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
