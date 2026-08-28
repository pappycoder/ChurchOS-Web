"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldPlus,
  Lock,
  AlertTriangle,
  ChevronRight,
  KeyRound,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { TableCard } from "@/components/shared/table-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoleLabel } from "@/hooks/use-users";
import {
  sortRolesByOrder,
  useRolesSummary,
  useAllPermissions,
  type RoleWithPermissions,
} from "@/hooks/use-roles";
import { CreateRoleDialog } from "@/components/roles/create-role-dialog";
import { usePermissions } from "@/hooks/use-permissions";

function RoleStatusBadge({ role }: { role: RoleWithPermissions }) {
  if (role.roleName === "super_admin") {
    return (
      <Badge variant="outline" className="gap-1">
        <Lock className="h-3 w-3" />
        Locked
      </Badge>
    );
  }
  if (role.isChurchOwned) {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 gap-1">
        <ShieldPlus className="h-3 w-3" />
        Custom
      </Badge>
    );
  }
  if (role.isCustomized) {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 gap-1">
        <SlidersHorizontal className="h-3 w-3" />
        Customized
      </Badge>
    );
  }
  return <Badge variant="secondary">Default</Badge>;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4 bg-muted/50">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border">
        <div className="px-6 py-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const router = useRouter();
  const { data, isLoading, error } = useRolesSummary();
  const { data: allPermissions } = useAllPermissions();

  const roles = React.useMemo(
    () => sortRolesByOrder(data?.roles ?? []),
    [data]
  );
  const customizedCount = roles.filter(
    (r) => r.isCustomized || r.isChurchOwned
  ).length;
  const totalPermissions = allPermissions?.length ?? 0;
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  // Role CRUD has no dedicated permission resource — restricted to
  // church-level admins by legacy role assignment.
  const { hasRole } = usePermissions();
  const canManageRoles = hasRole("church_admin", "super_admin");

  if (error) {
    return (
      <div>
        <PageHeader
          title="Roles & Permissions"
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "User Management", href: "/admin/users" },
            { label: "Roles & Permissions" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load roles.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "User Management", href: "/admin/users" },
          { label: "Roles & Permissions" },
        ]}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
            <StatsCard
              title="Total Roles"
              value={roles.length}
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <StatsCard
              title="Customized"
              value={customizedCount}
              subtitle="Roles with church-specific permissions"
              icon={
                <SlidersHorizontal className="h-5 w-5 text-blue-600" />
              }
            />
            <StatsCard
              title="Available Permissions"
              value={totalPermissions}
              icon={<KeyRound className="h-5 w-5 text-purple-600" />}
            />
          </div>

          <TableCard
            title="Roles"
            description="Church-level changes are added on top of each role's global defaults."
            action={
              canManageRoles && (
                <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Role
                </Button>
              )
            }
          >
            {roles.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={<ShieldCheck className="h-12 w-12" />}
                  title="No roles found"
                  description="Run the permissions seed to create the default roles."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.roleName}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/roles/${role.roleName}`)
                      }
                    >
                      <TableCell className="font-medium">
                        {role.label || getRoleLabel(role.roleName)}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell>
                        {totalPermissions > 0 ? (
                          <span className="tabular-nums">
                            {role.permissions.length}
                            <span className="text-muted-foreground">
                              {" "}
                              / {totalPermissions}
                            </span>
                          </span>
                        ) : (
                          role.permissions.length
                        )}
                      </TableCell>
                      <TableCell>
                        <RoleStatusBadge role={role} />
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableCard>
        </>
      )}

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(roleName) => router.push(`/admin/roles/${roleName}`)}
      />
    </div>
  );
}
