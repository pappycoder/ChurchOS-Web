"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarDays,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { SearchInput } from "@/components/shared/search-input";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { TablePagination } from "@/components/shared/table-pagination";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  EVENT_TYPES,
  EVENT_TYPE_MAP,
  type EventItem,
  type ListEventsParams,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";

const SORT_OPTIONS: { value: ListEventsParams["sortBy"]; label: string }[] = [
  { value: "startDate", label: "Start Date" },
  { value: "title", label: "Title" },
  { value: "createdAt", label: "Date Added" },
];

export default function EventsListPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdate = can("events", "update");
  const canDelete = can("events", "delete");
  const canManage = canUpdate || canDelete;

  // Filters
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<ListEventsParams["sortBy"]>("startDate");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [deleteTarget, setDeleteTarget] = React.useState<EventItem | null>(null);

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
      search: search || undefined,
      type: typeFilter === "all" ? undefined : typeFilter,
      sortBy,
      sortOrder,
    }),
    [page, perPage, search, typeFilter, sortBy, sortOrder]
  );

  const { data, isLoading, error } = useEventsList(queryParams);
  const deleteMutation = useDeleteEvent();

  // Stats: unfiltered total, upcoming, past.
  const totalsQuery = useEventsList({ limit: 1 });
  const upcomingQuery = useEventsList({
    limit: 1,
    status: "upcoming",
  });
  const pastQuery = useEventsList({
    limit: 1,
    status: "past",
  });

  const events = React.useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;

  const toggleSortOrder = () => {
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  const buildExportRows = React.useCallback(
    (rows: EventItem[]) =>
      rows.map((e) => ({
        title: e.title,
        type: EVENT_TYPE_MAP[e.type] ?? e.type,
        startDate: format(new Date(e.startDate), "yyyy-MM-dd"),
        location: e.location || "",
        registrations: e.registrationCount,
        capacity: e.capacity ?? "",
      })),
    []
  );

  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<EventItem>((p) =>
      api.get(listUrl("/events", { ...queryParams, page: p, limit: 200 }))
    );
    return buildExportRows(rows);
  }, [queryParams, buildExportRows]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.eventId);
      toast.success(`${deleteTarget.title} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete event", {
        description: err instanceof Error ? err.message : "Please try again.",
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
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load events.</p>
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
        title="Events"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Events" }]}
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              columns={[
                { key: "title", label: "Title" },
                { key: "type", label: "Type" },
                { key: "startDate", label: "Start Date" },
                { key: "location", label: "Location" },
                { key: "registrations", label: "Registrations" },
                { key: "capacity", label: "Capacity" },
              ]}
              data={buildExportRows(events)}
              fetchAllRows={fetchAllExportRows}
              title="Events"
              filename="events-export"
              disabled={events.length === 0}
            />
            <Button onClick={() => router.push("/events/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Events"
          value={totalsQuery.data?.total ?? 0}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatsCard
          title="Upcoming"
          value={upcomingQuery.data?.total ?? 0}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatsCard
          title="Past"
          value={pastQuery.data?.total ?? 0}
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={searchInput}
              onChange={(v) => setSearchInput(v)}
              placeholder="Search events..."
              className="w-full sm:w-64"
            />
            {/* Type filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant={typeFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => {
                  setTypeFilter("all");
                  setPage(1);
                }}
              >
                All
              </Button>
              {EVENT_TYPES.map((t) => (
                <Button
                  key={t.value}
                  variant={typeFilter === t.value ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setTypeFilter(t.value);
                    setPage(1);
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as ListEventsParams["sortBy"]);
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={toggleSortOrder}
            >
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<CalendarDays className="h-12 w-12" />}
                title="No events yet"
                description={
                  search || typeFilter !== "all"
                    ? "Try adjusting your filters."
                    : "Create your first event to get started."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Registrations</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow
                      key={event.eventId}
                      className="cursor-pointer"
                      onClick={() => router.push(`/events/${event.eventId}`)}
                    >
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {EVENT_TYPE_MAP[event.type] ?? event.type}
                        </Badge>
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
                      {canManage && (
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/events/${event.eventId}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              {canUpdate && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/events/${event.eventId}/edit`)
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TablePagination
        page={page}
        perPage={perPage}
        total={total}
        itemName="events"
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
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
    </div>
  );
}
