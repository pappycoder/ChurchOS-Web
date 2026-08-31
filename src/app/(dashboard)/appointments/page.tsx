"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  CalendarClock,
  CalendarPlus,
  MoreHorizontal,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatsCard } from "@/components/shared/stats-card";
import { TableCard } from "@/components/shared/table-card";
import { ArchivedFilter, type ArchivedFilterValue } from "@/components/shared/archived-filter";
import { ArchiveConfirmDialog } from "@/components/shared/archive-confirm-dialog";
import {
  AppointmentFormDialog,
} from "@/components/appointments/appointment-form-dialog";
import {
  AppointmentDetailDialog,
} from "@/components/appointments/appointment-detail-dialog";
import {
  useAppointments,
  useArchiveAppointment,
  useRestoreAppointment,
  useDeleteAppointment,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TEXT,
  type Appointment,
} from "@/hooks/use-appointments";
import { usePermissions } from "@/hooks/use-permissions";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatWhen(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "MMM d, yyyy · h:mm a");
}

function AppointmentsContent() {
  const { can } = usePermissions();
  const canCreate = can("appointments", "create");
  const canUpdate = can("appointments", "update");
  const canDelete = can("appointments", "delete");

  const [archived, setArchived] = React.useState<ArchivedFilterValue>("all");
  const [status, setStatus] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Appointment | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailTarget, setDetailTarget] = React.useState<Appointment | null>(null);
  const [archiveDialog, setArchiveDialog] = React.useState<{
    kind: "archive" | "restore" | "purge";
    appointment: Appointment;
  } | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: list, isLoading } = useAppointments({
    page,
    limit: 15,
    archived: archived === "archived",
    status: status === "all" ? undefined : status,
    search: debouncedSearch || undefined,
  });

  const archiveMutation = useArchiveAppointment();
  const restoreMutation = useRestoreAppointment();
  const deleteMutation = useDeleteAppointment();

  const items = list?.data ?? [];
  const summary = list?.summary ?? { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setFormOpen(true);
  };

  const openDetail = (a: Appointment) => {
    setDetailTarget(a);
    setDetailOpen(true);
  };

  const activeDialogKind =
    archiveDialog?.kind === "purge"
      ? "purge"
      : archiveDialog?.kind === "restore"
        ? "restore"
        : "archive";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Appointments"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Communication" },
          { label: "Appointments" },
        ]}
        action={
          canCreate ? (
            <Button onClick={openCreate}>
              <CalendarPlus className="size-4" /> New Appointment
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Pending"
          value={summary.pending ?? 0}
          icon={<CalendarClock className="size-5" />}
          variant="warning"
        />
        <StatsCard
          title="Confirmed"
          value={summary.confirmed ?? 0}
          icon={<CalendarClock className="size-5" />}
          variant="primary"
        />
        <StatsCard
          title="Completed"
          value={summary.completed ?? 0}
          icon={<CalendarClock className="size-5" />}
          variant="success"
        />
        <StatsCard
          title="Cancelled"
          value={summary.cancelled ?? 0}
          icon={<CalendarClock className="size-5" />}
        />
      </div>

      <TableCard
        title="Appointments"
        description={`${list?.total ?? 0} total ${archived === "archived" ? "archived" : "active"} appointment${(list?.total ?? 0) === 1 ? "" : "s"}`}
        itemName="appointments"
        page={page}
        perPage={15}
        total={list?.total ?? 0}
        onPageChange={setPage}
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ArchivedFilter
              value={archived}
              onChange={(v) => {
                setArchived(v);
                setPage(1);
              }}
            />
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {APPOINTMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {APPOINTMENT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1">
              <Input
                placeholder="Search by title, location, or notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:max-w-xs"
              />
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <CalendarClock className="size-10 text-muted-foreground/50" />
            <p className="font-medium">
              {archived === "archived"
                ? "No archived appointments"
                : status !== "all"
                  ? `No ${APPOINTMENT_STATUS_LABELS[status as keyof typeof APPOINTMENT_STATUS_LABELS]?.toLowerCase() ?? "matching"} appointments`
                  : "No appointments yet"}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {canCreate && archived === "all"
                ? "Book an appointment with a church teammate to get started."
                : "Appointments you're part of will appear here."}
            </p>
            {canCreate && archived === "all" && (
              <Button variant="outline" size="sm" onClick={openCreate}>
                <CalendarPlus className="size-4" /> New Appointment
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Appointment</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">With</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Who</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scheduled</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                {(canUpdate || canDelete) && (
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(a)}
                      className="text-left"
                    >
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {a.location || "—"}
                      </p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                        {initials(a.pastorName || "") || "?"}
                      </span>
                      <span className="font-medium">{a.pastorName || "—"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                        {initials(
                          a.whoKind === "visitor" ? a.visitorName || "" : a.personName || ""
                        ) || "?"}
                      </span>
                      <span className="font-medium">
                        {a.whoKind === "visitor" ? a.visitorName : a.personName || "—"}
                      </span>
                      {a.whoKind === "visitor" && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                          Visitor
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatWhen(a.scheduledAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={
                        APPOINTMENT_STATUS_TEXT[a.status as keyof typeof APPOINTMENT_STATUS_TEXT] ??
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {APPOINTMENT_STATUS_LABELS[a.status as keyof typeof APPOINTMENT_STATUS_LABELS] ??
                        a.status}
                    </Badge>
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      {archived === "archived" ? (
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setArchiveDialog({ kind: "restore", appointment: a })
                              }
                            >
                              <ArchiveRestore className="size-4" /> Restore
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setArchiveDialog({ kind: "purge", appointment: a })
                              }
                            >
                              <Trash2 className="size-4" /> Delete Forever
                            </Button>
                          )}
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(a)}>
                              <Eye className="size-4" /> View Details
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => openEdit(a)}>
                                <Pencil className="size-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    setArchiveDialog({ kind: "archive", appointment: a })
                                  }
                                >
                                  <Archive className="size-4" /> Archive
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        appointment={editing}
      />

      <AppointmentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        appointment={detailTarget}
      />

      <ArchiveConfirmDialog
        open={!!archiveDialog}
        onOpenChange={(o) => {
          if (!o) setArchiveDialog(null);
        }}
        kind={activeDialogKind}
        entityLabel="appointment"
        targetName={archiveDialog?.appointment.title}
        targetId={archiveDialog?.appointment.id ?? ""}
        mutation={
          archiveDialog?.kind === "restore"
            ? restoreMutation
            : archiveDialog?.kind === "purge"
              ? deleteMutation
              : archiveMutation
        }
      />
    </div>
  );
}

export default function AppointmentsPage() {
  const { ready } = usePermissions();
  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  return <AppointmentsContent />;
}
