"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  Lock,
  RotateCcw,
  ShieldPlus,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getRoleLabel } from "@/hooks/use-users";
import {
  PROTECTED_ADMIN_PERMISSIONS,
  useRolePermissions,
  useAllPermissions,
  useSetRolePermissions,
  useResetRoleToDefaults,
  type Permission,
} from "@/hooks/use-roles";
import { PermissionMatrixEditor } from "@/components/roles/permission-matrix-editor";
import { ResetRoleDialog } from "@/components/roles/reset-role-dialog";
import { usePermissions } from "@/hooks/use-permissions";

export default function RoleDetailPage({
  params,
}: {
  params: Promise<{ roleName: string }>;
}) {
  const { roleName } = React.use(params);
  const router = useRouter();

  const { data: role, isLoading, error } = useRolePermissions(roleName);
  const { data: allPermissions } = useAllPermissions();

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const setPermissionsMutation = useSetRolePermissions(roleName);
  const resetMutation = useResetRoleToDefaults(roleName);

  React.useEffect(() => {
    if (role) {
      setSelectedIds(new Set(role.permissions.map((p) => p.id)));
    }
  }, [role]);

  const isSuperAdmin = roleName === "super_admin";
  const isChurchOwned = role?.isChurchOwned ?? false;
  // Role CRUD has no dedicated permission resource — restricted to
  // church-level admins by legacy role assignment.
  const { hasRole } = usePermissions();
  const canManageRoles = hasRole("church_admin", "super_admin");
  const displayLabel = role?.label || getRoleLabel(roleName);

  const permissionIdByName = React.useMemo(
    () =>
      new Map((allPermissions ?? []).map((p) => [p.name, p.id] as const)),
    [allPermissions]
  );

  const blockedFromRemovalIds = React.useMemo(() => {
    if (roleName !== "church_admin") return undefined;
    const ids = PROTECTED_ADMIN_PERMISSIONS.map((name) =>
      permissionIdByName.get(name)
    ).filter((id): id is string => Boolean(id));
    return ids.length > 0 ? new Set(ids) : undefined;
  }, [roleName, permissionIdByName]);

  const grantedIds = React.useMemo(
    () => new Set((role?.permissions ?? []).map((p) => p.id)),
    [role]
  );

  const addedCount = [...selectedIds].filter((id) => !grantedIds.has(id)).length;
  const removedCount = [...grantedIds].filter((id) => !selectedIds.has(id)).length;
  const isDirty = addedCount > 0 || removedCount > 0;

  const handleToggle = (perm: Permission, next: boolean) => {
    if (!canManageRoles) return;
    setSelectedIds((prev) => {
      const nextSet = new Set(prev);
      if (next) {
        nextSet.add(perm.id);
      } else {
        if (
          roleName === "church_admin" &&
          blockedFromRemovalIds?.has(perm.id)
        ) {
          toast.error(
            `${perm.name} cannot be removed — church admins must keep core management permissions.`
          );
          return prev;
        }
        nextSet.delete(perm.id);
      }
      return nextSet;
    });
  };

  const handleSave = () => {
    setPermissionsMutation.mutate([...selectedIds], {
      onSuccess: (updated) => {
        const keptGranted = updated.permissions.filter(
          (p) => !selectedIds.has(p.id)
        );
        if (keptGranted.length > 0) {
          toast.warning(
            `${keptGranted.length} permission${keptGranted.length === 1 ? "" : "s"} could not be revoked because ${keptGranted.length === 1 ? "it is" : "they are"} part of this role's global defaults.`,
            {
              description:
                "Only additions are saved per church. Global defaults apply to every church.",
              duration: 8000,
            }
          );
          setSelectedIds(new Set(updated.permissions.map((p) => p.id)));
        } else {
          toast.success(`Permissions updated for ${displayLabel}.`);
        }
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleDiscard = () => {
    setSelectedIds(new Set(grantedIds));
  };

  const handleResetConfirm = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        setResetDialogOpen(false);
        toast.success(`${displayLabel} has been reset to global defaults.`);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/roles">Roles</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Not Found</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Role not found.</p>
          <Button variant="outline" onClick={() => router.push("/admin/roles")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/roles")} aria-label="Back to roles">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/users">Users</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/roles">Roles & Permissions</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>
              {isLoading ? "Loading..." : displayLabel}
            </BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : role ? (
        <>
          <div className="rounded-lg border p-5 space-y-2">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{displayLabel}</h2>
                  {isSuperAdmin && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </Badge>
                  )}
                  {isChurchOwned && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 gap-1">
                      <ShieldPlus className="h-3 w-3" />
                      Custom
                    </Badge>
                  )}
                  {!isSuperAdmin && !isChurchOwned && role.isCustomized && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 gap-1">
                      <SlidersHorizontal className="h-3 w-3" />
                      Customized
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {role.description || "No description"}
                </p>
              </div>
              {!isSuperAdmin && !isChurchOwned && canManageRoles && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!role.isCustomized || resetMutation.isPending || isDirty}
                  onClick={() => setResetDialogOpen(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Reset to Defaults
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {role.permissions.length}
              {allPermissions ? ` of ${allPermissions.length}` : ""} permissions
              granted
              {isSuperAdmin ? " — super admins always have everything." : "."}
            </p>
          </div>

          {isSuperAdmin ? (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Fully privileged by design</AlertTitle>
              <AlertDescription>
                The super admin role always holds every permission. It cannot be
                modified so that no church can ever lock itself out.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {isChurchOwned ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>This role&apos;s own permissions</AlertTitle>
                  <AlertDescription>
                    This is a custom role owned by your church — the ticked
                    permissions are exactly what it grants. Changes are saved
                    directly: unticking a box removes that permission from
                    everyone holding this role in your church.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Additive customization</AlertTitle>
                  <AlertDescription>
                    Ticking a box grants this extra permission{" "}
                    <span className="font-medium">in your church only</span>,
                    without affecting other churches. Permissions built into the
                    role&apos;s global defaults stay active and cannot be revoked
                    here.
                  </AlertDescription>
                </Alert>
              )}

              <PermissionMatrixEditor
                allPermissions={allPermissions ?? []}
                grantedIds={grantedIds}
                selectedIds={selectedIds}
                blockedFromRemovalIds={blockedFromRemovalIds}
                onToggle={handleToggle}
              />
            </>
          )}

          {isDirty && canManageRoles && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-2xl">
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-lg">
                <span className="text-sm font-medium tabular-nums">
                  <span className="text-emerald-600">+{addedCount}</span>{" "}
                  <span className="text-red-500 ml-2">−{removedCount}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleDiscard}>
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={
                      selectedIds.size === 0 || setPermissionsMutation.isPending
                    }
                  >
                    {setPermissionsMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </div>
              {selectedIds.size === 0 && (
                <p className="mt-1 text-center text-xs text-destructive">
                  A role must keep at least one permission.
                </p>
              )}
            </div>
          )}

          {!isChurchOwned && (
            <ResetRoleDialog
              open={resetDialogOpen}
              onOpenChange={setResetDialogOpen}
              roleName={roleName}
              onConfirm={handleResetConfirm}
              isPending={resetMutation.isPending}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
