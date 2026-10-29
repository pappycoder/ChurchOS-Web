"use client";
import { PermissionLink as Link } from "@/components/shared/permission-link";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Plus,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Eye,
  Pencil,
  Trash2,
  Repeat,
  RotateCcw,
  Archive,
} from "lucide-react";
import { format } from "date-fns";
import {
  VisitorHeader as PageHeader,
  visitorWorkspaceClass,
  VisitorMoreFilters,
  VisitorAvatar,
  VisitorStatusBadge,
  VisitorRowMenu,
} from "@/components/visitors/visitor-presentation";
import { EmptyState } from "@/components/shared/empty-state";
import { TableCard } from "@/components/shared/table-card";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import { SearchInput } from "@/components/shared/search-input";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useVisitorsList,
  useArchiveVisitor,
  useRestoreArchiveVisitor,
  useDeleteVisitor,
  FOLLOW_UP_STATUSES,
  type ListVisitorsParams,
  type Visitor,
  type FollowUpStatus,
} from "@/hooks/use-visitors";
import { useUsers } from "@/hooks/use-users";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchivedFilter,
  type ArchivedFilterValue,
} from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { VisitorFormDialog } from "@/components/visitors/visitor-form-dialog";
import { DeleteVisitorDialog } from "@/components/visitors/delete-visitor-dialog";
import { ConvertVisitorDialog } from "@/components/visitors/convert-visitor-dialog";

const STATUS_FILTER_OPTIONS: Array<{
  value: FollowUpStatus | "all";
  label: string;
}> = [
  { value: "all", label: "All Statuses" },
  ...FOLLOW_UP_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

const SORT_OPTIONS: Array<{
  value: NonNullable<ListVisitorsParams["sortBy"]>;
  label: string;
}> = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "firstVisitDate", label: "First Visit" },
  { value: "followUpStatus", label: "Status" },
  { value: "createdAt", label: "Date Added" },
];

function displayName(visitor: Pick<Visitor, "firstName" | "lastName">): string {
  return `${visitor.firstName}${visitor.lastName ? ` ${visitor.lastName}` : ""}`;
}

function statusLabel(status: FollowUpStatus): string {
  return FOLLOW_UP_STATUSES.find((s) => s.value === status)?.label ?? status;
}

const FollowUpStatusCell = VisitorStatusBadge;

