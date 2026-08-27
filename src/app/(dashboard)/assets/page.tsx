"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { format } from "date-fns";
import { Boxes, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { SearchInput } from "@/components/shared/search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteDialog } from "@/components/pastoral/confirm-delete-dialog";
import { toast } from "sonner";
import { AssetFormDialog } from "@/components/assets/asset-form-dialog";
import { AssetDetailDrawer } from "@/components/assets/asset-detail-drawer";
import { StatusBadge } from "@/components/assets/status-badge";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import { exportCSV } from "@/lib/export-utils";
import { useBranchesList } from "@/hooks/use-branches";
import {
  formatCurrency,
  useAssetCategories,
  useAssetsList,
  useDeleteAsset,
  type Asset,
  type AssetCondition,
  type AssetsListParams,
  type AssetStatus,
} from "@/hooks/use-assets";

const STATUS_OPTIONS = [
  "active",
  "maintenance",
  "retired",
  "lost",
  "disposed",
] as const;
const CONDITION_OPTIONS = ["new", "good", "fair", "poor", "damaged"] as const;

export default function AssetsPage() {
  const { can } = usePermissions();
  const canCreate = can("assets", "create");
  const canUpdate = can("assets", "update");
  const canDelete = can("assets", "delete");

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<AssetStatus | "all">("all");
  const [conditionFilter, setConditionFilter] = React.useState<AssetCondition | "all">("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [branchFilter, setBranchFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editAsset, setEditAsset] = React.useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = React.useState<Asset | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: AssetsListParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      condition: conditionFilter === "all" ? undefined : conditionFilter,
      categoryId: categoryFilter === "all" ? undefined : categoryFilter,
      branchId: branchFilter === "all" ? undefined : branchFilter,
    }),
    [page, perPage, search, statusFilter, conditionFilter, categoryFilter, branchFilter]
  );

  const { data, isLoading, error } = useAssetsList(queryParams);
  const deleteMutation = useDeleteAsset();

  const categoriesQuery = useAssetCategories();
  const branchesQuery = useBranchesList({ limit: 100 });

  const assets = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const statsQuery = useQuery({
    queryKey: ["assets-list", "all"],
    queryFn: () =>
      fetchAllPages(
        (p) =>
          api.get<{ data: Asset[]; meta: { total: number } }>(
            listUrl("/assets", { page: p, limit: 100 })
          ),
        { perRequest: 100 }
      ),
    staleTime: 60 * 1000,
  });

  const techStats = React.useMemo(() => {
    const all = statsQuery.data ?? [];
    let purchaseValue = 0;
    let currentValue = 0;
    for (const asset of all) {
      purchaseValue += asset.purchasePrice ?? 0;
      currentValue += asset.currentValue ?? asset.purchasePrice ?? 0;
    }
    return { total: all.length, purchaseValue, currentValue };
  }, [statsQuery.data]);

  const openDetail = (asset: Asset) => {
    setDetailAsset(asset);
    setDrawerOpen(true);
  };

  const handleExport = () => {
    const rows = assets.map((a) => ({
      tag: a.assetTag,
      name: a.name,
      category: a.categoryName ?? "",
      brand: a.brand ?? "",
      model: a.model ?? "",
      serial: a.serialNumber ?? "",
      condition: a.condition,
      status: a.status,
      value: a.currentValue ?? a.purchasePrice ?? "",
      custodian: a.custodianName ?? "",
      branch: a.branchName ?? "",
      location: a.location ?? "",
      purchaseDate: a.purchaseDate ?? "",
    }));
    exportCSV(
      rows,
      [
        { key: "tag", label: "Asset Tag" },
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "brand", label: "Brand" },
        { key: "model", label: "Model" },
        { key: "serial", label: "Serial" },
        { key: "condition", label: "Condition" },
        { key: "status", label: "Status" },
        { key: "value", label: "Current Value" },
        { key: "custodian", label: "Custodian" },
        { key: "branch", label: "Branch" },
        { key: "location", label: "Location" },
        { key: "purchaseDate", label: "Purchase Date" },
      ],
      `assets-${format(new Date(), "yyyyMMdd")}`
    );
  };

  const canReadActions = canUpdate || canDelete;

  return (
    <div>
      <PageHeader
        title="Asset Register"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Operations", href: "/assets" },
          { label: "Assets" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={assets.length === 0}>
              Export CSV
            </Button>
            {canCreate && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register Asset
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatsCard
          title="Total Assets"
          value={statsQuery.isLoading ? "..." : techStats.total}
          icon={<Boxes className="h-4 w-4" />}
        />
        <StatsCard
          title="Purchase Value"
          value={statsQuery.isLoading ? "..." : formatCurrency(techStats.purchaseValue)}
          icon={<Boxes className="h-4 w-4" />}
        />
        <StatsCard
          title="Current Value"
          value={statsQuery.isLoading ? "..." : formatCurrency(techStats.currentValue)}
          icon={<Boxes className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search name, tag, serial..."
              className="sm:w-72"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as AssetStatus | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={conditionFilter}
                onValueChange={(v) => {
                  setConditionFilter(v as AssetCondition | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  {CONDITION_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c[0].toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[170px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(categoriesQuery.data ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
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
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Branch" />
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
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-destructive">Failed to load assets.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead>Custodian</TableHead>
                    {canReadActions && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={canReadActions ? 7 : 6}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : assets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canReadActions ? 7 : 6} className="h-32 text-center">
                        <p className="text-muted-foreground">
                          {search || statusFilter !== "all" || conditionFilter !== "all"
                            ? "No assets match your filters."
                            : "No assets registered yet."}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.map((asset) => (
                      <TableRow key={asset.id} className="cursor-pointer">
                        <TableCell onClick={() => openDetail(asset)}>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {asset.assetTag}
                            {asset.serialNumber ? ` · ${asset.serialNumber}` : ""}
                          </p>
                        </TableCell>
                        <TableCell onClick={() => openDetail(asset)}>
                          {asset.categoryName ?? "—"}
                        </TableCell>
                        <TableCell onClick={() => openDetail(asset)}>
                          <StatusBadge kind="condition" value={asset.condition} />
                        </TableCell>
                        <TableCell onClick={() => openDetail(asset)}>
                          <StatusBadge kind="status" value={asset.status} />
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={() => openDetail(asset)}
                        >
                          {formatCurrency(asset.currentValue ?? asset.purchasePrice)}
                        </TableCell>
                        <TableCell onClick={() => openDetail(asset)}>
                          {asset.custodianName ?? "—"}
                        </TableCell>
                        {canReadActions && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                title="View"
                                onClick={() => openDetail(asset)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canUpdate && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Edit"
                                  onClick={() => setEditAsset(asset)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Delete"
                                  onClick={() => setDeleteTarget(asset)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && (
            <TablePagination
              page={page}
              perPage={perPage}
              total={meta.total}
              itemName="assets"
              onPageChange={setPage}
              onPerPageChange={(size) => {
                setPerPage(size);
                setPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      <AssetFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSaved={(saved) => openDetail(saved)}
      />
      <AssetFormDialog
        open={!!editAsset}
        onOpenChange={(open) => {
          if (!open) setEditAsset(null);
        }}
        asset={editAsset}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Asset"
        description={`This will permanently delete "${deleteTarget?.name}" from the asset register.`}
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Asset deleted successfully");
              setDeleteTarget(null);
            },
            onError: (err) => {
              toast.error("Failed to delete asset", {
                description: err?.message || "Please try again.",
              });
            },
          });
        }}
      />
      <AssetDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        assetId={detailAsset?.id ?? ""}
      />
    </div>
  );
}