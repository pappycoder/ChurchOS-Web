"use client";

import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { SearchInput } from "@/components/shared/search-input";

import { TableCard } from "@/components/shared/table-card";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUsers,
  useReactivateUser,
  useResetPassword,
  useForceSignout,
  type UserProfile,
  type ListUsersParams,
} from "@/hooks/use-users";
import { useAssignableRoles } from "@/hooks/use-roles";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  UserCheckboxCell,
  UserActionsCell,
  UserNameCell,
  UserRoleCell,
  UserStatusCell,
  UserCreatedCell,
  UserAdminHqCell,
} from "@/components/users/user-columns";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";

const SORT_OPTIONS = [
  { value: "created_at", label: "Date Joined" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "role", label: "Role" },
] as const;

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
      <Card>
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
                <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-20" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [confirmMode, setConfirmMode] = React.useState<"delete" | "deactivate">("deactivate");
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = React.useState<"created_at" | "first_name" | "last_name" | "role">("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [perPage, setPerPage] = React.useState(15);

  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = React.useState(false);
  const [deleteTargets, setDeleteTargets] = React.useState<UserProfile[] | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);

  const queryParams: ListUsersParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      search: search || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      sortBy,
      sortOrder,
    }),
    [page, perPage, search, roleFilter, statusFilter, sortBy, sortOrder]
  );

  const { data, isLoading, error } = useUsers(queryParams);
  const reactivateMutation = useReactivateUser();
  const resetPasswordMutation = useResetPassword();
  const forceSignoutMutation = useForceSignout();

  const assignableRoles = useAssignableRoles();
  const { can } = usePermissions();
  const canCreateUsers = can("profiles", "create");
  const canUpdateUsers = can("profiles", "update");
  const canDeleteUsers = can("profiles", "delete");
  const canManageUsers = canDeleteUsers || canUpdateUsers || can("roles", "update");

  const users = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const activeUsers = users.filter((u) => u.status === "active").length;
  const inactiveUsers = users.filter((u) => u.status === "inactive").length;
  const newJoiners = users.filter((u) => {
    const joined = new Date(u.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return joined >= thirtyDaysAgo;
  }).length;

  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.profileId));
  const someSelected = users.some((u) => selectedIds.has(u.profileId));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(users.map((u) => u.profileId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (profileId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(profileId);
      } else {
        next.delete(profileId);
      }
      return next;
    });
  };

  const handleRowClick = (profileId: string) => {
    router.push(`/admin/users/${profileId}`);
  };

  const handleEditRole = (user: UserProfile) => {
    setSelectedUser(user);
    setEditRoleDialogOpen(true);
  };

  const handleDeactivate = (user: UserProfile) => {
    setConfirmMode("deactivate");
    setDeleteTargets([user]);
  };

  const handleReactivate = (user: UserProfile) => {
    reactivateMutation.mutate(user.profileId, {
      onSuccess: () => {
        toast.success(`${user.firstName} ${user.lastName} has been reactivated.`);
      },
      onError: (err: Error) => {
        toast.error(err.message);
      },
    });
  };

  const handleResetPassword = (user: UserProfile) => {
    resetPasswordMutation.mutate(user.profileId, {
      onSuccess: () => {
        toast.success(`Password reset email sent to ${user.email || user.firstName}.`);
      },
      onError: (err: Error) => {
        toast.error(err.message);
      },
    });
  };

  const handleForceSignout = (user: UserProfile) => {
    forceSignoutMutation.mutate(user.profileId, {
      onSuccess: () => {
        toast.success(`${user.firstName} ${user.lastName} has been signed out.`);
      },
      onError: (err: Error) => {
        toast.error(err.message);
      },
    });
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Users"
          breadcrumbs={[{ label: "Admin" }, { label: "User management" }, { label: "Users" }]}
        />
        <ErrorState title="Failed to load users." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        breadcrumbs={[{ label: "Admin" }, { label: "User management" }, { label: "Users" }]}
        action={
          <div className="flex items-center gap-2">
            {canCreateUsers && (
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatsCard title="Total Users" value={total} icon={<Users className="h-5 w-5" />} />
            <StatsCard title="Active" value={activeUsers} icon={<Users className="h-5 w-5 text-green-600" />} />
            <StatsCard title="Inactive" value={inactiveUsers} icon={<Users className="h-5 w-5 text-red-500" />} />
            <StatsCard title="New (30d)" value={newJoiners} icon={<UserPlus className="h-5 w-5 text-blue-600" />} />
          </div>

          <TableCard
            title="Users List"
            toolbar={
              <div className="flex items-center gap-2 flex-wrap">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search users..."
                  className="w-56"
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); setSelectedIds(new Set()); }}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Select value={sortBy} onValueChange={(v) => { setSortBy(v as typeof sortBy); setPage(1); }}>
                    <SelectTrigger className="w-36">
                      <ArrowUpDown className="h-4 w-4 mr-1.5" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                  >
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            }
            itemName="users"
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={setPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          >
            {someSelected && (canUpdateUsers || canDeleteUsers) && (
              <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b bg-muted/50">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                {canUpdateUsers && <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmMode("deactivate");
                    setDeleteTargets(users.filter((u) => selectedIds.has(u.profileId)));
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Deactivate Selected
                </Button>}
                {canDeleteUsers && <Button variant="destructive" size="sm"
                  disabled={!users.some(u => selectedIds.has(u.profileId) && u.userId !== currentUser?.userId && !u.role.includes("super_admin"))}
                  onClick={() => {
                    setConfirmMode("delete");
                    setDeleteTargets(users.filter(u => selectedIds.has(u.profileId) && u.userId !== currentUser?.userId && !u.role.includes("super_admin")));
                  }}><Trash2 className="h-4 w-4 mr-1.5" />Delete Selected</Button>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            )}

            {users.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={<Users className="h-12 w-12" />}
                  title="No users found"
                  description={search || roleFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters."
                    : "Invite your first user to get started."}
                />
              </div>
            ) : (
              <Table exportable={false} tableId="users">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <UserCheckboxCell
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Access</TableHead>
                        {canManageUsers && (
                          <TableHead className="text-right">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user.profileId}
                          className="cursor-pointer"
                          onClick={() => handleRowClick(user.profileId)}
                        >
                          <TableCell
                            className="w-12"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <UserCheckboxCell
                              checked={selectedIds.has(user.profileId)}
                              onCheckedChange={(checked) => handleSelectRow(user.profileId, checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <UserNameCell user={user} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email || "-"}
                          </TableCell>
                          <TableCell>
                            <UserCreatedCell createdAt={user.createdAt} />
                          </TableCell>
                          <TableCell>
                            <UserRoleCell roles={user.role} />
                          </TableCell>
                          <TableCell>
                            <UserStatusCell status={user.status} />
                          </TableCell>
                          <TableCell>
                            <UserAdminHqCell isAdminHq={user.isAdminHq} />
                          </TableCell>
                          {canManageUsers && (
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <UserActionsCell
                                user={user}
                                onEditRole={handleEditRole}
                                onDeactivate={handleDeactivate}
                                onDelete={(user) => { setConfirmMode("delete"); setDeleteTargets([user]); }}
                                onReactivate={handleReactivate}
                                onResetPassword={handleResetPassword}
                                onForceSignout={handleForceSignout}
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
            )}
          </TableCard>
        </>
      )}

      {inviteDialogOpen && (
        <UserFormDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          mode="invite"
        />
      )}

      {selectedUser && editRoleDialogOpen && (
        <UserFormDialog
          open={editRoleDialogOpen}
          onOpenChange={(open) => { setEditRoleDialogOpen(open); if (!open) setSelectedUser(null); }}
          mode="edit-role"
          user={selectedUser}
        />
      )}
      <DeleteUserDialog
        open={!!deleteTargets}
        onOpenChange={(open) => !open && setDeleteTargets(null)}
        users={deleteTargets ?? []}
        mode={confirmMode}
        onCompleted={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
