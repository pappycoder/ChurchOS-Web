"use client";

import * as React from "react";
import { Building2, Pencil, Plus, Trash2, Users, RotateCcw, Archive } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { TableCard } from "@/components/shared/table-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { ExportDropdown } from "@/components/shared/export-dropdown";
import type { ExportColumn } from "@/lib/export-utils";
import { DepartmentFormDialog } from "@/components/departments/department-form-dialog";
import { DeleteDepartmentDialog } from "@/components/departments/delete-department-dialog";
import { DepartmentDetailDrawer } from "@/components/departments/department-detail-drawer";
import {
  useDepartmentsList,
  useArchiveDepartment,
  useRestoreArchiveDepartment,
  useDeleteDepartment,
  type Department,
} from "@/hooks/use-admin";

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "name", label: "Name" },
  { key: "head", label: "Head" },
  { key: "branch", label: "Branch" },
  { key: "parent", label: "Parent" },
  { key: "members", label: "Members" },
  { key: "createdAt", label: "Date Added" },
];

export default function DepartmentsPage() {
  const { can } = usePermissions();
  const { data: profile } = useCurrentProfile();
  // Department heads only ever see the department they head (backend-scoped);
  // HQ department heads see every department church-wide but are read-only.
  const isDepartmentHead = !!profile?.role?.includes("department_head");
  const isAdminHq = !!profile?.isAdminHq;
  // Export stays available to staff and HQ department heads (they see all
  // departments); branch-scoped heads manage their own department directly.
  const canExport = !isDepartmentHead || isAdminHq;
  const canCreate = can("departments", "create") && !isDepartmentHead;
  const canUpdate = can("departments", "update") && !(isDepartmentHead && isAdminHq);
  const canDelete = can("departments", "delete") && !isDepartmentHead;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [detailDepartment, setDetailDepartment] = React.useState<Department | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [deleting, setDeleting] = React.useState<Department | null>(null);
  const [archivedFilter, setArchivedFilter] = React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    department: Department;
  } | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: departments, isLoading } = useDepartmentsList({
    archived: archivedView ? true : undefined,
  });
  const archiveMutation = useArchiveDepartment();
  const restoreArchiveMutation = useRestoreArchiveDepartment();
  const purgeMutation = useDeleteDepartment();

  const filtered = React.useMemo(() => {
    const rows = departments ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q) ||
        (d.branchName ?? "").toLowerCase().includes(q) ||
        `${d.headFirstName ?? ""} ${d.headLastName ?? ""}`.toLowerCase().includes(q)
    );
  }, [departments, search]);

  const exportRows = React.useMemo(
    () =>
      filtered.map((department) => {
        const parent = (departments ?? []).find((d) => d.id === department.parentId);
        return {
          name: department.name,
          head: [department.headFirstName, department.headLastName].filter(Boolean).join(" "),
          branch: department.branchName ?? "",
          parent: parent?.name ?? "",
          members: department.memberCount,
          createdAt: new Date(department.createdAt).toLocaleDateString(),
        };
      }),
    [filtered, departments]
  );

  const paged = React.useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const totalMembers = React.useMemo(
    () => (departments ?? []).reduce((sum, d) => sum + d.memberCount, 0),
    [departments]
  );

  const openDetail = (department: Department) => {
    setDetailDepartment(department);
    setDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Departments" },
        ]}
        action={
          canCreate || canExport ? (
            <div className="flex items-center gap-2">
              {canExport && (
                <ExportDropdown
                  columns={EXPORT_COLUMNS}
                  data={exportRows}
                  title="Departments"
                  filename="departments-export"
                  disabled={exportRows.length === 0}
                />
              )}
              {canCreate && (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Departments"
          value={(departments ?? []).length}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Members Covered"
          value={totalMembers}
          subtitle="Across all departments"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <TableCard
        title="All Departments"
        itemName="departments"
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
            {!isDepartmentHead && (
              <ArchivedFilter value={archivedFilter} onChange={setArchivedFilter} />
            )}
            <div className="relative sm:w-72">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Search departments..."
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Head</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Date Added</TableHead>
              {canUpdate || canDelete ? <TableHead className="text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canUpdate || canDelete ? 7 : 6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 7 : 6} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    {archivedView
                      ? "No archived departments."
                      : search
                        ? "No departments match your search."
                        : "No departments yet. Create your first one to get started."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((department) => {
                const parent = (departments ?? []).find((d) => d.id === department.parentId);
                return (
                  <TableRow key={department.id} className="cursor-pointer">
                    <TableCell onClick={() => openDetail(department)}>
                      <p className="font-medium">{department.name}</p>
                      {department.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                          {department.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell onClick={() => openDetail(department)}>
                      {department.branchName ? (
                        <Badge variant="secondary">{department.branchName}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => openDetail(department)}>
                      {department.headFirstName || department.headLastName ? (
                        <span className="text-sm">
                          {[department.headFirstName, department.headLastName]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No head assigned</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => openDetail(department)}>
                      {parent ? (
                        <span className="text-sm">{parent.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Top-level</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={() => openDetail(department)}>
                      <span className="font-medium">{department.memberCount}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground" onClick={() => openDetail(department)}>
                      {new Date(department.createdAt).toLocaleDateString()}
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
                                  setArchiveTarget({ kind: "restore", department })
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
                                  setArchiveTarget({ kind: "purge", department })
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
                                aria-label={`Edit ${department.name}`}
                                onClick={() => {
                                  setEditing(department);
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
                                  aria-label={`Archive ${department.name}`}
                                  onClick={() =>
                                    setArchiveTarget({ kind: "archive", department })
                                  }
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  aria-label={`Delete ${department.name}`}
                                  onClick={() => setDeleting(department)}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </TableCard>

      <DepartmentDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        departmentId={detailDepartment?.id ?? ""}
      />

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        department={editing}
        departments={departments}
        lockedLeaderBranch={isDepartmentHead && !isAdminHq}
      />

      <DeleteDepartmentDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        department={deleting}
      />

      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="department"
        targetName={archiveTarget?.department.name ?? null}
        targetId={archiveTarget?.department.id ?? ""}
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