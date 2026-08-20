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
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
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
  UserActionsCell,
  UserNameCell,
  UserRoleCell,
  UserStatusCell,
  UserCreatedCell,
} from "@/components/users/user-columns";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";

const STATUS_OPTIONS = ["all", "active", "inactive"] as const;
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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
  const inviteMutation = useInviteUser();
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
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "email", label: "Email" },
    { key: "createdAt", label: "Joined" },
  ];

  const exportData = users.map((u) => ({
    name: `${u.firstName} ${u.lastName}`,
    phone: u.phone || "",
    role: getRoleLabel(u.role),
    status: u.status,
    email: u.email || "",
    createdAt: u.createdAt,
  }));

  if (error) {
    return (
      <div>
        <PageHeader
          title="User Management"
          breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
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
        title="User Management"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
        action={
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
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

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
              className="w-full sm:w-64"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {VALID_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v as typeof sortBy); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-36">
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
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
            <ExportDropdown
              columns={exportColumns}
              data={exportData}
              title="User Management"
              filename="users-export"
              disabled={users.length === 0}
            />
          </div>

          {users.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No users found"
              description={search || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "Invite your first user to get started."}
            />
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.profileId}>
                      <TableCell>
                        <Link href={`/admin/users/${user.profileId}`} className="hover:underline">
                          <UserNameCell user={user} />
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.phone || "-"}</TableCell>
                      <TableCell><UserRoleCell role={user.role} /></TableCell>
                      <TableCell><UserStatusCell status={user.status} /></TableCell>
                      <TableCell><UserCreatedCell createdAt={user.createdAt} /></TableCell>
                      <TableCell className="text-right">
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
