"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Baby,
  HandCoins,
  Users,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  useService,
  useServiceAttendance,
  useDeleteService,
  useArchiveService,
  useRestoreArchiveService,
  SERVICE_CATEGORIES,
  type ChurchService,
} from "@/hooks/use-attendance";
import type { GivingTransaction } from "@/hooks/use-giving";
import { usePermissions } from "@/hooks/use-permissions";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";

const givingConfig = {
  amount: { label: "Amount", color: "var(--chart-1)" },
} satisfies ChartConfig;

function DataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "-"}</span>
    </div>
  );
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = React.use(params);
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdate = can("attendance", "update");
  const canDelete = can("attendance", "delete");

  const serviceQuery = useService(serviceId);
  const attendanceQuery = useServiceAttendance(serviceId);
  const deleteMutation = useDeleteService();
  const archiveMutation = useArchiveService();
  const restoreArchiveMutation = useRestoreArchiveService();

  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    service: ChurchService;
  } | null>(null);

  // Giving tagged to this service — paged fetch of all successful gifts.
  const [giving, setGiving] = React.useState<{
    loading: boolean;
    total: number;
    byCategory: { name: string; amount: number }[];
  }>({ loading: true, total: 0, byCategory: [] });

  React.useEffect(() => {
    let cancelled = false;
    if (!serviceId) return;

    fetchAllPages<GivingTransaction>((p) =>
      api.get(
        listUrl("/giving/transactions", {
          serviceId,
          status: "success",
          page: p,
          limit: 200,
        })
      )
    )
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<string, number>();
        let total = 0;
        for (const t of rows) {
          total += t.amount;
          map.set(t.categoryName, (map.get(t.categoryName) ?? 0) + t.amount);
        }
        setGiving({
          loading: false,
          total,
          byCategory: Array.from(map.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount),
        });
      })
      .catch(() => !cancelled && setGiving({ loading: false, total: 0, byCategory: [] }));

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const attendance = attendanceQuery.data?.data ?? [];
  const totalCheckIns = attendanceQuery.data?.total ?? 0;

  const adultCount = attendance.filter((r) => (r.category ?? "adult") === "adult").length;
  const childrenCount = attendance.filter((r) => r.category === "children").length;
  const memberCount = attendance.filter((r) => !!r.memberId).length;
  const visitorCount = attendance.length - memberCount;

  const isLoading = serviceQuery.isLoading || attendanceQuery.isLoading;
  const service = serviceQuery.data;
  const latest = attendance[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div>
        <Button variant="ghost" onClick={() => router.push("/attendance/services")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Button>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Service not found.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={() => router.push("/attendance/services")}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Services
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 flex-wrap">
            <h2 className="text-xl font-semibold">{service.name}</h2>
            <Badge variant="outline">
              {SERVICE_CATEGORIES.find((c) => c.value === (service.category ?? "adult"))
                ?.label ?? "Adult"}
            </Badge>
            {!service.isActive && <Badge variant="secondary">Inactive</Badge>}
            {service.archivedAt && (
              <Badge variant="destructive">
                <Archive className="mr-1 h-3 w-3" />
                Archived
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-4 flex-wrap">
            <span>
              {service.dayOfWeek !== undefined
                ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
                    service.dayOfWeek
                  ]
                : "Any day"}
              {service.startTime && service.endTime
                ? ` · ${service.startTime.slice(11, 16)}–${service.endTime.slice(11, 16)}`
                : ""}
            </span>
            {latest && (
              <span>
                Last check-in {format(new Date(latest.checkInAt), "MMM d, yyyy · HH:mm")}
              </span>
            )}
          </p>
          {(canUpdate || canDelete) && !service.archivedAt && (
            <div className="flex items-center gap-2 mt-4">
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveTarget({ kind: "archive", service })}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}
            </div>
          )}
          {service.archivedAt && (canUpdate || canDelete) && (
            <div className="flex items-center gap-2 mt-4">
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveTarget({ kind: "restore", service })}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setArchiveTarget({ kind: "purge", service })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Forever
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">{totalCheckIns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Check-Ins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {memberCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Member Check-Ins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold flex items-center gap-2">
              <Baby className="h-5 w-5 text-muted-foreground" />
              {childrenCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Children Check-Ins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-muted-foreground" />
              {giving.loading ? "..." : giving.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Giving (₦)</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Attendance Breakdown</CardTitle>
            <CardDescription>Who checked in for this service.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <DataRow label="Adults" value={adultCount.toLocaleString()} />
            <DataRow label="Children" value={childrenCount.toLocaleString()} />
            <DataRow label="Members" value={memberCount.toLocaleString()} />
            <DataRow label="Visitors / Walk-ins" value={visitorCount.toLocaleString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HandCoins className="h-4 w-4" />
              Giving Breakdown
            </CardTitle>
            <CardDescription>
              Successful gifts recorded against this service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {giving.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : giving.byCategory.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No gifts recorded against this service yet.
              </div>
            ) : (
              <ChartContainer config={givingConfig} className="h-64 w-full">
                <BarChart data={giving.byCategory} layout="vertical" margin={{ left: 32 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="amount"
                    fill="var(--color-amount)"
                    radius={[0, 3, 3, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="service"
        targetName={archiveTarget?.service.name}
        targetId={archiveTarget?.service.serviceId ?? ""}
        mutation={
          archiveTarget?.kind === "restore"
            ? restoreArchiveMutation
            : archiveTarget?.kind === "archive"
              ? archiveMutation
              : deleteMutation
        }
      />
    </div>
  );
}
