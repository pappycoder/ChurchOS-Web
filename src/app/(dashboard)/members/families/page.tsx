"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Plus,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useFamiliesList,
  type Family,
  type ListFamiliesParams,
} from "@/hooks/use-families";
import { usePermissions } from "@/hooks/use-permissions";
import { FamilyFormDialog } from "@/components/families/family-form-dialog";
import { DeleteFamilyDialog } from "@/components/families/delete-family-dialog";

const STATS_FETCH_LIMIT = 200;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export default function FamiliesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreateFamilies = can("families", "create");
  const canUpdateFamilies = can("families", "update");
  const canDeleteFamilies = can("families", "delete");
  const canManage = canCreateFamilies || canUpdateFamilies || canDeleteFamilies;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 15;
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editFamily, setEditFamily] = React.useState<Family | null>(null);
  const [deleteTargets, setDeleteTargets] = React.useState<Family[] | null>(null);

  // Debounce server-side search.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: ListFamiliesParams = {
    page,
    limit: perPage,
    search: search || undefined,
  };

  const { data, isLoading, error } = useFamiliesList(queryParams);

  // Unfiltered queries power the stats cards.
  const totalsQuery = useFamiliesList({ limit: 1 });
  const statsQuery = useFamiliesList({ limit: STATS_FETCH_LIMIT });

  const stats = React.useMemo(() => {
    const rows = statsQuery.data?.data ?? [];
    const withHead = rows.filter((f) => f.headId).length;
    const membersLinked = rows.reduce((sum, f) => sum + f.members.length, 0);
    return { withHead, membersLinked };
  }, [statsQuery.data]);

  const families = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const allSelected =
    families.length > 0 && families.every((f) => selectedIds.has(f.familyId));
  const someSelected = families.some((f) => selectedIds.has(f.familyId));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(families.map((f) => f.familyId)) : new Set());
  };

  const handleSelectRow = (familyId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(familyId);
      else next.delete(familyId);
      return next;
    });
  };

  const handleRowClick = (familyId: string) => {
    router.push(`/members/families/${familyId}`);
  };

  const headOfFamily = (family: Family): string => {
    const head = family.members.find((m) => m.isHead);
    return head ? `${head.firstName} ${head.lastName}` : "-";
  };

  const selectedFamilies = families.filter((f) => selectedIds.has(f.familyId));

  const exportColumns = [
    { key: "name", label: "Family Name" },
    { key: "head", label: "Head of Family" },
    { key: "memberCount", label: "Members" },
    { key: "memberNames", label: "Member Names" },
    { key: "createdAt", label: "Created" },
  ];

  const exportSource = someSelected ? selectedFamilies : families;
  const exportData = exportSource.map((f) => ({
    name: f.name,
    head: headOfFamily(f),
    memberCount: String(f.members.length),
    memberNames: f.members.map((m) => `${m.firstName} ${m.lastName}`).join("; "),
    createdAt: format(new Date(f.createdAt), "yyyy-MM-dd"),
  }));

  if (error) {
    return (
      <div>
        <PageHeader
          title="Families"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Members", href: "/members" },
            { label: "Families" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load families.</p>
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
        title="Families"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Members", href: "/members" },
          { label: "Families" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              columns={exportColumns}
              data={exportData}
              title={someSelected ? `Families (${selectedFamilies.length} selected)` : "Families"}
              filename="families-export"
              disabled={exportSource.length === 0}
            />
            {canCreateFamilies && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Family
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Families"
          value={totalsQuery.data?.meta.total ?? 0}
          icon={<Home className="h-4 w-4" />}
        />
        <StatsCard
          title="With Head of Family"
          value={stats.withHead}
          icon={<Home className="h-4 w-4" />}
        />
        <StatsCard
          title="Members Linked"
          value={stats.membersLinked}
          icon={<Home className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={searchInput}
            onChange={(v) => {
              setSearchInput(v);
            }}
            placeholder="Search family name..."
            className="w-full sm:w-64"
          />
        </CardHeader>
        <CardContent className="p-0">
          {someSelected && canDeleteFamilies && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/50">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTargets(selectedFamilies)}
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
          ) : families.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Home className="h-12 w-12" />}
                title="No families found"
                description={
                  search
                    ? "Try adjusting your search."
                    : canCreateFamilies
                      ? "Add your first family to get started."
                      : "No families have been added yet."
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
                        aria-label="Select all families"
                      />
                    </TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Head of Family</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {families.map((family) => (
                    <TableRow
                      key={family.familyId}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(family.familyId)}
                    >
                      <TableCell
                        className="w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(family.familyId)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(family.familyId, !!checked)
                          }
                          aria-label={`Select ${family.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            <AvatarFallback>{getInitials(family.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate">{family.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {headOfFamily(family)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{family.members.length}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(family.createdAt), "MMM d, yyyy")}
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
                              <DropdownMenuItem onClick={() => handleRowClick(family.familyId)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {canUpdateFamilies && (
                                <DropdownMenuItem onClick={() => setEditFamily(family)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Family
                                </DropdownMenuItem>
                              )}
                              {canDeleteFamilies && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTargets([family])}
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
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} families
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

      <FamilyFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <FamilyFormDialog
        open={!!editFamily}
        onOpenChange={(open) => !open && setEditFamily(null)}
        family={editFamily}
      />
      <DeleteFamilyDialog
        open={!!deleteTargets}
        onOpenChange={(open) => !open && setDeleteTargets(null)}
        families={deleteTargets ?? []}
        onDeleted={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
