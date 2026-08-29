"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useMarkAsRead,
  useDeleteNotification,
  NOTIFICATION_TYPE_LABELS,
  formatRelativeTime,
  type NotificationType,
} from "@/hooks/use-notifications";

interface NotificationDetailDialogProps {
  notification:
    | { id: string; type: NotificationType; title: string; body: string; createdAt: string; readAt?: string }
    | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
  onDeleted,
}: NotificationDetailDialogProps) {
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  // Auto-mark read when the dialog opens for an unread notification.
  useEffect(() => {
    if (open && notification && !notification.readAt) {
      markAsRead.mutate(notification.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notification?.id]);

  if (!notification) return null;

  const handleDelete = () => {
    deleteNotification.mutate(notification.id, {
      onSuccess: () => {
        toast.success("Notification deleted");
        onOpenChange(false);
        onDeleted?.();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to delete notification");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">{NOTIFICATION_TYPE_LABELS[notification.type] ?? notification.type}</Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          <DialogTitle>{notification.title}</DialogTitle>
          <DialogDescription className="pt-2 whitespace-pre-wrap text-foreground/90">
            {notification.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={deleteNotification.isPending}
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
