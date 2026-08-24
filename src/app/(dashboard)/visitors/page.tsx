"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Repeat,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  useVisitorsList,
  FOLLOW_UP_STATUSES,
  type ListVisitorsParams,
  type Visitor,
  type FollowUpStatus,
} from "@/hooks/use-visitors";
import { useUsers } from "@/hooks/use-users";
import { usePermissions } from "@/hooks/use-permissions";
import { VisitorFormDialog } from "@/components/visitors/visitor-form-dialog";
import { DeleteVisitorDialog } from "@/components/visitors/delete-visitor-dialog";
import { ConvertVisitorDialog } from "@/components/visitors/convert-visitor-dialog";

const STATUS_FILTER_OPTIONS: Array<{ value: FollowUpStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  ...FOLLOW_UP_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

const SORT_OPTIONS: Array<{ value: NonNullable<ListVisitorsParams["sortBy"]>; label: string }> = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "firstVisitDate", label: "First Visit" },
  { value: "followUpStatus", label: "Status" },
  { value: "createdAt", label: "Date Added" },
];

const STATUS_BADGE: Record<FollowUpStatus, { variant: "default" | "secondary" | "destructive" | "outline"; dot: string }> = {
  new: { variant: "default", dot: "bg-blue-500" },
  contacted: { variant: "outline", dot: "bg-purple-500" },
  follow_up_scheduled: { variant: "outline", dot: "bg-amber-500" },
  interested: { variant: "default", dot: "bg-green-500" },
  converted: { variant: "secondary", dot: "bg-emerald-600" },
  dropped_off: { variant: "destructive", dot: "bg-gray-400" },
};

const ACTIVE_FOLLOW_UP: FollowUpStatus[] = ["new", "contacted", "follow_up_scheduled", "interested"];

