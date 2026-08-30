"use client";

import { CalendarDays, Church, Mail, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useRoleLabelMap, resolveRoleLabel } from "@/hooks/use-roles";

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
    </div>
  );
}
