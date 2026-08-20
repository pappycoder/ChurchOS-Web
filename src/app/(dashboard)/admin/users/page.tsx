"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  AlertTriangle,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { SearchInput } from "@/components/shared/search-input";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  useInviteUser,
  useUpdateUserRole,
  useDeactivateUser,
  useReactivateUser,
  useResetPassword,
  useForceSignout,
  VALID_ROLES,
  getRoleLabel,
  type UserProfile,
  type ListUsersParams,
} from "@/hooks/use-users";
import {
  UserCheckboxCell,
  UserActionsCell,
  UserNameCell,
  UserRoleCell,
  UserStatusCell,
  UserCreatedCell,
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
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = React.useState<"created_at" | "first_name" | "last_name" | "role">("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const perPage = 15;

  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);

  const queryParams: ListUsersParams = {
    page,
    limit: perPage,
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, error } = useUsers(queryParams);
  const updateRoleMutation = useUpdateUserRole();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const resetPasswordMutation = useResetPassword();
  const forceSignoutMutation = useForceSignout();

  const users = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? Math.ceil(total / perPage);

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

  const handleBatchDeactivate = () => {
    const ids = Array.from(selectedIds);
    let completed = 0;
    ids.forEach((id) => {
      deactivateMutation.mutate(id, {
        onSuccess: () => {
          completed++;
          if (completed === ids.length) {
            toast.success(`${completed} user(s) deactivated`);
            setSelectedIds(new Set());
          }
        },
        onError: () => {
          completed++;
        },
      });
    });
  };

  const handleEditRole = (user: UserProfile) => {
    setSelectedUser(user);
    setEditRoleDialogOpen(true);
  };

  const handleDeactivate = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
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

  const exportColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "createdAt", label: "Created Date" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
  ];

  const exportData = users.map((u) => ({
    name: `${u.firstName} ${u.lastName}`,
    email: u.email || "",
    createdAt: u.createdAt,
    role: getRoleLabel(u.role),
    status: u.status,
  }));

  if (error) {
    return (
      <div>
        <PageHeader
          title="Users"
          breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "User management" }, { label: "Users" }]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load users.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "User management" }, { label: "Users" }]}
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              columns={exportColumns}
              data={exportData}
              title="User Management"
              filename="users-export"
              disabled={users.length === 0}
            />
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <h5 className="text-lg font-semibold">Users List</h5>
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
                    {VALID_ROLES.map((role) => (
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
                  >
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {someSelected && (
                <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/50">
                  <span className="text-sm font-medium">{selectedIds.size} selected</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDeactivate}
                    disabled={deactivateMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Deactivate Selected
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
                <div className="overflow-x-auto px-4">
                  <Table>
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
                        <TableHead className="text-right">Actions</TableHead>
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
                            <UserRoleCell role={user.role} />
                          </TableCell>
                          <TableCell>
                            <UserStatusCell status={user.status} />
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <UserActionsCell
                              user={user}
                              onEditRole={handleEditRole}
                              onDeactivate={handleDeactivate}
                              onReactivate={handleReactivate}
                              onResetPassword={handleResetPassword}
                              onForceSignout={handleForceSignout}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total} users
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <UserFormDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        mode="invite"
      />

      {selectedUser && (
        <>
          <UserFormDialog
            open={editRoleDialogOpen}
            onOpenChange={(open) => { setEditRoleDialogOpen(open); if (!open) setSelectedUser(null); }}
            mode="edit-role"
            user={selectedUser}
          />
          <DeleteUserDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setSelectedUser(null); }}
            user={selectedUser}
          />
        </>
      )}
    </div>
  );
}