export default function VisitorsPage() {
  const router = useRouter();
  const managementRef = React.useRef<HTMLButtonElement | null>(null);
  const { can } = usePermissions();
  const canCreateVisitors = can("visitors:new", "create");
  const canUpdateVisitors = can("visitors:list", "update");
  const canDeleteVisitors = can("visitors:list", "delete");
  const canConvertVisitor = can("visitors:followup", "update");
  const canManage =
    canCreateVisitors ||
    canUpdateVisitors ||
    canDeleteVisitors ||
    canConvertVisitor;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [archivedFilter, setArchivedFilter] =
    React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [statusFilter, setStatusFilter] = React.useState<
    FollowUpStatus | "all"
  >("all");
  const [sortBy, setSortBy] =
    React.useState<NonNullable<ListVisitorsParams["sortBy"]>>("firstName");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editVisitor, setEditVisitor] = React.useState<Visitor | null>(null);
  const [convertVisitor, setConvertVisitor] = React.useState<Visitor | null>(
    null,
  );
  const [deleteTargets, setDeleteTargets] = React.useState<Visitor[] | null>(
    null,
  );
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    visitor: Visitor;
  } | null>(null);

  // Debounce server-side search.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: ListVisitorsParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      search: search || undefined,
      followUpStatus: statusFilter === "all" ? undefined : statusFilter,
      sortBy,
      sortOrder,
      archived: archivedView ? true : undefined,
    }),
    [page, perPage, search, statusFilter, sortBy, sortOrder, archivedView],
  );

  const { data, isLoading, error } = useVisitorsList(queryParams);
  const archiveMutation = useArchiveVisitor();
  const restoreArchiveMutation = useRestoreArchiveVisitor();
  const purgeMutation = useDeleteVisitor();

  // Assignee display names resolved client-side from profiles.
  const usersQuery = useUsers({ limit: 100, status: "active" });
  const assigneeNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersQuery.data?.data ?? []) {
      map.set(u.profileId, `${u.firstName} ${u.lastName}`);
    }
    return map;
  }, [usersQuery.data]);

  const visitors = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const allSelected =
    visitors.length > 0 && visitors.every((v) => selectedIds.has(v.id));
  const someSelected = visitors.some((v) => selectedIds.has(v.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(visitors.map((v) => v.id)) : new Set());
  };

  const handleSelectRow = (visitorId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(visitorId);
      else next.delete(visitorId);
      return next;
    });
  };

  const handleRowClick = (visitorId: string) => {
    router.push(`/visitors/${visitorId}`);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as typeof sortBy);
    setPage(1);
  };

  const selectedVisitors = visitors.filter((v) => selectedIds.has(v.id));

  const exportColumns = [
    { key: "name", label: "Full Name" },
    { key: "gender", label: "Gender" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "whatsappNumber", label: "WhatsApp" },
    { key: "firstVisitDate", label: "First Visit" },
    { key: "status", label: "Follow-up Status" },
    { key: "assignedTo", label: "Assigned To" },
    { key: "converted", label: "Converted" },
  ];

  const exportSource = someSelected ? selectedVisitors : visitors;
  const buildExportRows = React.useCallback(
    (rows: Visitor[]) =>
      rows.map((v) => ({
        name: displayName(v),
        gender: v.gender || "",
        email: v.email || "",
        phone: v.phone || "",
        whatsappNumber: v.whatsappNumber || "",
        firstVisitDate: format(new Date(v.firstVisitDate), "yyyy-MM-dd"),
        status: statusLabel(v.followUpStatus),
        assignedTo: v.assignedToId
          ? assigneeNames.get(v.assignedToId) || ""
          : "",
        converted: v.convertedMemberId ? "Yes" : "No",
      })),
    [assigneeNames],
  );
  const exportData = buildExportRows(exportSource);

  // "Export all": walks every page of the current filter/sort server-side.
  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<Visitor>((p) =>
      api.get(listUrl("/visitors", { ...queryParams, page: p, limit: 200 })),
    );
    return buildExportRows(rows);
  }, [queryParams, buildExportRows]);

  if (error) {
    return (
      <div>
        <PageHeader
          title="Visitors"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Visitors" },
          ]}
        />
        <ErrorState title="Failed to load visitors." />
      </div>
    );
  }

  return (
    <div className={`${visitorWorkspaceClass} space-y-4`}>
      <PageHeader
        count={isLoading ? undefined : (meta?.total ?? 0)}
        title="Visitors"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Visitors" },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canCreateVisitors && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={(event) => {
                    managementRef.current = event.currentTarget;
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Add
                </Button>
                <Button
                  onClick={() => {
                    if (confirmDiscardChanges()) router.push("/visitors/new");
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Visitor
                </Button>
              </div>
            )}
          </div>
        }
      />

      <TableCard
        title="All Visitors"
        itemName="visitors"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
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
              placeholder="Search name, email, phone..."
              className="w-full sm:w-64"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as FollowUpStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44" aria-label="Follow-up status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <VisitorMoreFilters
              count={
                Number(archivedFilter !== "all") +
                Number(sortBy !== "firstName") +
                Number(sortOrder !== "asc")
              }
            >
              <ArchivedFilter
                value={archivedFilter}
                onChange={(value) => {
                  setArchivedFilter(value);
                  setPage(1);
                }}
                onClearSelection={() => setSelectedIds(new Set())}
              />
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40" aria-label="Sort visitors">
                  <ArrowUpDown className="size-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="size-4" />
                ) : (
                  <SortDesc className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setArchivedFilter("all");
                  setStatusFilter("all");
                  setSortBy("firstName");
                  setSortOrder("asc");
                  setPage(1);
                  setSelectedIds(new Set());
                }}
              >
                Reset filters
              </Button>
            </VisitorMoreFilters>
          </div>
        }
        exportAction={
          <ExportDropdown
            tableId="visitors"
            columns={exportColumns}
            data={exportData}
            fetchAllRows={fetchAllExportRows}
            title={
              someSelected
                ? `Visitors (${selectedVisitors.length} selected)`
                : "Visitors"
            }
            filename="visitors-export"
            disabled={exportSource.length === 0}
          />
        }
      >
        {!archivedView && someSelected && canDeleteVisitors && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/50">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={(event) => {
                managementRef.current = event.currentTarget;
                setDeleteTargets(selectedVisitors);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        )}

        {isLoading ? (
          <LoadingState variant="table" />
        ) : visitors.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<UserPlus className="h-12 w-12" />}
              title={
                archivedView ? "No archived visitors" : "No visitors found"
              }
              description={
                archivedView
                  ? "Archive a visitor to move them here."
                  : search || statusFilter !== "all"
                    ? "Try adjusting your filters."
                    : canCreateVisitors
                      ? "Add your first visitor to get started."
                      : "No visitors have been registered yet."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto px-4">
            <Table exportable={false} tableId="visitors">
              <TableHeader>
                <TableRow>
                  {!archivedView && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          handleSelectAll(!!checked)
                        }
                        aria-label="Select all visitors"
                      />
                    </TableHead>
                  )}
                  <TableHead exportKeys={["name", "email", "converted"]}>
                    Visitor
                  </TableHead>
                  <TableHead exportKeys={["phone", "whatsappNumber"]}>
                    Contact
                  </TableHead>
                  <TableHead exportKeys={["firstVisitDate"]}>
                    First Visit
                  </TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead exportKeys={["status"]}>Status</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => (
                  <TableRow
                    key={visitor.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(visitor.id)}
                  >
                    {!archivedView && (
                      <TableCell
                        className="w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(visitor.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(visitor.id, !!checked)
                          }
                          aria-label={`Select ${displayName(visitor)}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <VisitorAvatar
                          id={visitor.id}
                          name={displayName(visitor)}
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate flex items-center gap-2">
                            <Link
                              href={`/visitors/${visitor.id}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {displayName(visitor)}
                            </Link>
                            {(visitor.convertedMemberId ||
                              visitor.followUpStatus === "converted") && (
                              <VisitorStatusBadge status="converted" />
                            )}
                          </p>
                          {visitor.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {visitor.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {visitor.phone || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(visitor.firstVisitDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {visitor.assignedToId
                        ? assigneeNames.get(visitor.assignedToId) || "-"
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <FollowUpStatusCell status={visitor.followUpStatus} />
                    </TableCell>
                    {canManage && (
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <VisitorRowMenu
                          label={`Manage ${displayName(visitor)}`}
                          returnFocusRef={managementRef}
                          actions={[
                            {
                              label: "View Details",
                              icon: Eye,
                              onSelect: () => handleRowClick(visitor.id),
                            },
                            ...(!archivedView &&
                            canUpdateVisitors &&
                            !visitor.convertedMemberId
                              ? [
                                  {
                                    label: "Edit Visitor",
                                    icon: Pencil,
                                    onSelect: () => setEditVisitor(visitor),
                                  },
                                ]
                              : []),
                            ...(!archivedView &&
                            canConvertVisitor &&
                            !visitor.convertedMemberId
                              ? [
                                  {
                                    label: "Convert to Member",
                                    icon: Repeat,
                                    onSelect: () => setConvertVisitor(visitor),
                                  },
                                ]
                              : []),
                            ...(canUpdateVisitors
                              ? [
                                  {
                                    label: archivedView ? "Restore" : "Archive",
                                    icon: archivedView ? RotateCcw : Archive,
                                    onSelect: () =>
                                      setArchiveTarget({
                                        kind: archivedView
                                          ? "restore"
                                          : "archive",
                                        visitor,
                                      }),
                                  },
                                ]
                              : []),
                            ...(canDeleteVisitors
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
                                            visitor,
                                          })
                                        : setDeleteTargets([visitor]),
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
          </div>
        )}
      </TableCard>

      <VisitorFormDialog
        presentationClassName={visitorWorkspaceClass}
        returnFocusRef={managementRef}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <VisitorFormDialog
        presentationClassName={visitorWorkspaceClass}
        returnFocusRef={managementRef}
        open={!!editVisitor}
        onOpenChange={(open) => !open && setEditVisitor(null)}
        visitor={editVisitor}
      />
      {convertVisitor && (
        <ConvertVisitorDialog
          presentationClassName={visitorWorkspaceClass}
          returnFocusRef={managementRef}
          open={!!convertVisitor}
          onOpenChange={(open) => !open && setConvertVisitor(null)}
          visitor={convertVisitor}
        />
      )}
      <DeleteVisitorDialog
        presentationClassName={visitorWorkspaceClass}
        returnFocusRef={managementRef}
        open={!!deleteTargets}
        onOpenChange={(open) => !open && setDeleteTargets(null)}
        visitors={deleteTargets ?? []}
        onDeleted={() => setSelectedIds(new Set())}
      />
      <ArchiveConfirmDialog
        returnFocusRef={managementRef}
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="visitor"
        targetName={archiveTarget ? displayName(archiveTarget.visitor) : null}
        targetId={archiveTarget?.visitor.id ?? ""}
        mutation={
          archiveTarget?.kind === "archive"
            ? archiveMutation
            : archiveTarget?.kind === "restore"
              ? restoreArchiveMutation
              : purgeMutation
        }
        onConfirmed={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
