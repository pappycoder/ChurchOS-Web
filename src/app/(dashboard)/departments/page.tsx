"use client";
import { WorkspaceRowMenu } from "@/components/workspace/workspace-management-menu";
import { ErrorState } from "@/components/shared/error-state";

import { EmptyState } from "@/components/shared/empty-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import { PermissionLink } from "@/components/shared/permission-link";
import { Pencil, Plus, Trash2, RotateCcw, Archive } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { BranchFilter } from "@/components/shared/branch-filter";
import { useCurrentProfile } from "@/hooks/use-profile";
import {
  WorkspaceMoreFilters,
  WorkspaceHeader as PageHeader,
} from "@/components/workspace/workspace-presentation";
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
import {
  ArchivedFilter,
  type ArchivedFilterValue,
} from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";

import { DepartmentFormDialog } from "@/components/departments/department-form-dialog";
import { DeleteDepartmentDialog } from "@/components/departments/delete-department-dialog";
import {
  useDepartmentsList,
  useArchiveDepartment,
  useRestoreArchiveDepartment,
  useDeleteDepartment,
  type Department,
} from "@/hooks/use-admin";

export default function DepartmentsPage() {
  const managementRef = React.useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { can, canAny } = usePermissions();
  const { data: profile } = useCurrentProfile();
  // Department heads only ever see the department they head (backend-scoped);
  // HQ department heads see every department church-wide but edit only the
  // department they head (backend-enforced ownership).
  const isDepartmentHead =
    canAny("departments:own:read") && !canAny("departments:delete");
  const isAdminHq = !!profile?.isAdminHq;

  const canCreate =
    can("departments", "create") && (!isDepartmentHead || isAdminHq);
  const canUpdate = can("departments", "update");
  const canDelete = can("departments", "delete");
  // A department head edits only the department they head; the row Edit button
  // therefore also requires ownership whenever the viewer is a head.
  const isOwnDepartment = (department: Department) =>
    isDepartmentHead &&
    !!profile?.memberId &&
    department.headMemberId === profile.memberId;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [branchId, setBranchId] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [deleting, setDeleting] = React.useState<Department | null>(null);
  const [archivedFilter, setArchivedFilter] =
    React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    department: Department;
  } | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data: departments,
    isLoading,
    error,
  } = useDepartmentsList({
    archived: archivedView ? true : undefined,
    branchId: branchId || undefined,
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
        `${d.headFirstName ?? ""} ${d.headLastName ?? ""}`
          .toLowerCase()
          .includes(q),
    );
  }, [departments, search]);

  const paged = React.useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

  const openDetail = (department: Department) => {
    router.push(`/departments/${department.id}`);
  };

  return (
    <div>
      <PageHeader
        count={filtered.length}
        title="Departments"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Departments" },
        ]}
        action={
          canCreate ? (
            <div className="flex items-center gap-2">
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
            <BranchFilter
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setPage(1);
              }}
            />
            <WorkspaceMoreFilters count={Number(archivedFilter !== "all")}>
              {!isDepartmentHead && (
                <ArchivedFilter
                  value={archivedFilter}
                  onChange={(value) => {
                    setArchivedFilter(value);
                    setPage(1);
                  }}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setArchivedFilter("all");
                  setSearchInput("");
                  setSearch("");
                  setBranchId("");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </WorkspaceMoreFilters>
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
        <Table exportable={false} tableId="departments">
          <TableHeader>
            <TableRow>
              <TableHead exportKeys={["name"]}>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Head</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Date Added</TableHead>
              {canUpdate || canDelete ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={20}>
                  <ErrorState title="Unable to load departments" />
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canUpdate || canDelete ? 7 : 6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canUpdate || canDelete ? 7 : 6}
                  className="h-32 text-center"
                >
                  <EmptyState
                    title="No results"
                    description={
                      archivedView
                        ? "No archived departments."
                        : search
                          ? "No departments match your search."
                          : "No departments yet. Create your first one to get started."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((department) => {
                const parent = (departments ?? []).find(
                  (d) => d.id === department.parentId,
                );
                return (
                  <TableRow key={department.id} className="cursor-pointer">
                    <TableCell>
                      <PermissionLink
                        href={`/departments/${department.id}`}
                        className="font-medium hover:underline"
                      >
                        {department.name}
                      </PermissionLink>
                      {department.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                          {department.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell onClick={() => openDetail(department)}>
                      {department.branchName ? (
                        <Badge variant="secondary">
                          {department.branchName}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Unassigned
                        </span>
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
                        <span className="text-xs text-muted-foreground">
                          No head assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => openDetail(department)}>
                      {parent ? (
                        <span className="text-sm">{parent.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Top-level
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={() => openDetail(department)}
                    >
                      <span className="font-medium">
                        {department.memberCount}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-right text-sm text-muted-foreground"
                      onClick={() => openDetail(department)}
                    >
                      {new Date(department.createdAt).toLocaleDateString()}
                    </TableCell>
                    {canUpdate || canDelete ? (
                      <TableCell className="text-right">
                        {archivedView ? (
                          <WorkspaceRowMenu
                            label={`Manage ${department.name}`}
                            returnFocusRef={managementRef}
                          >
                            {canUpdate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setArchiveTarget({
                                    kind: "restore",
                                    department,
                                  })
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
                                  setArchiveTarget({
                                    kind: "purge",
                                    department,
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete Forever
                              </Button>
                            )}
                          </WorkspaceRowMenu>
                        ) : (
                          <WorkspaceRowMenu
                            label={`Manage ${department.name}`}
                            returnFocusRef={managementRef}
                          >
                            {canUpdate &&
                              (!isDepartmentHead ||
                                isOwnDepartment(department)) && (
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
                            {(canUpdate || canDelete) && (
                              <>
                                {canUpdate && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={`Archive ${department.name}`}
                                    onClick={() =>
                                      setArchiveTarget({
                                        kind: "archive",
                                        department,
                                      })
                                    }
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    aria-label={`Delete ${department.name}`}
                                    onClick={() => setDeleting(department)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </WorkspaceRowMenu>
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

      {formOpen && (
        <DepartmentFormDialog
          returnFocusRef={editing ? managementRef : undefined}
          open={formOpen}
          onOpenChange={setFormOpen}
          department={editing}
          departments={departments}
          lockedLeaderBranch={isDepartmentHead && !isAdminHq}
        />
      )}

      <DeleteDepartmentDialog
        returnFocusRef={managementRef}
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        department={deleting}
      />

      <ArchiveConfirmDialog
        returnFocusRef={managementRef}
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
