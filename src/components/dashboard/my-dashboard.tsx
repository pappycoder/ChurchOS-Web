"use client";

import * as React from "react";
import { Bell, CalendarDays, ChevronRight, Church, History, Mail, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useRoleLabelMap, resolveRoleLabel } from "@/hooks/use-roles";
import { useMyAuditLogs, auditEntryLabel } from "@/hooks/use-audit-logs";
import {
  useNotificationsList,
  useMarkAsRead,
  formatRelativeTime,
  NOTIFICATION_TYPE_LABELS,
  type Notification,
} from "@/hooks/use-notifications";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { NotificationDetailDialog } from "@/components/notifications/notification-detail-dialog";

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
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
  const labels = useRoleLabelMap();
  const auditLogs = useMyAuditLogs({ limit: 8 });
  const notifications = useNotificationsList({ read: "all", limit: 8 });
  const markAsRead = useMarkAsRead();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Notification | null>(null);

  const openNotification = (n: Notification) => {
    if (!n.readAt) markAsRead.mutate(n.id);
    setSelected(n);
  };

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
  const roles = p.role?.length ? p.role : ["member"];
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
            This is your personal dashboard. Here’s a snapshot of your account and church
            information.
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
            <div>
              <p className="text-lg font-semibold">
                {p.firstName} {p.lastName}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roles.map((role) => (
                  <Badge key={role} variant={role === "super_admin" ? "destructive" : "secondary"}>
                    {resolveRoleLabel(role, labels)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={p.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={p.phone} />
            <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Member since" value={formatDate(p.createdAt)} />
            <InfoRow icon={<Church className="h-4 w-4" />} label="Church" value={p.church?.name} />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Branch"
              value={
                p.branch ? (
                  <span className="inline-flex items-center gap-1.5">
                    {p.branch.name}
                    {p.branch.isHeadquarters && (
                      <Badge variant="outline" className="text-[10px]">
                        HQ
                      </Badge>
                    )}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            {p.isAdminHq ? (
              <InfoRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Access"
                value={<Badge variant="outline">Admin HQ</Badge>}
              />
            ) : (
              <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Access" value="Branch-scoped" />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Recent Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
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

        <Card className="flex flex-col">
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
                View more
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {notifications.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 rounded bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : notifications.data?.data.length ? (
              <ul className="divide-y">
                {notifications.data.data.map((n) => (
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
