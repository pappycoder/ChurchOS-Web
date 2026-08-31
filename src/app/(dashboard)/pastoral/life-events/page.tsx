"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarHeart,
  MoreHorizontal,
  Plus,
  SortAsc,
  SortDesc,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useLifeEvents,
  useDeleteLifeEvent,
  useArchiveLifeEvent,
  useRestoreLifeEvent,
  type LifeEvent,
  type LifeEventType,
  LIFE_EVENT_TYPES,
  LIFE_EVENT_TYPE_LABELS,
  LIFE_EVENT_TYPE_TEXT,
} from "@/hooks/use-pastoral";
import { PageHeader } from "@/components/shared/page-header";
import { TableCard } from "@/components/shared/table-card";
import { ArchivedFilter, type ArchivedFilterValue } from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { LifeEventFormDialog } from "@/components/pastoral/life-event-form-dialog";
import { ConfirmDeleteDialog } from "@/components/pastoral/confirm-delete-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_OPTIONS: Array<{ value: LifeEventType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  ...LIFE_EVENT_TYPES.map((type) => ({ value: type, label: LIFE_EVENT_TYPE_LABELS[type] })),
];

const SORT_OPTIONS = [
  { value: "date", label: "Event Date" },
  { value: "created_at", label: "Date Added" },
];

export default function LifeEventsPage() {
  const { can } = usePermissions();
  const canCreate = can("pastoral", "create");
  const canUpdate = can("pastoral", "update");
  const canDelete = can("pastoral", "delete");

  const [typeFilter, setTypeFilter] = React.useState<LifeEventType | "all">("all");
  const [upcomingOnly, setUpcomingOnly] = React.useState(false);
  const [archivedFilter, setArchivedFilter] = React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [sortBy, setSortBy] = React.useState<"date" | "created_at">("date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const queryParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      type: typeFilter === "all" ? undefined : typeFilter,
      upcoming: upcomingOnly ? ("true" as const) : undefined,
      sortBy,
      sortOrder,
      archived: archivedView ? true : undefined,
    }),
    [page, perPage, typeFilter, upcomingOnly, sortBy, sortOrder, archivedView]
  );

  const { data, isLoading, error } = useLifeEvents(queryParams);
  const deleteMutation = useDeleteLifeEvent();
  const archiveMutation = useArchiveLifeEvent();
  const restoreMutation = useRestoreLifeEvent();

  const events = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<LifeEvent | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    event: LifeEvent;
  } | null>(null);

  const handleToggleUpcoming = (checked: boolean) => {
    setUpcomingOnly(checked);
    setPage(1);
    if (checked) {
      setSortBy("date");
      setSortOrder("asc");
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Life Events"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Pastoral Care" },
            { label: "Life Events" },
          ]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load life events.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Life Events"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Pastoral Care" },
          { label: "Life Events" },
        ]}
        action={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Life Event
            </Button>
          )
        }
      />

      <TableCard
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <ArchivedFilter value={archivedFilter} onChange={setArchivedFilter} />
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v as LifeEventType | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  checked={upcomingOnly}
                  onCheckedChange={handleToggleUpcoming}
                  aria-label="Upcoming only"
                />
                <span className="text-sm">Upcoming only</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v as "date" | "created_at");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36">
                  <ArrowUpDown className="h-4 w-4 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        }
        itemName="events"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<CalendarHeart className="h-12 w-12" />}
              title={archivedView ? "No archived life events" : "No life events found"}
              description={
                archivedView
                  ? "Archive a life event to move it here."
                  : typeFilter !== "all" || upcomingOnly
                    ? "Try adjusting your filters."
                    : canCreate
                      ? "Record a birthday, wedding, or baptism to get started."
                      : "No life events have been recorded yet."
              }
            />
          </div>
        ) : (
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {(canUpdate || canDelete) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <p className="font-medium">
                          {event.memberFirstName} {event.memberLastName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            LIFE_EVENT_TYPE_TEXT[event.type]
                          )}
                        >
                          {LIFE_EVENT_TYPE_LABELS[event.type]}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={event.notified ? "default" : "outline"}
                          className={event.notified ? "" : "text-amber-600"}
                        >
                          {event.notified ? "Notified" : "Pending"}
                        </Badge>
                      </TableCell>
                      {(canUpdate || canDelete) && (
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {archivedView ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {canUpdate && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setArchiveTarget({ kind: "restore", event })}
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                  Restore
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setArchiveTarget({ kind: "purge", event })}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  Delete Forever
                                </Button>
                              )}
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canDelete && (
                                  <DropdownMenuItem
                                    onClick={() => setArchiveTarget({ kind: "archive", event })}
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteTarget(event)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
      </TableCard>

      <LifeEventFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Life Event"
        description={
          deleteTarget
            ? `This will permanently delete the ${LIFE_EVENT_TYPE_LABELS[deleteTarget.type].toLowerCase()} event for ${deleteTarget.memberFirstName} ${deleteTarget.memberLastName}. This action cannot be undone.`
            : ""
        }
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
              toast.success("Life event deleted");
            },
            onError: (error) => {
              toast.error("Failed to delete life event", {
                description: error?.message || "Please try again.",
              });
            },
          });
        }}
      />
      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="life event"
        targetName={
          archiveTarget ? LIFE_EVENT_TYPE_LABELS[archiveTarget.event.type] ?? null : null
        }
        targetId={archiveTarget?.event.id ?? ""}
        mutation={
          archiveTarget?.kind === "archive"
            ? archiveMutation
            : archiveTarget?.kind === "restore"
              ? restoreMutation
              : deleteMutation
        }
      />
    </div>
  );
}
