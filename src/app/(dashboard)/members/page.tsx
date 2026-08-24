"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
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
  useMembersList,
  useRestoreMember,
  type ListMembersParams,
  type Member,
  type MemberStatus,
} from "@/hooks/use-members";
import { useBranchesList } from "@/hooks/use-branches";
import { usePermissions } from "@/hooks/use-permissions";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog";

const STATUS_OPTIONS: Array<{ value: MemberStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "transferred", label: "Transferred" },
];

const SORT_OPTIONS: Array<{ value: NonNullable<ListMembersParams["sortBy"]>; label: string }> = [
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "member_since", label: "Member Since" },
  { value: "status", label: "Status" },
  { value: "created_at", label: "Date Added" },
];

const STATUS_BADGE: Record<MemberStatus, { variant: "default" | "secondary" | "destructive" | "outline"; dot: string }> = {
  active: { variant: "default", dot: "bg-green-500" },
  inactive: { variant: "secondary", dot: "bg-gray-400" },
  suspended: { variant: "destructive", dot: "bg-red-500" },
  transferred: { variant: "outline", dot: "bg-blue-500" },
};

function getInitials(member: Pick<Member, "firstName" | "lastName">): string {
  return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
}

function MemberStatusCell({ status }: { status: MemberStatus }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.inactive;
  return (
    <Badge variant={badge.variant}>
      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${badge.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function MembersPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreateMembers = can("members", "create");
  const canUpdateMembers = can("members", "update");
  const canDeleteMembers = can("members", "delete");
  const canManage = canCreateMembers || canUpdateMembers || canDeleteMembers;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<MemberStatus | "all">("all");
  const [branchFilter, setBranchFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<NonNullable<ListMembersParams["sortBy"]>>("first_name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const perPage = 15;
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editMember, setEditMember] = React.useState<Member | null>(null);
  const [deleteTargets, setDeleteTargets] = React.useState<Member[] | null>(null);

  // Debounce server-side search.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: ListMembersParams = {
    page,
    limit: perPage,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    branchId: branchFilter === "all" ? undefined : branchFilter,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, error } = useMembersList(queryParams);
  const restoreMutation = useRestoreMember();

  // Unfiltered + active-only count queries power the stats cards.
  const totalsQuery = useMembersList({ limit: 1 });
  const activeQuery = useMembersList({ limit: 1, status: "active" });

  const branchesQuery = useBranchesList({ limit: 100 });
  const branchNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const b of branchesQuery.data?.data ?? []) map.set(b.branchId, b.name);
    return map;
  }, [branchesQuery.data]);

  const members = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const allSelected =
    members.length > 0 && members.every((m) => selectedIds.has(m.memberId));
  const someSelected = members.some((m) => selectedIds.has(m.memberId));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(members.map((m) => m.memberId)) : new Set());
  };

  const handleSelectRow = (memberId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  };

  const handleRowClick = (memberId: string) => {
    router.push(`/members/${memberId}`);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as typeof sortBy);
    setPage(1);
  };

  const selectedMembers = members.filter((m) => selectedIds.has(m.memberId));

  const exportColumns = [
    { key: "name", label: "Full Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "whatsappNumber", label: "WhatsApp" },
    { key: "gender", label: "Gender" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "branch", label: "Branch" },
    { key: "status", label: "Status" },
    { key: "memberSince", label: "Member Since" },
  ];

  const exportSource = someSelected ? selectedMembers : members;
  const exportData = exportSource.map((m) => ({
    name: `${m.firstName} ${m.lastName}`,
    email: m.email || "",
    phone: m.phone || "",
    whatsappNumber: m.whatsappNumber || "",
    gender: m.gender || "",
    address: m.address || "",
    city: m.city || "",
    state: m.state || "",
    branch: m.branchId ? branchNames.get(m.branchId) || "" : "",
    status: m.status,
    memberSince: m.memberSince,
  }));

  if (error) {
    return (
      <div>
        <PageHeader
          title="Members"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Members" }]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load members.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Members"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Members" }]}
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              columns={exportColumns}
              data={exportData}
              title={someSelected ? `Members (${selectedMembers.length} selected)` : "Members"}
              filename="members-export"
              disabled={exportSource.length === 0}
            />
            {canCreateMembers && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Members"
          value={totalsQuery.data?.meta.total ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Active"
          value={activeQuery.data?.meta.total ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Other Statuses"
          value={
            (totalsQuery.data?.meta.total ?? 0) - (activeQuery.data?.meta.total ?? 0)
          }
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={searchInput}
              onChange={(v) => {
                setSearchInput(v);
              }}
              placeholder="Search name, email, phone..."
              className="w-full sm:w-64"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as MemberStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={branchFilter}
              onValueChange={(v) => {
                setBranchFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {(branchesQuery.data?.data ?? []).map((b) => (
                  <SelectItem key={b.branchId} value={b.branchId}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Select value={sortBy} onValueChange={handleSortChange}>
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
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {someSelected && canDeleteMembers && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/50">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTargets(selectedMembers)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Deactivate Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No members found"
                description={
                  search || statusFilter !== "all" || branchFilter !== "all"
                    ? "Try adjusting your filters."
                    : canCreateMembers
                      ? "Add your first member to get started."
                      : "No members have been added yet."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all members"
                      />
                    </TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow
                      key={member.memberId}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(member.memberId)}
                    >
                      <TableCell
                        className="w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(member.memberId)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(member.memberId, !!checked)
                          }
                          aria-label={`Select ${member.firstName} ${member.lastName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            {member.photoUrl && (
                              <AvatarImage src={member.photoUrl} alt={`${member.firstName} ${member.lastName}`} />
                            )}
                            <AvatarFallback>{getInitials(member)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {member.firstName} {member.lastName}
                            </p>
                            {member.email && (
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.phone || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.branchId ? branchNames.get(member.branchId) || "-" : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.memberSince), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <MemberStatusCell status={member.status} />
                      </TableCell>
                      {canManage && (
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRowClick(member.memberId)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {canUpdateMembers && (
                                <>
                                  <DropdownMenuItem onClick={() => setEditMember(member)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Member
                                  </DropdownMenuItem>
                                  {member.status !== "active" && (
                                    <DropdownMenuItem
                                      disabled={restoreMutation.isPending}
                                      onClick={() =>
                                        restoreMutation.mutate(member.memberId, {
                                          onSuccess: () => {
                                            setSelectedIds((prev) => {
                                              const next = new Set(prev);
                                              next.delete(member.memberId);
                                              return next;
                                            });
                                          },
                                        })
                                      }
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Restore to Active
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {canDeleteMembers && member.status !== "inactive" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTargets([member])}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} members
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <MemberFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <MemberFormDialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
        member={editMember}
      />
      <DeleteMemberDialog
        open={!!deleteTargets}
        onOpenChange={(open) => !open && setDeleteTargets(null)}
        members={deleteTargets ?? []}
        onDeleted={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
