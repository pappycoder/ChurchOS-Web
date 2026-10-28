"use client";
import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import { ErrorState } from "@/components/shared/error-state";

import * as React from "react";
import { Bell, CalendarDays, ChevronRight, ClipboardCheck, FileText, History, Mail, ShieldCheck, Sparkles, UserRound, Users, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useRoleLabelMap, resolveRoleLabel } from "@/hooks/use-roles";
import { useMyAuditLogs, auditEntryLabel } from "@/hooks/use-audit-logs";
import {
  useNotificationsList,
  useMarkAsRead,
  formatRelativeTime,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATIONS_LIST_LIMIT,
  type Notification,
} from "@/hooks/use-notifications";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { NotificationDetailDialog } from "@/components/notifications/notification-detail-dialog";

const COMMON_TASKS = [
  { permission: "members:all:read", href: "/members", label: "Find a member", icon: Users },
  { permission: "attendance:checkin:read", href: "/attendance/check-in", label: "Check in attendees", icon: ClipboardCheck },
  { permission: "visitors:list:read", href: "/visitors", label: "Follow up visitors", icon: UserPlus },
  { permission: "events:list:read", href: "/events/list", label: "View events", icon: CalendarDays },
  { permission: "forms:read", href: "/forms", label: "Open forms", icon: FileText },
];

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium break-words">{value ?? "—"}</div>
      </div>
    </div>
  );
}

export function MyDashboard() {
  const profile = useCurrentProfile();
  const {canAny} = usePermissions();
  const labels = useRoleLabelMap();
  const auditLogs = useMyAuditLogs({ limit: 8 });
  const notifications = useNotificationsList({
    page: 1,
    limit: NOTIFICATIONS_LIST_LIMIT,
    read: "all",
  });
  const recentNotifications = (notifications.data?.data ?? []).slice(0, 8);
  const markAsRead = useMarkAsRead();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Notification | null>(null);

  const openNotification = (n: Notification) => {
    if (!n.readAt) markAsRead.mutate(n.id);
    setSelected(n);
  };

  if (profile.error) return <ErrorState title="Unable to load your dashboard" />;
  if (profile.isLoading || !profile.data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const p = profile.data;
  const roles = p.role?.length ? p.role : ["No role assigned"];
  const firstName = p.firstName || "there";

  return (
    <>
    <div className="space-y-6">
      <Card className="relative gap-4 overflow-hidden rounded-2xl border-primary/10 shadow-none">
        <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-24 size-64 rounded-full bg-accent/25" />
        <CardHeader className="relative">
          <div className="flex items-start gap-4">
            <Avatar className="size-12 shrink-0 rounded-2xl border border-border sm:size-14">
              <AvatarImage src={p.avatarUrl} alt={`${p.firstName} ${p.lastName}`} />
              <AvatarFallback className="rounded-2xl bg-accent text-accent-foreground">{getInitials(p.firstName, p.lastName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5" />Your workspace</p>
              <CardTitle className="break-words text-xl sm:text-2xl">Welcome back, {firstName}!</CardTitle>
              <CardDescription className="mt-2 break-words">{p.church?.name} · {p.branch?.name ?? "Your permitted branches"}</CardDescription>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {roles.map((role) => <Badge key={role} variant={role === "super_admin" ? "destructive" : "secondary"}>{resolveRoleLabel(role, labels)}</Badge>)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <details className="border-t pt-4">
            <summary className="cursor-pointer rounded-md text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">Account and access details</summary>
            <p className="mt-3 text-sm font-semibold break-words">{p.firstName} {p.lastName}</p>
            <div className="grid gap-4 sm:grid-cols-2"><InfoRow icon={<Mail className="size-4" />} label="Email" value={p.email}/><InfoRow icon={<ShieldCheck className="size-4" />} label="Access" value={p.isAdminHq ? "HQ · permitted branches" : "Your branch"}/></div>
            <Link className="text-sm underline" href="/profile">Open profile</Link>
          </details>
        </CardContent>
      </Card>

      <section aria-labelledby="common-tasks-heading">
        <div className="mb-3 flex items-center justify-between"><h2 id="common-tasks-heading" className="text-base font-semibold">Common tasks</h2><span className="text-xs text-muted-foreground">Your shortcuts</span></div>
        <nav aria-label="Common tasks" className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3">
          {[...COMMON_TASKS.filter((task) => canAny(task.permission)), { href: "/profile", label: "My profile", icon: UserRound }].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="group flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-4 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" /></span>
            <span className="min-w-0 flex-1 break-words">{label}</span><ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
          </Link>)}
        </nav>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="gap-4 rounded-2xl shadow-none">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Recent Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.isError ? <ErrorState title="Unable to load account activity" /> : auditLogs.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 rounded bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : auditLogs.data?.data.length ? (
              <ul className="divide-y">
                {auditLogs.data.data.map((item) => (
                  <li key={item.id} className="relative border-s-2 border-primary/15 py-3 ps-4">
                    <p className="text-sm font-medium break-words">{auditEntryLabel(item)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col gap-4 rounded-2xl shadow-none">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Recent Notifications
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setDrawerOpen(true)}
              >
                View more
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {notifications.isError ? <ErrorState title="Unable to load notifications" /> : notifications.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 rounded bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : recentNotifications.length ? (
              <ul className="divide-y">
                {recentNotifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className="group w-full rounded-lg py-3 text-start focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <div className="flex items-start gap-2">
                        {!n.readAt && (
                          <span
                            className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                            aria-hidden
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium break-words group-hover:underline ${
                                n.readAt ? "text-foreground/80" : "text-foreground"
                              }`}
                            >
                              {n.title}
                            </p>
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}
                            </Badge>
                          </div>
                          {n.body && (
                            <p className="text-xs text-muted-foreground line-clamp-1 break-words">
                              {n.body}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                You&apos;re all caught up!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
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