function getInitials(visitor: Pick<Visitor, "firstName" | "lastName">): string {
  const first = visitor.firstName.charAt(0);
  const last = visitor.lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

function displayName(visitor: Pick<Visitor, "firstName" | "lastName">): string {
  return `${visitor.firstName}${visitor.lastName ? ` ${visitor.lastName}` : ""}`;
}

function statusLabel(status: FollowUpStatus): string {
  return FOLLOW_UP_STATUSES.find((s) => s.value === status)?.label ?? status;
}

function FollowUpStatusCell({ status }: { status: FollowUpStatus }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.new;
  return (
    <Badge variant={badge.variant}>
      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${badge.dot}`} />
      {statusLabel(status)}
    </Badge>
  );
}

export default function VisitorsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreateVisitors = can("visitors", "create");
  const canUpdateVisitors = can("visitors", "update");
  const canDeleteVisitors = can("visitors", "delete");
  const canManage = canCreateVisitors || canUpdateVisitors || canDeleteVisitors;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<FollowUpStatus | "all">("all");
  const [sortBy, setSortBy] =
    React.useState<NonNullable<ListVisitorsParams["sortBy"]>>("firstName");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const perPage = 15;
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editVisitor, setEditVisitor] = React.useState<Visitor | null>(null);
  const [convertVisitor, setConvertVisitor] = React.useState<Visitor | null>(null);
  const [deleteTargets, setDeleteTargets] = React.useState<Visitor[] | null>(null);

  // Debounce server-side search.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: ListVisitorsParams = {
    page,
    limit: perPage,
    search: search || undefined,
    followUpStatus: statusFilter === "all" ? undefined : statusFilter,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, error } = useVisitorsList(queryParams);

  // Unfiltered fetch powers the stats cards.
  const statsQuery = useVisitorsList({ limit: 200 });

  // Assignee display names resolved client-side from profiles.
  const usersQuery = useUsers({ limit: 100, status: "active" });
  const assigneeNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersQuery.data?.data ?? []) {
      map.set(u.profileId, `${u.firstName} ${u.lastName}`);
    }
    return map;
  }, [usersQuery.data]);

  const visitors = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const stats = React.useMemo(() => {
    const rows = statsQuery.data?.data ?? [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      total: statsQuery.data?.meta.total ?? 0,
      newThisMonth: rows.filter((v) => new Date(v.firstVisitDate) >= monthStart).length,
      inFollowUp: rows.filter(
        (v) => !v.convertedMemberId && ACTIVE_FOLLOW_UP.includes(v.followUpStatus)
      ).length,
      converted: rows.filter((v) => !!v.convertedMemberId || v.followUpStatus === "converted")
        .length,
    };
  }, [statsQuery.data]);

  const allSelected =
    visitors.length > 0 && visitors.every((v) => selectedIds.has(v.id));
  const someSelected = visitors.some((v) => selectedIds.has(v.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(visitors.map((v) => v.id)) : new Set());
  };

  const handleSelectRow = (visitorId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(visitorId);
      else next.delete(visitorId);
      return next;
    });
  };

  const handleRowClick = (visitorId: string) => {
    router.push(`/visitors/${visitorId}`);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as typeof sortBy);
    setPage(1);
  };

  const selectedVisitors = visitors.filter((v) => selectedIds.has(v.id));

  const exportColumns = [
    { key: "name", label: "Full Name" },
    { key: "gender", label: "Gender" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "whatsappNumber", label: "WhatsApp" },
    { key: "firstVisitDate", label: "First Visit" },
    { key: "status", label: "Follow-up Status" },
    { key: "assignedTo", label: "Assigned To" },
    { key: "converted", label: "Converted" },
  ];

  const exportSource = someSelected ? selectedVisitors : visitors;
  const exportData = exportSource.map((v) => ({
    name: displayName(v),
    gender: v.gender || "",
    email: v.email || "",
    phone: v.phone || "",
    whatsappNumber: v.whatsappNumber || "",
    firstVisitDate: format(new Date(v.firstVisitDate), "yyyy-MM-dd"),
    status: statusLabel(v.followUpStatus),
    assignedTo: v.assignedToId ? assigneeNames.get(v.assignedToId) || "" : "",
    converted: v.convertedMemberId ? "Yes" : "No",
  }));

  if (error) {
    return (
      <div>
        <PageHeader
          title="Visitors"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Visitors" }]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load visitors.</p>
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
        title="Visitors"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Visitors" }]}
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              columns={exportColumns}
              data={exportData}
              title={
                someSelected ? `Visitors (${selectedVisitors.length} selected)` : "Visitors"
              }
              filename="visitors-export"
              disabled={exportSource.length === 0}
            />
            {canCreateVisitors && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Add
                </Button>
                <Button onClick={() => router.push("/visitors/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Visitor
                </Button>
              </div>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Visitors"
          value={stats.total}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatsCard
          title="New This Month"
          value={stats.newThisMonth}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatsCard
          title="In Follow-Up"
          value={stats.inFollowUp}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatsCard
          title="Converted"
          value={stats.converted}
          icon={<Repeat className="h-4 w-4" />}
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
                setStatusFilter(v as FollowUpStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {someSelected && canDeleteVisitors && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/50">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTargets(selectedVisitors)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Selected
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
          ) : visitors.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<UserPlus className="h-12 w-12" />}
                title="No visitors found"
                description={
                  search || statusFilter !== "all"
                    ? "Try adjusting your filters."
                    : canCreateVisitors
                      ? "Add your first visitor to get started."
                      : "No visitors have been registered yet."
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
                        aria-label="Select all visitors"
                      />
                    </TableHead>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>First Visit</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.map((visitor) => (
                    <TableRow
                      key={visitor.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(visitor.id)}
                    >
                      <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(visitor.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(visitor.id, !!checked)
                          }
                          aria-label={`Select ${displayName(visitor)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            <AvatarFallback>{getInitials(visitor)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate flex items-center gap-2">
                              {displayName(visitor)}
                              {(visitor.convertedMemberId ||
                                visitor.followUpStatus === "converted") && (
                                <Badge variant="secondary">Converted</Badge>
                              )}
                            </p>
                            {visitor.email && (
                              <p className="text-xs text-muted-foreground truncate">
                                {visitor.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {visitor.phone || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(visitor.firstVisitDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {visitor.assignedToId
                          ? assigneeNames.get(visitor.assignedToId) || "-"
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <FollowUpStatusCell status={visitor.followUpStatus} />
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRowClick(visitor.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {!visitor.convertedMemberId && (
                                <>
                                  {canUpdateVisitors && (
                                    <>
                                      <DropdownMenuItem onClick={() => setEditVisitor(visitor)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Visitor
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setConvertVisitor(visitor)}>
                                        <Repeat className="mr-2 h-4 w-4" />
                                        Convert to Member
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                              {canDeleteVisitors && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTargets([visitor])}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
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
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} visitors
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
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

      <VisitorFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <VisitorFormDialog
        open={!!editVisitor}
        onOpenChange={(open) => !open && setEditVisitor(null)}
        visitor={editVisitor}
      />
      <ConvertVisitorDialog
        open={!!convertVisitor}
        onOpenChange={(open) => !open && setConvertVisitor(null)}
        visitor={convertVisitor!}
      />
      <DeleteVisitorDialog
        open={!!deleteTargets}
        onOpenChange={(open) => !open && setDeleteTargets(null)}
        visitors={deleteTargets ?? []}
        onDeleted={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
