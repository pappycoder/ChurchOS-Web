"use client";

import * as React from "react";
import Link from "next/link";
import {
  Archive, ArchiveRestore, Bell, CalendarDays, CheckCheck, ChevronDown,
  ChevronRight, Church, ClipboardCheck, Download, FileText, HandCoins,
  HeartHandshake, History, LogIn, LogOut, Mail, MapPin, Megaphone,
  Pencil, Plus, ShieldCheck, Trash2, UserRound, Users, UserPlus,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useRoleLabelMap, resolveRoleLabel } from "@/hooks/use-roles";
import { useMyAuditLogs, auditEntryLabel, type AuditAction } from "@/hooks/use-audit-logs";
import {
  useNotificationsList, useMarkAsRead, formatRelativeTime,
  NOTIFICATION_TYPE_LABELS, NOTIFICATIONS_LIST_LIMIT, type Notification,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { NotificationDetailDialog } from "@/components/notifications/notification-detail-dialog";

type DashboardIcon = React.ComponentType<{ className?: string }>;

const COMMON_TASKS = [
  { permission: "members:all:read", href: "/members", label: "Find a member", icon: Users },
  { permission: "attendance:checkin:read", href: "/attendance/check-in", label: "Check in attendees", icon: ClipboardCheck },
  { permission: "visitors:list:read", href: "/visitors", label: "Follow up visitors", icon: UserPlus },
  { permission: "events:list:read", href: "/events/list", label: "View events", icon: CalendarDays },
  { permission: "forms:read", href: "/forms", label: "Open forms", icon: FileText },
];

const AUDIT_ICONS: Record<AuditAction, DashboardIcon> = {
  CREATE: Plus, UPDATE: Pencil, DELETE: Trash2, LOGIN: LogIn,
  LOGOUT: LogOut, EXPORT: Download, ARCHIVE: Archive, RESTORE: ArchiveRestore,
};

const NOTIFICATION_ICONS: Record<Notification["type"], DashboardIcon> = {
  system: Bell, attendance: ClipboardCheck, giving: HandCoins,
  event: CalendarDays, pastoral: HeartHandshake, broadcast: Megaphone,
};

function LoadingRows({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="divide-y px-5">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex animate-pulse gap-3 py-5" aria-hidden="true">
          <div className="size-9 shrink-0 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

function EmptyPanel({ icon: Icon, title, description }: { icon: DashboardIcon; title: string; description: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Icon className="size-5" /></span>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1.5 max-w-60 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function MyDashboard() {
  const profile = useCurrentProfile();
  const { canAny } = usePermissions();
  const labels = useRoleLabelMap();
  const auditLogs = useMyAuditLogs({ limit: 8 });
  const notifications = useNotificationsList({ page: 1, limit: NOTIFICATIONS_LIST_LIMIT, read: "all" });
  const recentNotifications = (notifications.data?.data ?? []).slice(0, 8);
  const markAsRead = useMarkAsRead();
  const notificationLauncher = React.useRef<HTMLButtonElement>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Notification | null>(null);

  const openNotification = (notification: Notification) => {
    if (!notification.readAt) markAsRead.mutate(notification.id);
    setSelected(notification);
  };

  if (profile.error) return <ErrorState title="Unable to load your dashboard" onRetry={() => { void profile.refetch(); }} retrying={profile.isFetching} />;
  if (profile.isLoading || !profile.data) {
    return (
      <div className="space-y-8" role="status" aria-label="Loading dashboard">
        <h1 className="sr-only">Dashboard</h1>
        <div className="flex animate-pulse items-center gap-4 py-2" aria-hidden="true"><div className="size-12 rounded-2xl bg-muted" /><div className="flex-1 space-y-3"><div className="h-7 w-2/3 rounded bg-muted" /><div className="h-4 w-1/2 rounded bg-muted" /></div></div>
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border bg-background" />)}</div>
        <div className="grid gap-6 lg:grid-cols-12"><Card className="gap-0 bg-background py-0 lg:col-span-7"><LoadingRows label="Loading notifications" /></Card><Card className="gap-0 bg-background py-0 lg:col-span-5"><LoadingRows label="Loading activity" /></Card></div>
      </div>
    );
  }

  const p = profile.data;
  const roles = p.role?.length ? p.role : ["No role assigned"];
  const initials = `${p.firstName?.charAt(0) ?? ""}${p.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
  const tasks = [...COMMON_TASKS.filter(task => canAny(task.permission)), { href: "/profile", label: "My profile", icon: UserRound }];
  const unreadCount = notifications.data?.unreadCount ?? 0;

  return (
    <>
      <div className="space-y-7 sm:space-y-8">
        <section aria-labelledby="dashboard-greeting" className="flex flex-col justify-between gap-4 min-[1200px]:flex-row min-[1200px]:items-center">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <Avatar className="mt-1 size-11 shrink-0 rounded-2xl sm:size-12">
              <AvatarImage src={p.avatarUrl} alt={`${p.firstName} ${p.lastName}`} />
              <AvatarFallback className="rounded-2xl bg-accent text-sm font-semibold text-accent-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Dashboard</p>
              <h1 id="dashboard-greeting" className="text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">Welcome back, {p.firstName || "there"}!</h1>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <span className="flex min-w-0 items-start gap-1.5"><Church className="mt-0.5 size-3.5 shrink-0" /><span className="[overflow-wrap:anywhere]">{p.church?.name || "Your church"}</span></span>
                <span className="flex min-w-0 items-start gap-1.5"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span className="[overflow-wrap:anywhere]">{p.branch?.name ?? "Your permitted branches"}</span></span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2.5 min-[1200px]:max-w-72 min-[1200px]:items-end">
            <div className="flex flex-wrap gap-1.5 min-[1200px]:justify-end">
              {roles.map(role => <Badge key={role} variant={role === "super_admin" ? "destructive" : "outline"} className="max-w-full whitespace-normal rounded-full text-[11px] font-medium [overflow-wrap:anywhere]">{resolveRoleLabel(role, labels)}</Badge>)}
            </div>
            <details className="group/account relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-medium shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                <ShieldCheck className="size-3.5 text-muted-foreground" />Account details<ChevronDown className="size-3.5 text-muted-foreground transition-transform group-open/account:rotate-180" />
              </summary>
              <div className="absolute start-0 top-full z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] space-y-4 rounded-2xl border bg-popover p-5 text-popover-foreground shadow-lg min-[1200px]:start-auto min-[1200px]:end-0">
                <p className="text-sm font-semibold [overflow-wrap:anywhere]">{p.firstName} {p.lastName}</p>
                <div className="flex items-start gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="text-xs text-muted-foreground">Email</p><p className="mt-0.5 text-sm [overflow-wrap:anywhere]">{p.email || "—"}</p></div></div>
                <div className="flex items-start gap-2.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Access</p><p className="mt-0.5 text-sm">{p.isAdminHq ? "HQ · permitted branches" : "Your branch"}</p></div></div>
                <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4">Open profile<ChevronRight className="size-3.5" /></Link>
              </div>
            </details>
          </div>
        </section>

        <section aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="mb-3.5 text-sm font-semibold">Quick actions</h2>
          <nav aria-label="Common tasks" className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3">
            {tasks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="group flex min-w-0 flex-col items-start gap-3 rounded-2xl border border-border/80 bg-background p-4 text-sm shadow-xs transition-colors hover:border-primary/25 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-row sm:items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/70 text-secondary-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground"><Icon className="size-[18px]" /></span>
                <span className="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">{label}</span><ChevronRight className="hidden size-4 shrink-0 text-muted-foreground/60 sm:block" />
              </Link>
            ))}
          </nav>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <Card role="region" aria-labelledby="dashboard-notifications-title" aria-busy={notifications.isLoading} className="gap-0 overflow-hidden rounded-2xl border-border/80 bg-background py-0 shadow-sm lg:col-span-7">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b px-5 py-5">
              <div className="flex flex-wrap items-center gap-2.5"><CardTitle id="dashboard-notifications-title" className="text-base">Notifications</CardTitle>{unreadCount > 0 && <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-medium">{unreadCount} unread</Badge>}</div>
              <Button ref={notificationLauncher} variant="ghost" size="sm" className="h-7 gap-1 px-1 text-xs text-muted-foreground" onClick={() => setDrawerOpen(true)}>View more<ChevronRight className="size-3.5" /></Button>
            </CardHeader>
            {notifications.isError ? (
              <ErrorState title="Unable to load notifications" onRetry={() => { void notifications.refetch(); }} retrying={notifications.isFetching} className="m-5 py-8 sm:py-8" />
            ) : notifications.isLoading ? <LoadingRows label="Loading notifications" /> : recentNotifications.length ? (
              <ul className="divide-y">
                {recentNotifications.map(notification => {
                  const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell;
                  const unread = !notification.readAt;
                  return <li key={notification.id}>
                    <button type="button" onClick={() => openNotification(notification)} className={cn("group flex w-full items-start gap-3 px-5 py-5 text-start transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring", unread && "bg-muted/20")}>
                      <span className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-xl", unread ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}><Icon className="size-4" />{unread && <span aria-hidden="true" className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background" />}</span>
                      <span className="min-w-0 flex-1">
                        {unread && <span className="sr-only">Unread: </span>}
                        <span className={cn("block text-sm leading-relaxed [overflow-wrap:anywhere] group-hover:underline", unread ? "font-semibold" : "font-medium text-foreground/80")}>{notification.title}</span>
                        {notification.body && <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{notification.body}</span>}
                      </span>
                      <span className="flex w-20 shrink-0 flex-col items-end gap-2 pt-0.5 text-end text-[10px] text-muted-foreground sm:w-28 sm:text-[11px]">
                        <span className="max-w-full rounded-md border border-border/70 px-1.5 py-0.5 [overflow-wrap:anywhere]">{NOTIFICATION_TYPE_LABELS[notification.type] ?? notification.type}</span>
                        <time dateTime={notification.createdAt} className="leading-relaxed">{formatRelativeTime(notification.createdAt)}</time>
                      </span>
                    </button>
                  </li>;
                })}
              </ul>
            ) : <EmptyPanel icon={CheckCheck} title="You're all caught up!" description="New updates for you will appear here." />}
          </Card>

          <Card role="region" aria-labelledby="dashboard-activity-title" aria-busy={auditLogs.isLoading} className="gap-0 overflow-hidden rounded-2xl border-border/80 bg-background py-0 shadow-sm lg:col-span-5">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-5 py-5"><CardTitle id="dashboard-activity-title" className="text-base">Recent activity</CardTitle><History className="size-4 text-muted-foreground" /></CardHeader>
            {auditLogs.isError ? (
              <ErrorState title="Unable to load account activity" onRetry={() => { void auditLogs.refetch(); }} retrying={auditLogs.isFetching} className="m-5 py-8 sm:py-8" />
            ) : auditLogs.isLoading ? <LoadingRows label="Loading activity" /> : auditLogs.data?.data.length ? (
              <ul className="px-5 py-2">
                {auditLogs.data.data.slice(0, 8).map(item => {
                  const Icon = AUDIT_ICONS[item.action] ?? History;
                  return <li key={item.id} className="group/activity relative flex items-start gap-3 py-4">
                    <span aria-hidden="true" className="absolute -bottom-4 start-[15px] top-12 w-px bg-border/70 group-last/activity:hidden" />
                    <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground"><Icon className="size-3.5" /></span>
                    <div className="min-w-0 flex-1 pt-1"><p className="text-sm leading-relaxed [overflow-wrap:anywhere]">{auditEntryLabel(item)}</p><time dateTime={item.createdAt} className="mt-1 block text-[11px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</time></div>
                  </li>;
                })}
              </ul>
            ) : <EmptyPanel icon={History} title="No activity yet." description="Your recent actions will appear here as you use ChurchOS." />}
          </Card>
        </div>
      </div>
      <NotificationsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} onOpenNotification={openNotification} onCloseAutoFocus={event => { event.preventDefault(); notificationLauncher.current?.focus(); }} />
      <NotificationDetailDialog notification={selected} open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }} />
    </>
  );
}
