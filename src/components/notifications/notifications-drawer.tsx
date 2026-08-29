"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TablePagination } from "@/components/shared/table-pagination";
import { BellOff, Trash2, CheckCheck } from "lucide-react";
import {
  useNotificationsList,
  useMarkAsRead,
  useDeleteNotification,
  NOTIFICATION_TYPE_LABELS,
  formatRelativeTime,
  type Notification,
  type NotificationType,
} from "@/hooks/use-notifications";

const PAGE_SIZE = 15;

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenNotification: (notification: Notification) => void;
}

export function NotificationsDrawer({
  open,
  onOpenChange,
  onOpenNotification,
}: NotificationsDrawerProps) {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isFetching } = useNotificationsList({
    page,
    limit: PAGE_SIZE,
  });

  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleOpen = (n: Notification) => {
    if (!n.readAt) markAsRead.mutate(n.id);
    onOpenNotification(n);
  };

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id, {
      onError: (error: Error) => toast.error(error.message || "Failed to mark as read"),
    });
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id, {
      onError: (error: Error) => toast.error(error.message || "Failed to delete notification"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center justify-between">
            <span>All notifications</span>
            <Badge variant="secondary">{total}</Badge>
          </SheetTitle>
          <SheetDescription>Your in-app activity and updates.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading || isFetching ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6">
              <EmptyState
                icon={<BellOff className="h-8 w-8" />}
                title="No notifications"
                description="You're all caught up."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    className="flex-1 text-left group"
                  >
                    <span className="flex items-center gap-2">
                      {!n.readAt && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-hidden />
                      )}
                      <span
                        className={`text-sm font-medium ${n.readAt ? "text-foreground/80" : "text-foreground"}`}
                      >
                        {n.title}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground line-clamp-2">
                      {n.body}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {NOTIFICATION_TYPE_LABELS[n.type as NotificationType] ?? n.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </span>
                  </button>
                  <div className="flex flex-shrink-0 flex-col gap-1 pt-1">
                    {!n.readAt && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Mark as read"
                        aria-label="Mark as read"
                        onClick={() => handleMarkRead(n.id)}
                        disabled={markAsRead.isPending}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete notification"
                      aria-label="Delete notification"
                      onClick={() => handleDelete(n.id)}
                      disabled={deleteNotification.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <TablePagination
            page={page}
            perPage={PAGE_SIZE}
            total={total}
            itemName="notifications"
            onPageChange={(p) => setPage(Math.max(p, 1))}
            onPerPageChange={() => setPage(1)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
