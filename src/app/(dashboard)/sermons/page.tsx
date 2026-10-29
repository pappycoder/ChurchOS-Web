"use client";
import { PermissionLink as Link } from "@/components/shared/permission-link";
import { useUrlQueryState } from "@/hooks/use-url-query-state";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { getToastErrorMessage, toast } from "@/lib/toast";
import {
  AlertTriangle,
  BookOpen,
  Clock,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import {
  SermonHeader as PageHeader,
  sermonWorkspaceClass,
  SermonMoreFilters,
  SermonMediaBadges,
  SermonRowMenu,
} from "@/components/sermons/sermon-presentation";
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
import { Badge } from "@/components/ui/badge";
import {
  useSermonsList,
  useDeleteSermon,
  useArchiveSermon,
  useRestoreArchiveSermon,
  type Sermon,
  type ListSermonsParams,
} from "@/hooks/use-sermons";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchivedFilter,
  type ArchivedFilterValue,
} from "@/components/shared/archived-filter";
import { BranchFilter } from "@/components/shared/branch-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";

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

function SermonsListContent() {
  const router = useRouter();
  const { can, canAny } = usePermissions();
  const canCreate = canAny("sermons:new:create");
  const canUpdate = can("sermons", "update");
  const canDelete = can("sermons", "delete");
  const canManage = canUpdate || canDelete;
  const managementRef = React.useRef<HTMLButtonElement | null>(null);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] =
    React.useState<ListSermonsParams["sortBy"]>("sermonDate");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [branchId, setBranchId] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<Sermon | null>(null);
  const [archivedFilter, setArchivedFilter] =
    React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    sermon: Sermon;
  } | null>(null);

  const [speaker, setSpeaker] = useUrlQueryState("speaker");
  const [series, setSeries] = useUrlQueryState("series");

  const clearDeepLinkFilters = () => {
    setSpeaker("");
    setSeries("");
    setPage(1);
  };

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
      speaker: speaker || undefined,
      series: series || undefined,
      archived: archivedView ? true : undefined,
      branchId: branchId || undefined,
      sortBy,
      sortOrder,
    }),
    [
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
      speaker,
      series,
      archivedView,
      branchId,
    ],
  );

  const { data, isLoading, error } = useSermonsList(queryParams);
  const deleteMutation = useDeleteSermon();
  const archiveMutation = useArchiveSermon();
  const restoreArchiveMutation = useRestoreArchiveSermon();

  const sermons = React.useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;

  const toggleSortOrder = () => {
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.sermonId);
      toast.success(`${deleteTarget.title} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete sermon", {
        description: getToastErrorMessage(err, "Please try again."),
      });
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Sermons"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Sermons" },
          ]}
        />
        <ErrorState title="Failed to load sermons." />
      </div>
    );
  }

  return (
    <div className={`${sermonWorkspaceClass} space-y-4`}>
      <PageHeader
        count={isLoading ? undefined : total}
        title="Sermons"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons" },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button
                onClick={() => {
                  if (confirmDiscardChanges()) router.push("/sermons/new");
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sermon
              </Button>
            )}
          </div>
        }
      />

      <TableCard
        toolbar={
          <div
            role="group"
            aria-label="Collection filters"
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search sermons..."
                className="w-full sm:w-64"
              />
              <BranchFilter
                value={branchId}
                onChange={(value) => {
                  setBranchId(value);
                  setPage(1);
                }}
              />
              <SermonMoreFilters
                count={
                  Number(archivedFilter !== "all") +
                  Number(sortBy !== "sermonDate") +
                  Number(sortOrder !== "desc")
                }
              >
                {canManage && (
                  <ArchivedFilter
                    value={archivedFilter}
                    onChange={(value) => {
                      setArchivedFilter(value);
                      setPage(1);
                    }}
                  />
                )}
                <select
                  aria-label="Sort sermons"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(
                      event.target.value as ListSermonsParams["sortBy"],
                    );
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
                    setSortBy("sermonDate");
                    setSortOrder("desc");
                    setBranchId("");
                    setArchivedFilter("all");
                    setPage(1);
                    setSpeaker("");
                    setSeries("");
                  }}
                >
                  Reset filters
                </Button>
              </SermonMoreFilters>
            </div>
            {(speaker || series) && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Filtered by:</span>
                {speaker && <Badge variant="outline">Speaker: {speaker}</Badge>}
                {series && <Badge variant="outline">Series: {series}</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDeepLinkFilters}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        }
        itemName="sermons"
        page={page}
        perPage={perPage}
        total={total}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      >
        {isLoading ? (
          <LoadingState variant="table" />
        ) : sermons.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title={archivedView ? "No archived sermons" : "No sermons yet"}
              description={
                archivedView
                  ? "Archive a sermon to move it here."
                  : search
                    ? "Try adjusting your search."
                    : "Add your first sermon to get started."
              }
            />
          </div>
        ) : (
          <Table exportable={false} tableId="sermons">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Speaker</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Duration</TableHead>
                {canManage && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sermons.map((sermon) => (
                <TableRow
                  key={sermon.sermonId}
                  className="cursor-pointer"
                  onClick={() => {
                    if (confirmDiscardChanges())
                      router.push(`/sermons/${sermon.sermonId}`);
                  }}
                >
                  <TableCell className="font-medium">
                    <div className="space-y-1.5">
                      <Link
                        href={`/sermons/${sermon.sermonId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-semibold"
                      >
                        {sermon.title}
                      </Link>
                      <SermonMediaBadges
                        audioUrl={sermon.audioUrl}
                        videoUrl={sermon.videoUrl}
                      />
                    </div>
                  </TableCell>
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
                      <span className="inline-flex items-center gap-1 tabular-nums">
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
                      onClick={(event) => event.stopPropagation()}
                    >
                      <SermonRowMenu
                        label={`Manage ${sermon.title}`}
                        returnFocusRef={managementRef}
                        actions={[
                          {
                            label: "View",
                            icon: Eye,
                            onSelect: () => {
                              if (confirmDiscardChanges())
                                router.push(`/sermons/${sermon.sermonId}`);
                            },
                          },
                          ...(!archivedView && canUpdate
                            ? [
                                {
                                  label: "Edit",
                                  icon: Pencil,
                                  onSelect: () => {
                                    if (confirmDiscardChanges())
                                      router.push(
                                        `/sermons/${sermon.sermonId}/edit`,
                                      );
                                  },
                                },
                              ]
                            : []),
                          ...(canUpdate
                            ? [
                                {
                                  label: archivedView ? "Restore" : "Archive",
                                  icon: archivedView ? RotateCcw : Archive,
                                  onSelect: () =>
                                    setArchiveTarget({
                                      kind: archivedView
                                        ? "restore"
                                        : "archive",
                                      sermon,
                                    }),
                                },
                              ]
                            : []),
                          ...(canDelete
                            ? [
                                {
                                  label: archivedView
                                    ? "Delete Forever"
                                    : "Delete",
                                  icon: Trash2,
                                  destructive: true,
                                  onSelect: () =>
                                    archivedView
                                      ? setArchiveTarget({
                                          kind: "purge",
                                          sermon,
                                        })
                                      : setDeleteTarget(sermon),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          className="sm:max-w-[420px]"
          onCloseAutoFocus={(event) => {
            if (managementRef.current?.isConnected) {
              event.preventDefault();
              requestAnimationFrame(() => managementRef.current?.focus());
            }
          }}
        >
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

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        returnFocusRef={managementRef}
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="sermon"
        targetName={archiveTarget?.sermon.title}
        targetId={archiveTarget?.sermon.sermonId ?? ""}
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

export default function SermonsListPage() {
  return (
    <Suspense fallback={null}>
      <SermonsListContent />
    </Suspense>
  );
}
