"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, ArrowUpRight } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useMarkAsRead, type Notification } from "@/hooks/use-notifications";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { NotificationDetailDialog } from "@/components/notifications/notification-detail-dialog";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

const tasks = [
  ["members:all:read", "/members", "Find a member"],
  ["attendance:checkin:read", "/attendance/check-in", "Check in"],
  ["visitors:list:read", "/visitors", "Follow up"],
  ["events:list:read", "/events/list", "Events"],
  ["forms:read", "/forms", "Forms"],
];

export function MyDashboard() {
  const profile = useCurrentProfile();
  const { canAny } = usePermissions();
  const markAsRead = useMarkAsRead();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Notification | null>(null);
  const openNotification = (notification: Notification) => {
    if (!notification.readAt) markAsRead.mutate(notification.id);
    setDrawerOpen(false);
    setSelected(notification);
  };

  if (profile.error)
    return <ErrorState title="Unable to load your dashboard" />;
  if (profile.isLoading || !profile.data)
    return (
      <div
        className="h-20 animate-pulse rounded-2xl bg-muted/50"
        aria-label="Loading dashboard"
      />
    );

  const allowedTasks = tasks.filter(([permission]) => canAny(permission));
  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Welcome back,{" "}
            <span className="font-medium text-foreground">
              {profile.data.firstName || "there"}
            </span>
            .
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDrawerOpen(true)}
            >
              <Bell className="size-4" />
              Notifications
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                View profile
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        {allowedTasks.length > 0 && (
          <nav aria-label="Common tasks" className="flex flex-wrap gap-2">
            {allowedTasks.map(([, href, label]) => (
              <Button
                key={href}
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-full bg-card px-3 text-xs shadow-none"
              >
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </nav>
        )}
        <DashboardCharts />
      </div>
      <NotificationsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpenNotification={openNotification}
      />
      <NotificationDetailDialog
        notification={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
