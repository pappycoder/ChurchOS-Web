"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, ArrowUpRight, UsersRound, ScanLine, UserRoundCheck, CalendarDays, ClipboardList } from "lucide-react";
import dynamic from "next/dynamic";
import * as m from "motion/react-m";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useMarkAsRead, type Notification } from "@/hooks/use-notifications";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { NotificationDetailDialog } from "@/components/notifications/notification-detail-dialog";
const DashboardCharts = dynamic(() => import("@/components/dashboard/dashboard-charts").then(module => module.DashboardCharts), {
  loading: () => <div aria-label="Loading insights" className="grid min-h-96 gap-5 sm:grid-cols-2"><div className="h-72 animate-pulse rounded-2xl border bg-card" /><div className="h-72 animate-pulse rounded-2xl border bg-card" /></div>,
});

const tasks = [
  { permission: "members:all:read", href: "/members", label: "Find a member", description: "Your people, connected", icon: UsersRound },
  { permission: "attendance:checkin:read", href: "/attendance/check-in", label: "Check in", description: "Make every welcome count", icon: ScanLine },
  { permission: "visitors:list:read", href: "/visitors", label: "Follow up", description: "Turn a visit into belonging", icon: UserRoundCheck },
  { permission: "events:list:read", href: "/events/list", label: "Events", description: "Bring people together", icon: CalendarDays },
  { permission: "forms:read", href: "/forms", label: "Forms", description: "Collect what matters", icon: ClipboardList },
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

  const allowedTasks = tasks.filter(task => canAny(task.permission));
  return (
    <>
      <div className="space-y-8">
        <section className="workspace-welcome relative overflow-hidden rounded-2xl border p-6 sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <p className="workspace-eyebrow mb-3">A LITTLE CLARITY. MORE CONNECTION.</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {profile.data.firstName || "there"}.</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Make room for what matters. Your people, gatherings and next steps are all here.</p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button variant="default" size="sm" onClick={() => setDrawerOpen(true)}><Bell className="size-4" />Notifications</Button>
              <Button variant="ghost" size="sm" asChild><Link href="/profile">Your profile<ArrowUpRight className="size-4" /></Link></Button>
            </div>
          </div>
          <div aria-hidden="true" className="workspace-welcome-art"><span /><span /><span /></div>
        </section>
        {allowedTasks.length > 0 && <section aria-labelledby="workspace-tasks-heading">
          <div className="mb-4 flex items-baseline justify-between gap-3"><h2 id="workspace-tasks-heading" className="text-base font-semibold">A good place to start</h2><span className="hidden text-xs text-muted-foreground sm:inline">Everyday essentials</span></div>
          <nav aria-label="Common tasks" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
            {allowedTasks.map(({ href, label, description, icon: Icon }) => <m.div key={href} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
              <Link href={href} className="workspace-task group flex h-full flex-col rounded-xl border bg-card p-4 outline-offset-4 sm:p-5">
                <span className="mb-5 flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary"><Icon className="size-[18px]" /></span><ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" /></span>
                <span className="text-sm font-semibold">{label}</span><span className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</span>
              </Link>
            </m.div>)}
          </nav>
        </section>}
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
