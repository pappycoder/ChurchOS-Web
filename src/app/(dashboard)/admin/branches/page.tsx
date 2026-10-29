"use client";

import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Trash2,
  MoreVertical,
  Eye,
  Pencil,
  RotateCcw,
  Archive,
} from "lucide-react";
import { format } from "date-fns";
import {
  WorkspaceMoreFilters,
  WorkspaceHeader as PageHeader,
} from "@/components/workspace/workspace-presentation";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";

import { TableCard } from "@/components/shared/table-card";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  useBranchesList,
  useArchiveBranch,
  useRestoreArchiveBranch,
  useDeleteBranch,
  type Branch,
} from "@/hooks/use-branches";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchivedFilter,
  type ArchivedFilterValue,
} from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { BranchFormDialog } from "@/components/branches/branch-form-dialog";
import { DeleteBranchDialog } from "@/components/branches/delete-branch-dialog";

type TypeFilter = "all" | "headquarters" | "branches";

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "city", label: "City" },
  { value: "created_at", label: "Date Added" },
] as const;

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4 bg-muted/50">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border">
        <div className="flex items-center justify-between p-5 pb-3">
          <Skeleton className="h-6 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="p-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
                <TableHead className="text-right">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function BranchesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreateBranches = can("branches", "create");
  const canUpdateBranches = can("branches", "update");
  const canDeleteBranches = can("branches", "delete");
  // Coarse flag for admin-flavored empty-state copy.
  const canManage = canCreateBranches || canUpdateBranches || canDeleteBranches;

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [archivedFilter, setArchivedFilter] =
    React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [sortBy, setSortBy] = React.useState<"name" | "city" | "created_at">(
    "name",
  );
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editBranch, setEditBranch] = React.useState<Branch | null>(null);
  const [deleteTargets, setDeleteTargets] = React.useState<Branch[] | null>(
    null,
  );
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    branch: Branch;
  } | null>(null);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  // Branches are few per church — fetch one large page so client-side type
  // filtering and stats cover the whole set while search stays server-side.
  const { data, isLoading, error } = useBranchesList({
    limit: 100,
    search: search || undefined,
    archived: archivedView ? true : undefined,
    sortBy,
    sortOrder,
  });

  const archiveMutation = useArchiveBranch();
  const restoreArchiveMutation = useRestoreArchiveBranch();
  const purgeMutation = useDeleteBranch();

  const allBranches = React.useMemo(() => data?.data ?? [], [data]);

  const branches = React.useMemo(() => {
    switch (typeFilter) {
      case "headquarters":
        return allBranches.filter((b) => b.isHeadquarters);
      case "branches":
        return allBranches.filter((b) => !b.isHeadquarters);
      default:
        return allBranches;
    }
  }, [allBranches, typeFilter]);

  const pagedBranches = React.useMemo(
    () => branches.slice((page - 1) * perPage, page * perPage),
    [branches, page, perPage],
  );

  const maxPage = Math.max(1, Math.ceil(branches.length / perPage));
  React.useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  const allSelected =
    branches.length > 0 && branches.every((b) => selectedIds.has(b.branchId));
  const someSelected = branches.some((b) => selectedIds.has(b.branchId));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(
      checked ? new Set(branches.map((b) => b.branchId)) : new Set(),
    );
  };

  const handleSelectRow = (branchId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(branchId);
      else next.delete(branchId);
      return next;
    });
  };

  const handleRowClick = (branchId: string) => {
    router.push(`/admin/branches/${branchId}`);
  };

  const selectedBranches = branches.filter((b) => selectedIds.has(b.branchId));

  if (error) {
    return (
      <div>
        <PageHeader
          title="Branches"
          breadcrumbs={[
            { label: "Admin" },
            { label: "Church Settings", href: "/admin/settings" },
            { label: "Branches" },
          ]}
        />
        <ErrorState title="Failed to load branches." />
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full">
      <PageHeader
        count={branches.length}
        title="Branches"
        breadcrumbs={[
          { label: "Admin" },
          { label: "Church Settings", href: "/admin/settings" },
          { label: "Branches" },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canCreateBranches && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <TableCard
            className="min-w-0 w-full"
            title="Branches List"
            toolbar={
              <div className="flex items-center gap-2 flex-wrap">
                <WorkspaceMoreFilters
                  count={
                    Number(archivedFilter !== "all") +
                    Number(sortBy !== "name" || sortOrder !== "asc")
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
                  <div className="flex items-center gap-1">
                    <Select
                      value={sortBy}
                      onValueChange={(v) => setSortBy(v as typeof sortBy)}
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
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                    >
                      {sortOrder === "asc" ? (
                        <SortAsc className="h-4 w-4" />
                      ) : (
                        <SortDesc className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setArchivedFilter("all");
                      setSortBy("name");
                      setSortOrder("asc");
                      setTypeFilter("all");
                      setSearch("");
                      setPage(1);
                      setSelectedIds(new Set());
                    }}
                  >
                    Reset filters
                  </Button>
                </WorkspaceMoreFilters>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search name, city, address..."
                  className="w-56"
                />
                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v as TypeFilter);
                    setSelectedIds(new Set());
                  }}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="headquarters">Headquarters</SelectItem>
                    <SelectItem value="branches">Branches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            itemName="branches"
            page={page}
            perPage={perPage}
            total={branches.length}
            onPageChange={setPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          >
            {!archivedView && someSelected && canDeleteBranches && (
              <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/50">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTargets(selectedBranches)}
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

            {branches.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={<Building2 className="h-12 w-12" />}
                  title={
                    archivedView ? "No archived branches" : "No branches found"
                  }
                  description={
                    archivedView
                      ? "Archive a branch to move it here."
                      : search || typeFilter !== "all"
                        ? "Try adjusting your filters."
                        : canManage
                          ? "Add your first branch to get started."
                          : "No branches have been added yet."
                  }
                />
              </div>
            ) : (
              <Table
                exportable={false}
                tableId="branches"
                className="min-w-[56rem]"
              >
                <TableHeader>
                  <TableRow>
                    {!archivedView && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(v) => handleSelectAll(!!v)}
                          aria-label="Select all rows"
                        />
                      </TableHead>
                    )}
                    <TableHead exportKeys={["name", "isHeadquarters"]}>
                      Branch Name
                    </TableHead>
                    <TableHead
                      exportKeys={["address", "city", "state", "country"]}
                    >
                      Location
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedBranches.map((branch) => (
                    <TableRow
                      key={branch.branchId}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(branch.branchId)}
                    >
                      {!archivedView && (
                        <TableCell
                          className="w-12"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.has(branch.branchId)}
                            onCheckedChange={(v) =>
                              handleSelectRow(branch.branchId, !!v)
                            }
                            aria-label={`Select ${branch.name}`}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="hidden h-9 w-9 rounded-lg sm:flex">
                            {branch.photoUrl && (
                              <AvatarImage
                                src={branch.photoUrl}
                                alt={branch.name}
                                className="rounded-lg object-cover"
                              />
                            )}
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                              {getInitials(branch.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <span
                              className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium"
                              title={branch.name}
                            >
                              {branch.name}
                            </span>
                            {branch.isHeadquarters && (
                              <Badge variant="secondary" className="mt-1">
                                HQ
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {[branch.city, branch.state]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {branch.phone || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {branch.email || "-"}
                      </TableCell>
                      <TableCell>{branch.memberCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(branch.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {archivedView ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {canUpdateBranches && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setArchiveTarget({ kind: "restore", branch })
                                }
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                Restore
                              </Button>
                            )}
                            {canDeleteBranches && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  setArchiveTarget({ kind: "purge", branch })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete Forever
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {canUpdateBranches && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditBranch(branch)}
                                title="Edit Branch"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
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
                                  onClick={() =>
                                    handleRowClick(branch.branchId)
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {(canUpdateBranches || canDeleteBranches) && (
                                  <>
                                    {canUpdateBranches && (
                                      <DropdownMenuItem
                                        onClick={() => setEditBranch(branch)}
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Branch
                                      </DropdownMenuItem>
                                    )}
                                    {(canUpdateBranches ||
                                      canDeleteBranches) && (
                                      <>
                                        <DropdownMenuSeparator />
                                        {canUpdateBranches && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              setArchiveTarget({
                                                kind: "archive",
                                                branch,
                                              })
                                            }
                                          >
                                            <Archive className="mr-2 h-4 w-4" />
                                            Archive
                                          </DropdownMenuItem>
                                        )}
                                        {canDeleteBranches && (
                                          <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() =>
                                              setDeleteTargets([branch])
                                            }
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Branch
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableCard>
        </>
      )}

      <BranchFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {editBranch && (
        <BranchFormDialog
          open={!!editBranch}
          onOpenChange={(open) => {
            if (!open) setEditBranch(null);
          }}
          branch={editBranch}
        />
      )}

      {deleteTargets && deleteTargets.length > 0 && (
        <DeleteBranchDialog
          open={!!deleteTargets}
          onOpenChange={(open) => {
            if (!open) setDeleteTargets(null);
          }}
          branches={deleteTargets}
          onDeleted={() => setSelectedIds(new Set())}
        />
      )}

      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="branch"
        targetName={archiveTarget?.branch.name ?? null}
        targetId={archiveTarget?.branch.branchId ?? ""}
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
