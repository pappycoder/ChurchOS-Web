"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
  Users,
  RotateCcw,
  Archive,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { TableCard } from "@/components/shared/table-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArchivedFilter, type ArchivedFilterValue } from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { CellGroupFormDialog } from "@/components/departments/cell-group-form-dialog";
import { DeleteCellGroupDialog } from "@/components/departments/delete-cell-group-dialog";
import {
  useCellGroupsList,
  useArchiveCellGroup,
  useRestoreArchiveCellGroup,
  useDeleteCellGroup,
  type CellGroup,
} from "@/hooks/use-admin";

export default function CellGroupsPage() {
  const { can } = usePermissions();
  const canCreate = can("cell_groups", "create");
  const canUpdate = can("cell_groups", "update");
  const canDelete = can("cell_groups", "delete");

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CellGroup | null>(null);
  const [deleting, setDeleting] = React.useState<CellGroup | null>(null);
  const [archivedFilter, setArchivedFilter] = React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    group: CellGroup;
  } | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: groups, isLoading } = useCellGroupsList({
    archived: archivedView ? true : undefined,
  });
  const archiveMutation = useArchiveCellGroup();
  const restoreArchiveMutation = useRestoreArchiveCellGroup();
  const purgeMutation = useDeleteCellGroup();

  const filtered = React.useMemo(() => {
    const rows = groups ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        `${g.leaderFirstName ?? ""} ${g.leaderLastName ?? ""}`.toLowerCase().includes(q) ||
        (g.branchName ?? "").toLowerCase().includes(q) ||
        (g.address ?? "").toLowerCase().includes(q)
    );
  }, [groups, search]);

  const paged = React.useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const branchesWithGroups = React.useMemo(
    () => new Set((groups ?? []).map((g) => g.branchId).filter(Boolean)).size,
    [groups]
  );

  return (
    <div>
      <PageHeader
        title="Cell Groups"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Departments", href: "/departments" },
          { label: "Cell Groups" },
        ]}
        action={
          canCreate ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Cell Group
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Cell Groups"
          value={(groups ?? []).length}
          icon={<UsersRound className="h-4 w-4" />}
        />
        <StatsCard
          title="Branches Covered"
          value={branchesWithGroups}
          subtitle="With at least one group"
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatsCard
          title="Unassigned Groups"
          value={(groups ?? []).filter((g) => !g.branchId).length}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <TableCard
        title="All Cell Groups"
        itemName="cell groups"
        page={page}
        perPage={perPage}
        total={filtered.length}
        onPageChange={setPage}
        onPerPageChange={(size) => {
          setPerPage(size);
          setPage(1);
        }}
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <ArchivedFilter value={archivedFilter} onChange={setArchivedFilter} />
            <div className="relative sm:w-72">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Search cell groups..."
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Meeting</TableHead>
              <TableHead className="text-right">Date Added</TableHead>
              {canUpdate || canDelete ? <TableHead className="text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canUpdate || canDelete ? 6 : 5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 6 : 5} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    {archivedView
                      ? "No archived cell groups."
                      : search
                        ? "No cell groups match your search."
                        : "No cell groups yet. Create your first one to get started."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((group) => (
                <TableRow key={group.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/departments/cell-groups/${group.id}`} className="block group">
                      <p className="font-medium group-hover:text-primary flex items-center gap-1">
                        {group.name}
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.leaderFirstName || group.leaderLastName
                          ? `Leader: ${[group.leaderFirstName, group.leaderLastName]
                              .filter(Boolean)
                              .join(" ")}`
                          : "No leader assigned"}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {group.branchName ? (
                      <Badge variant="secondary">{group.branchName}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {group.address ? (
                      <span className="text-sm flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-1">{group.address}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No address</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {group.meetingDay ? (
                      <span className="text-sm flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {group.meetingDay}
                        {group.meetingTime && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {group.meetingTime}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(group.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canUpdate || canDelete ? (
                    <TableCell className="text-right">
                      {archivedView ? (
                        <div className="flex justify-end gap-1.5">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setArchiveTarget({ kind: "restore", group })
                              }
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
                              onClick={() =>
                                setArchiveTarget({ kind: "purge", group })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Delete Forever
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Edit ${group.name}`}
                              onClick={() => {
                                setEditing(group);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Archive ${group.name}`}
                                onClick={() =>
                                  setArchiveTarget({ kind: "archive", group })
                                }
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                aria-label={`Delete ${group.name}`}
                                onClick={() => setDeleting(group)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

      <CellGroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editing}
      />

      <DeleteCellGroupDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        group={deleting}
      />

      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="cell group"
        targetName={archiveTarget?.group.name ?? null}
        targetId={archiveTarget?.group.id ?? ""}
        mutation={
          archiveTarget?.kind === "archive"
            ? archiveMutation
            : archiveTarget?.kind === "restore"
              ? restoreArchiveMutation
              : purgeMutation
        }
      />
    </div>
  );
}