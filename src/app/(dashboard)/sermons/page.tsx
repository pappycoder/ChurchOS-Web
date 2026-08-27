"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  Clock,
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
  useSermonsList,
  useDeleteSermon,
  type Sermon,
  type ListSermonsParams,
} from "@/hooks/use-sermons";
import { usePermissions } from "@/hooks/use-permissions";

const SORT_OPTIONS: { value: ListSermonsParams["sortBy"]; label: string }[] = [
  { value: "sermonDate", label: "Date" },
  { value: "title", label: "Title" },
  { value: "createdAt", label: "Date Added" },
];

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function SermonsListPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can("sermons", "create");
  const canUpdate = can("sermons", "update");
  const canDelete = can("sermons", "delete");
  const canManage = canUpdate || canDelete;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<ListSermonsParams["sortBy"]>("sermonDate");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [deleteTarget, setDeleteTarget] = React.useState<Sermon | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: ListSermonsParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      search: search || undefined,
      sortBy,
      sortOrder,
    }),
    [page, perPage, search, sortBy, sortOrder]
  );

  const { data, isLoading, error } = useSermonsList(queryParams);
  const deleteMutation = useDeleteSermon();

  const totalsQuery = useSermonsList({ limit: 1 });
  const seriesQuery = useSermonsList({ limit: 1, series: "__any__" });

  const sermons = React.useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;

  const toggleSortOrder = () => {
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  const buildExportRows = React.useCallback(
    (rows: Sermon[]) =>
      rows.map((s) => ({
        title: s.title,
        speaker: s.speaker || "",
        date: format(new Date(s.sermonDate), "yyyy-MM-dd"),
        series: s.seriesName || "",
        scripture: s.scriptureReference || "",
        duration: formatDuration(s.durationSeconds),
        tags: s.tags.join(", "),
      })),
    []
  );

  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<Sermon>((p) =>
      api.get(listUrl("/sermons", { ...queryParams, page: p, limit: 200 }))
    );
    return buildExportRows(rows);
  }, [queryParams, buildExportRows]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.sermonId);
      toast.success(`${deleteTarget.title} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete sermon", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Sermons"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Sermons" }]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load sermons.</p>
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
        title="Sermons"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Sermons" }]}
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              columns={[
                { key: "title", label: "Title" },
                { key: "speaker", label: "Speaker" },
                { key: "date", label: "Date" },
                { key: "series", label: "Series" },
                { key: "scripture", label: "Scripture" },
                { key: "duration", label: "Duration" },
                { key: "tags", label: "Tags" },
              ]}
              data={buildExportRows(sermons)}
              fetchAllRows={fetchAllExportRows}
              title="Sermons"
              filename="sermons-export"
              disabled={sermons.length === 0}
            />
            {canCreate && (
              <Button onClick={() => router.push("/sermons/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sermon
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Total Sermons"
          value={totalsQuery.data?.total ?? 0}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatsCard
          title="Series"
          value={seriesQuery.data?.total ?? 0}
          icon={<BookOpen className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={searchInput}
            onChange={(v) => setSearchInput(v)}
            placeholder="Search sermons..."
            className="w-full sm:w-64"
          />
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as ListSermonsParams["sortBy"]);
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
          ) : sermons.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<BookOpen className="h-12 w-12" />}
                title="No sermons yet"
                description={
                  search
                    ? "Try adjusting your search."
                    : "Add your first sermon to get started."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Speaker</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Series</TableHead>
                    <TableHead>Duration</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sermons.map((sermon) => (
                    <TableRow
                      key={sermon.sermonId}
                      className="cursor-pointer"
                      onClick={() => router.push(`/sermons/${sermon.sermonId}`)}
                    >
                      <TableCell className="font-medium">{sermon.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {sermon.speaker || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sermon.sermonDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {sermon.seriesName ? (
                          <Badge variant="secondary">{sermon.seriesName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sermon.durationSeconds ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(sermon.durationSeconds)}
                          </span>
                        ) : (
                          "-"
                        )}
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
                                  router.push(`/sermons/${sermon.sermonId}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              {canUpdate && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/sermons/${sermon.sermonId}/edit`)
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
                                    onClick={() => setDeleteTarget(sermon)}
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
        itemName="sermons"
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Sermon</DialogTitle>
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
