"use client";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";
import { BranchFilter } from "@/components/shared/branch-filter";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import { getToastErrorMessage, toast } from "@/lib/toast";
import {
  AlertTriangle,
  CalendarDays,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import {
  EventsHeader as PageHeader,
  eventsWorkspaceClass,
  EventsMoreFilters,
  EventTypeBadge,
} from "@/components/events/event-presentation";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";

import { TableCard } from "@/components/shared/table-card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useEventsList,
  useDeleteEvent,
  useArchiveEvent,
  useRestoreArchiveEvent,
  EVENT_TYPES,
  type EventItem,
  type ListEventsParams,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchivedFilter,
  type ArchivedFilterValue,
} from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";

const SORT_OPTIONS: { value: ListEventsParams["sortBy"]; label: string }[] = [
  { value: "startDate", label: "Start Date" },
  { value: "title", label: "Title" },
  { value: "createdAt", label: "Date Added" },
];

export default function EventsListPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can("events", "create");
  const canUpdate = can("events", "update");
  const canDelete = can("events", "delete");
  const canManage = canUpdate || canDelete;

  // Filters
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [archivedFilter, setArchivedFilter] =
    React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] =
    React.useState<ListEventsParams["sortBy"]>("startDate");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [branchId, setBranchId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [deleteTarget, setDeleteTarget] = React.useState<EventItem | null>(
    null,
  );
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    event: EventItem;
  } | null>(null);

  // Debounce server-side search.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: ListEventsParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      branchId: branchId || undefined,
      search: search || undefined,
      type: typeFilter === "all" ? undefined : typeFilter,
      archived: archivedView ? true : undefined,
      sortBy,
      sortOrder,
    }),
    [
      page,
      perPage,
      branchId,
      search,
      typeFilter,
      archivedView,
      sortBy,
      sortOrder,
    ],
  );

  const { data, isLoading, error } = useEventsList(queryParams);
  const deleteMutation = useDeleteEvent();
  const archiveMutation = useArchiveEvent();
  const restoreArchiveMutation = useRestoreArchiveEvent();

  const events = React.useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;

  const toggleSortOrder = () => {
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.eventId);
      toast.success(`${deleteTarget.title} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete event", {
        description: getToastErrorMessage(err, "Please try again."),
      });
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Events"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Events" },
          ]}
        />
        <ErrorState title="Failed to load events." />
      </div>
    );
  }

  return (
    <div className={`${eventsWorkspaceClass} space-y-4`}>
      <PageHeader
        count={isLoading ? undefined : total}
        title="Events"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events" },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button
                onClick={() => {
                  if (confirmDiscardChanges()) router.push("/events/new");
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        }
      />

      <TableCard
        title="All Events"
        itemName="events"
        page={page}
        perPage={perPage}
        total={total}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        toolbar={
          <div
            role="group"
            aria-label="Collection filters"
            className="flex flex-wrap items-center gap-3"
          >
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search events..."
              className="w-full sm:w-64"
            />
            <BranchFilter
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setPage(1);
              }}
            />
            <select
              aria-label="Event type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="all">All event types</option>
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <EventsMoreFilters
              count={
                Number(archivedFilter !== "all") +
                Number(sortBy !== "startDate") +
                Number(sortOrder !== "desc")
              }
            >
              <ArchivedFilter
                value={archivedFilter}
                onChange={(value) => {
                  setArchivedFilter(value);
                  setPage(1);
                }}
              />
              <select
                aria-label="Sort events"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as ListEventsParams["sortBy"]);
                  setPage(1);
                }}
                className="h-9 rounded-lg border bg-background px-2 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort: {option.label}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={toggleSortOrder}>
                {sortOrder === "asc" ? "Asc" : "Desc"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setArchivedFilter("all");
                  setTypeFilter("all");
                  setSortBy("startDate");
                  setSortOrder("desc");
                  setBranchId("");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </EventsMoreFilters>
          </div>
        }
      >
        {isLoading ? (
          <LoadingState variant="table" />
        ) : events.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<CalendarDays className="h-12 w-12" />}
              title={archivedView ? "No archived events" : "No events yet"}
              description={
                archivedView
                  ? "Archive an event to move it here."
                  : search || typeFilter !== "all"
                    ? "Try adjusting your filters."
                    : "Create your first event to get started."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto px-4">
            <Table exportable={false} tableId="events">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead exportKeys={["startDate"]}>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead exportKeys={["registrations", "capacity"]}>
                    Registrations
                  </TableHead>
                  {canManage && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.eventId}
                    className="cursor-pointer"
                    onClick={() => {
                      if (confirmDiscardChanges())
                        router.push(`/events/${event.eventId}`);
                    }}
                  >
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <EventTypeBadge type={event.type} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(event.startDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.location || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.capacity
                        ? `${event.registrationCount} / ${event.capacity}`
                        : event.registrationCount}
                    </TableCell>
                    {canManage && !archivedView && (
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirmDiscardChanges())
                                  router.push(`/events/${event.eventId}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirmDiscardChanges())
                                    router.push(
                                      `/events/${event.eventId}/edit`,
                                    );
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canUpdate && !event.archivedAt && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setArchiveTarget({
                                    kind: "archive",
                                    event,
                                  })
                                }
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
                      </TableCell>
                    )}
                    {canManage && archivedView && (
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setArchiveTarget({
                                  kind: "restore",
                                  event,
                                })
                              }
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restore
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setArchiveTarget({
                                  kind: "purge",
                                  event,
                                })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Forever
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TableCard>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Event</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.title}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="event"
        targetName={archiveTarget?.event.title}
        targetId={archiveTarget?.event.eventId ?? ""}
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
