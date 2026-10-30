"use client";
import { BranchDetail } from "@/components/shared/branch-assignment";

import * as React from "react";
import { PermissionLink as Link } from "@/components/shared/permission-link";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { toast } from "@/lib/toast";
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
import { EventItem, useDeleteEvent } from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";
import { EventTypeBadge, eventsWorkspaceClass } from "./event-presentation";
import { DetailManagementMenu } from "@/components/shared/detail-management-menu";

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
  const managementRef = React.useRef<HTMLButtonElement>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (!event) return null;

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
        <DialogContent
          className={`${eventsWorkspaceClass} max-h-[90dvh] overflow-y-auto p-0 sm:max-w-md`}
        >
          <DialogHeader className="border-b bg-muted/25 px-6 py-5 pr-12">
            <DialogTitle className="text-lg leading-tight">
              {event.title}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            <BranchDetail record={event} />
            <div className="flex flex-wrap items-center gap-2">
              <EventTypeBadge type={event.type} />
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
            <DetailManagementMenu
              label="Event preview management"
              triggerRef={managementRef}
              actions={[
                ...(canUpdate
                  ? [
                      {
                        label: "Edit",
                        icon: Pencil,
                        onSelect: () => {
                          onOpenChange(false);
                          router.push(`/gatherings/events/${event.eventId}/edit`);
                        },
                      },
                    ]
                  : []),
                ...(canDelete
                  ? [
                      {
                        label: "Delete",
                        icon: Trash2,
                        destructive: true,
                        onSelect: () => setDeleteOpen(true),
                      },
                    ]
                  : []),
              ]}
            />
            {can("events:all", "read") && (
              <Button asChild>
                <Link href={`/gatherings/events/${event.eventId}`}>View Details</Link>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            if (managementRef.current?.isConnected) {
              event.preventDefault();
              requestAnimationFrame(() => managementRef.current?.focus());
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{event.title}&quot;? This
              action cannot be undone.
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
              loading={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
