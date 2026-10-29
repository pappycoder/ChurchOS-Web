"use client";
import { DetailManagementMenu } from "@/components/shared/detail-management-menu";
import {
  AttendanceWorkspace,
  AttendanceCategoryBadge,
  AttendanceStatusBadge,
  AttendanceArchivedBadge,
  attendanceWorkspaceClass,
} from "@/components/attendance/attendance-presentation";
import { UrlTabs } from "@/components/shared/url-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { GeneralAttendancePanel } from "@/components/attendance/general-attendance-panel";

import { ErrorState } from "@/components/shared/error-state";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  HandCoins,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  type ChurchService,
} from "@/hooks/use-attendance";
import { useGivingTransactionsAll } from "@/hooks/use-giving";
import { usePermissions } from "@/hooks/use-permissions";
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
  const managementRef = React.useRef<HTMLButtonElement>(null);
  const { can } = usePermissions();
  const canUpdate = can("attendance:services", "update");
  const canDelete = can("attendance:services", "delete");
  const canReadGiving = can("giving:records", "read");

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
  const givingQuery = useGivingTransactionsAll({ serviceId });
  const [currencyFilter, setCurrencyFilter] = React.useState("");
  const currencies = [
    ...new Set((givingQuery.data ?? []).map((row) => row.currency)),
  ].sort();
  const currency = currencies.includes(currencyFilter)
    ? currencyFilter
    : (currencies[0] ?? "NGN");
  const givingRows = React.useMemo(
    () => (givingQuery.data ?? []).filter((row) => row.currency === currency),
    [givingQuery.data, currency],
  );
  const givingTotal = React.useMemo(
    () => givingRows.reduce((sum, t) => sum + t.amount, 0),
    [givingRows],
  );
  const givingByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of givingRows) {
      map.set(t.categoryName, (map.get(t.categoryName) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [givingRows]);

  const attendance = attendanceQuery.data?.data ?? [];
  const totalCheckIns = attendanceQuery.data?.total ?? 0;

  const adultCount = attendance.filter(
    (r) => (r.category ?? "adult") === "adult",
  ).length;
  const childrenCount = attendance.filter(
    (r) => r.category === "children",
  ).length;
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
        <Button
          variant="ghost"
          onClick={() => {
            if (confirmDiscardChanges()) router.push("/attendance/services");
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Button>
        <ErrorState />
      </div>
    );
  }

  return (
    <AttendanceWorkspace>
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={() => {
          if (confirmDiscardChanges()) router.push("/attendance/services");
        }}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Services
      </Button>

      {/* Header */}
      <Card className="py-4">
        <CardContent className="flex flex-wrap items-start justify-between gap-4 px-5">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex size-10 items-center justify-center rounded-xl border bg-muted/50 text-muted-foreground">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <h1 className="text-xl font-semibold tracking-tight">
                {service.name}
              </h1>
              <AttendanceCategoryBadge category={service.category ?? "adult"} />
              {!service.isActive && <AttendanceStatusBadge status="inactive" />}
              {service.archivedAt && <AttendanceArchivedBadge />}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-4 flex-wrap">
              <span>
                {service.dayOfWeek !== undefined
                  ? [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ][service.dayOfWeek]
                  : "Any day"}
                {service.startTime && service.endTime
                  ? ` · ${service.startTime}–${service.endTime}`
                  : ""}
              </span>
              {latest && (
                <span>
                  Last check-in{" "}
                  {format(new Date(latest.checkInAt), "MMM d, yyyy · HH:mm")}
                </span>
              )}
            </p>
          </div>
          <DetailManagementMenu
            label="Service management"
            triggerRef={managementRef}
            actions={[
              ...(!service.archivedAt && canUpdate
                ? [
                    {
                      label: "Archive",
                      icon: Archive,
                      onSelect: () =>
                        setArchiveTarget({ kind: "archive", service }),
                    },
                  ]
                : []),
              ...(service.archivedAt && canUpdate
                ? [
                    {
                      label: "Restore",
                      icon: RotateCcw,
                      onSelect: () =>
                        setArchiveTarget({ kind: "restore", service }),
                    },
                  ]
                : []),
              ...(service.archivedAt && canDelete
                ? [
                    {
                      label: "Delete Forever",
                      icon: Trash2,
                      destructive: true,
                      onSelect: () =>
                        setArchiveTarget({ kind: "purge", service }),
                    },
                  ]
                : []),
            ]}
          />
        </CardContent>
      </Card>

      <UrlTabs
        defaultValue="attendance"
        values={["attendance", ...(canReadGiving ? ["giving"] : [])]}
      >
        <TabsList aria-label="Service workspace">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          {canReadGiving && <TabsTrigger value="giving">Giving</TabsTrigger>}
        </TabsList>
        <TabsContent
          value="attendance"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <GeneralAttendancePanel
            presentationClassName={attendanceWorkspaceClass}
            service={service}
          />

          {attendanceQuery.isError ? (
            <ErrorState title="Unable to load named service attendance" />
          ) : (
            <>
              <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border bg-card px-4 py-3 text-xs">
                {[
                  ["Total Check-Ins", totalCheckIns],
                  ["Member Check-Ins", memberCount],
                  ["Children Check-Ins", childrenCount],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center gap-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">
                      {Number(value).toLocaleString()}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Breakdowns */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Attendance Breakdown
                    </CardTitle>
                    <CardDescription>
                      Who checked in for this service.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y">
                    <DataRow
                      label="Adults"
                      value={adultCount.toLocaleString()}
                    />
                    <DataRow
                      label="Children"
                      value={childrenCount.toLocaleString()}
                    />
                    <DataRow
                      label="Members"
                      value={memberCount.toLocaleString()}
                    />
                    <DataRow
                      label="Visitors / Walk-ins"
                      value={visitorCount.toLocaleString()}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        {canReadGiving && (
          <TabsContent
            value="giving"
            forceMount
            className="space-y-4 data-[state=inactive]:hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Service giving</h2>
                <p className="text-sm text-muted-foreground">
                  Successful gifts tagged to this service.
                </p>
              </div>
              <Select value={currency} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-40" aria-label="Giving currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(currencies.length ? currencies : ["NGN"]).map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {givingQuery.isError ? (
              <ErrorState title="Unable to load service giving" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">
                {currency}{" "}
                {givingQuery.isLoading ? "..." : givingTotal.toLocaleString()}
              </p>
            )}
            {canReadGiving && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <HandCoins className="h-4 w-4" />
                    Giving Breakdown
                  </CardTitle>
                  <CardDescription>
                    Successful gifts recorded against this service, in the
                    selected currency.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {givingQuery.isError ? (
                    <ErrorState title="Unable to load giving breakdown" />
                  ) : givingQuery.isLoading ? (
                    <Skeleton className="h-64 w-full aspect-auto" />
                  ) : givingByCategory.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      No gifts recorded against this service yet.
                    </div>
                  ) : (
                    <ChartContainer
                      config={givingConfig}
                      className="h-64 w-full aspect-auto"
                    >
                      <BarChart
                        data={givingByCategory}
                        layout="vertical"
                        margin={{ left: 32 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
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
            )}{" "}
          </TabsContent>
        )}
      </UrlTabs>

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        returnFocusRef={managementRef}
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
    </AttendanceWorkspace>
  );
}
