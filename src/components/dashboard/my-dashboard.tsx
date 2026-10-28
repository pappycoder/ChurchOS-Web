"use client";
import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import { ErrorState } from "@/components/shared/error-state";

import * as React from "react";
import {
  Bell,
  Calendar,
  ChevronRight,
  History,
  Mail,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
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
import { StatsCard } from "@/components/shared/stats-card";
import { useGivingSummary } from "@/hooks/use-giving";
import { useAnalyticsMembers } from "@/hooks/use-analytics";
import { useEventsList } from "@/hooks/use-events";
import { DonutChart, colorize } from "@/components/analytics/pie-chart";
import { formatNaira } from "@/hooks/use-analytics";

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
  const {canAny, can} = usePermissions();
  const labels = useRoleLabelMap();
  const auditLogs = useMyAuditLogs({ limit: 3 });
  const notifications = useNotificationsList({
    page: 1,
    limit: NOTIFICATIONS_LIST_LIMIT,
    read: "all",
  });
  const recentNotifications = (notifications.data?.data ?? []).slice(0, 3);
  const markAsRead = useMarkAsRead();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Notification | null>(null);

  const openNotification = (n: Notification) => {
    if (!n.readAt) markAsRead.mutate(n.id);
    setSelected(n);
  };

  const canViewGiving = canAny("giving:read") || can("giving", "read");
  const canViewMembersAnalytics = can("analytics:members", "read");
  const canViewEvents = canAny("events:read");

  const givingSummary = useGivingSummary();
  const membersAnalytics = useAnalyticsMembers();
  const eventsList = useEventsList({ limit: 100 } as any);

  const upcomingEventsCount = React.useMemo(() => {
    if (!eventsList.data?.data) return 0;
    const now = Date.now();
    return eventsList.data.data.filter((e: any) => {
      const start = e.startDate ? new Date(e.startDate).getTime() : now;
      return start >= now;
    }).length;
  }, [eventsList.data]);

  const unreadCount = notifications.data?.unreadCount ?? 0;

  if (profile.error) return <ErrorState title="Unable to load your dashboard" />;
  if (profile.isLoading || !profile.data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-lg border bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const p = profile.data;
  const roles = p.role?.length ? p.role : ["No role assigned"];
  const firstName = p.firstName || "there";

  return (
    <>
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome back, {firstName}!
          </CardTitle>
          <CardDescription>
            {p.church?.name} · {p.branch?.name ?? "Your permitted branches"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={p.avatarUrl} alt={`${p.firstName} ${p.lastName}`} />
              <AvatarFallback className="text-lg">
                {getInitials(p.firstName, p.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold">
                {p.firstName} {p.lastName}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roles.map((role) => (
                  <Badge key={role} variant={role === "super_admin" ? "destructive" : "secondary"}>
                    {resolveRoleLabel(role, labels)}
                  </Badge>
                ))}
                <Badge variant="outline">{p.isAdminHq ? "HQ Access" : "Branch Scoped"}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{p.email}</span>
                <Link className="underline" href="/profile">View profile</Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canViewGiving && (
          <StatsCard
            title="Giving this month"
            value={givingSummary.data?.monthTotal != null ? formatNaira(givingSummary.data.monthTotal) : (givingSummary.isLoading ? "..." : "—")}
            icon={<Wallet className="h-4 w-4" />}
            variant="primary"
          />
        )}
        {canViewMembersAnalytics && (
          <StatsCard
            title="Total members"
            value={membersAnalytics.data?.total != null ? membersAnalytics.data.total.toLocaleString() : (membersAnalytics.isLoading ? "..." : "—")}
            icon={<Users className="h-4 w-4" />}
          />
        )}
        {canViewEvents && (
          <StatsCard
            title="Upcoming events"
            value={eventsList.isLoading ? "..." : upcomingEventsCount.toLocaleString()}
            icon={<Calendar className="h-4 w-4" />}
          />
        )}
        <StatsCard
          title="Unread notifications"
          value={notifications.isLoading ? "..." : unreadCount.toLocaleString()}
          icon={<Bell className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {canViewMembersAnalytics && membersAnalytics.data && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Member composition</CardTitle>
              <CardDescription>By status</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={colorize(
                  Object.entries(membersAnalytics.data.byStatus ?? {}).map(([key, value]) => ({
                    name: key.replace(/_/g, " "),
                    value: Number(value),
                  }))
                )}
                loading={membersAnalytics.isLoading}
                unit="members"
                height={200}
              />
            </CardContent>
          </Card>
        )}
        {canViewGiving && givingSummary.data && (
          <Card className={canViewMembersAnalytics && membersAnalytics.data ? "lg:col-span-2" : "lg:col-span-3"}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Giving overview</CardTitle>
                  <CardDescription>Recent giving activity</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/giving">View giving</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">This month</p>
                  <p className="text-lg font-semibold">{givingSummary.data.monthTotal != null ? formatNaira(givingSummary.data.monthTotal) : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                  <p className="text-base font-medium">{givingSummary.data.allTimeTotal != null ? formatNaira(givingSummary.data.allTimeTotal) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-lg font-semibold">{givingSummary.data.count?.toLocaleString() ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <nav aria-label="Common tasks" className="flex flex-wrap gap-2 rounded-lg border p-3">
        {[["members:all:read","/members","Find a member"],["attendance:checkin:read","/attendance/check-in","Check in"],["visitors:list:read","/visitors","Follow up"],["events:list:read","/events/list","Events"],["forms:read","/forms","Forms"]].filter(([permission])=>canAny(permission)).map(([,href,label])=><Button key={href} asChild variant="outline" size="sm"><Link href={href}>{label}</Link></Button>)}
      </nav>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Recent Notifications
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setDrawerOpen(true)}
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {notifications.isError ? <ErrorState title="Unable to load notifications" /> : notifications.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
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
                      className="w-full text-left py-2.5 group"
                    >
                      <div className="flex items-start gap-2">
                        {!n.readAt && (
                          <span
                            className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                            aria-hidden
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.isError ? <ErrorState title="Unable to load account activity" /> : auditLogs.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-5 rounded bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : auditLogs.data?.data.length ? (
              <ul className="divide-y">
                {auditLogs.data.data.map((item) => (
                  <li key={item.id} className="py-2.5">
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
