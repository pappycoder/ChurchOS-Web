"use client";

import * as React from "react";
import { Building2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { TableCard } from "@/components/shared/table-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DepartmentFormDialog } from "@/components/departments/department-form-dialog";
import { DeleteDepartmentDialog } from "@/components/departments/delete-department-dialog";
import { DepartmentDetailDrawer } from "@/components/departments/department-detail-drawer";
import { useDepartmentsList, type Department } from "@/hooks/use-admin";

export default function DepartmentsPage() {
  const { can } = usePermissions();
  const canCreate = can("departments", "create");
  const canUpdate = can("departments", "update");
  const canDelete = can("departments", "delete");

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [detailDepartment, setDetailDepartment] = React.useState<Department | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [deleting, setDeleting] = React.useState<Department | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: departments, isLoading } = useDepartmentsList();

  const filtered = React.useMemo(() => {
    const rows = departments ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q)
    );
  }, [departments, search]);

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
          canCreate ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
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
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
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
                  <TableCell colSpan={canUpdate || canDelete ? 5 : 4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    {search
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
                        </div>
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
      />

      <DeleteDepartmentDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        department={deleting}
      />
    </div>
  );
}