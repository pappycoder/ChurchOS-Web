"use client";

import * as React from "react";
import { HandCoins } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/shared/page-header";
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
import { AssetDetailDrawer } from "@/components/assets/asset-detail-drawer";
import { LoanFormDialog } from "@/components/assets/loan-form-dialog";
import { ReturnLoanDialog } from "@/components/assets/return-loan-dialog";
import { StatusBadge } from "@/components/assets/status-badge";
import {
  formatCurrency,
  useAssetLoans,
  useAssetsList,
  type Asset,
  type AssetsListParams,
} from "@/hooks/use-assets";

export default function AssetLoansPage() {
  const { can } = usePermissions();
  const canLoan = can("assets", "create") || can("assets", "update");

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [detailAsset, setDetailAsset] = React.useState<Asset | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [loanOutOpen, setLoanOutOpen] = React.useState(false);
  const [returnLoanId, setReturnLoanId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: AssetsListParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      search: search || undefined,
    }),
    [page, perPage, search]
  );

  const { data, isLoading } = useAssetsList(queryParams);
  const assets = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const loansQuery = useAssetLoans(drawerOpen && detailAsset ? detailAsset.id : undefined);

  const activeLoan = (loansQuery.data ?? []).find(
    (loan) => loan.status === "borrowed" || loan.status === "overdue"
  );

  const openDetail = (asset: Asset) => {
    setDetailAsset(asset);
    setDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Asset Loans"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Operations", href: "/assets" },
          { label: "Loans" },
        ]}
      />

      <TableCard
        title={
          <span className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Loan Management
          </span>
        }
        itemName="assets"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
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
              placeholder="Search assets..."
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    {search ? "No assets match your search." : "No assets registered yet."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id} className="cursor-pointer">
                  <TableCell onClick={() => openDetail(asset)}>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{asset.assetTag}</p>
                  </TableCell>
                  <TableCell onClick={() => openDetail(asset)}>
                    <StatusBadge kind="condition" value={asset.condition} />
                  </TableCell>
                  <TableCell onClick={() => openDetail(asset)}>
                    <StatusBadge kind="status" value={asset.status} />
                  </TableCell>
                  <TableCell className="text-right" onClick={() => openDetail(asset)}>
                    {formatCurrency(asset.currentValue ?? asset.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canLoan && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDetailAsset(asset);
                          setLoanOutOpen(true);
                        }}
                      >
                        <HandCoins className="h-3.5 w-3.5 mr-1" />
                        Loan Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

      <AssetDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        assetId={detailAsset?.id ?? ""}
      >
        {canLoan && detailAsset && (
          <div className="flex flex-col gap-2">
            <Button onClick={() => setLoanOutOpen(true)}>
              <HandCoins className="h-4 w-4 mr-2" />
              Loan Out
            </Button>
            {activeLoan && (
              <Button variant="outline" onClick={() => setReturnLoanId(activeLoan.id)}>
                Record Return
              </Button>
            )}
          </div>
        )}
      </AssetDetailDrawer>

      <LoanFormDialog
        open={loanOutOpen}
        onOpenChange={setLoanOutOpen}
        assetId={detailAsset?.id ?? ""}
      />
      <ReturnLoanDialog
        open={!!returnLoanId}
        onOpenChange={(open) => {
          if (!open) setReturnLoanId(null);
        }}
        assetId={detailAsset?.id ?? ""}
        loanId={returnLoanId ?? ""}
        assetName={detailAsset?.name ?? ""}
      />
    </div>
  );
}