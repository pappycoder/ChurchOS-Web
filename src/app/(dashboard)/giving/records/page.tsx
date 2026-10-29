"use client";

import { givingExportColumns, givingExportRows } from "@/lib/giving-export";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { getToastErrorMessage, toast } from "@/lib/toast";
import { MoreVertical, Plus, Receipt, SendHorizonal } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  GivingWorkspace,
  GivingHeader,
  GivingStatusBadge,
  GivingMoreFilters,
  givingWorkspaceClass,
  givingMoney,
} from "@/components/giving/giving-presentation";
import { EmptyState } from "@/components/shared/empty-state";
import { TableCard } from "@/components/shared/table-card";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGivingTransactions,
  useGivingCategories,
  useSendReceipt,
  type GivingTransaction,
} from "@/hooks/use-giving";
import { useAttendanceServices } from "@/hooks/use-attendance";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import { usePermissions } from "@/hooks/use-permissions";
import { RecordCashDialog } from "@/components/giving/record-cash-dialog";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";

export default function GivingRecordsPage() {
  const { can } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const isAdminHq = !!profile?.isAdminHq;
  const [branchId, setBranchId] = React.useState("");
  const effectiveBranchId = isAdminHq ? branchId : (profile?.branchId ?? "");
  const branchesQuery = useBranchesList({ limit: 100 }, { enabled: isAdminHq });
  const canCreate = can("giving:records", "create");
  const canEmailReceipt = profile?.planFeatures?.includes("email") === true;
  const canWhatsAppReceipt = false; // PDF media delivery is not implemented; downloads/email remain available.

  // Filters
  const [categoryId, setCategoryId] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [serviceId, setServiceId] = React.useState("all");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const categoriesQuery = useGivingCategories({ limit: 100 });
  const servicesQuery = useAttendanceServices({
    limit: 100,
    branchId: effectiveBranchId || undefined,
  });

  const queryParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      categoryId: categoryId === "all" ? undefined : categoryId,
      status: status === "all" ? undefined : status,
      type: type === "all" ? undefined : type,
      serviceId: serviceId === "all" ? undefined : serviceId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      branchId: effectiveBranchId || undefined,
      sortBy: "giving_date" as const,
      sortOrder: "desc" as const,
    }),
    [
      page,
      perPage,
      categoryId,
      status,
      type,
      serviceId,
      startDate,
      endDate,
      effectiveBranchId,
    ],
  );

  const { data, isLoading, error } = useGivingTransactions(queryParams);
  const transactions = data?.data ?? [];
  const meta = data?.meta;

  const [recordOpen, setRecordOpen] = React.useState(false);
  const [receiptTarget, setReceiptTarget] =
    React.useState<GivingTransaction | null>(null);
  const sendReceiptMutation = useSendReceipt(
    receiptTarget?.transactionId ?? "",
  );

  const linkedName = (tx: GivingTransaction): string =>
    tx.title ||
    tx.cellGroupName ||
    tx.memberName ||
    tx.serviceName ||
    tx.eventName ||
    "General";

  const linkedKind = (tx: GivingTransaction): string =>
    tx.cellGroupId
      ? "Cell Group Giving"
      : tx.memberId
        ? "Member"
        : tx.serviceId
          ? "Service"
          : tx.eventId
            ? "Event"
            : "General";

  const buildExportRows = givingExportRows;
  const exportData = buildExportRows(transactions);

  // Export walks every page of the current filter set server-side.
  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<GivingTransaction>((p) =>
      api.get(
        listUrl("/giving/transactions", {
          ...queryParams,
          page: p,
          limit: 100,
        }),
      ),
    );
    return buildExportRows(rows);
  }, [queryParams, buildExportRows]);

  const downloadReceipt = async (tx: GivingTransaction) => {
    try {
      const blob = await api.getBlob(
        `/giving/transactions/${tx.transactionId}/receipt`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${(tx.receiptNumber || tx.transactionId).replace(/[^a-zA-Z0-9_.-]+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download receipt", {
        description: getToastErrorMessage(error, "Please try again."),
      });
    }
  };

  const handleSendReceipt = async (channel: "whatsapp" | "email") => {
    if (!receiptTarget) return;
    try {
      const result = await sendReceiptMutation.mutateAsync(channel);
      toast.success(result.message || `Receipt sent via ${channel}`);
      setReceiptTarget(null);
    } catch (err) {
      toast.error("Failed to send receipt", {
        description: getToastErrorMessage(err, "Please try again."),
      });
      setReceiptTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <GivingHeader
          title="Records"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Giving", href: "/giving" },
            { label: "Records" },
          ]}
        />
        <ErrorState title="Failed to load giving records." />
      </div>
    );
  }

  return (
    <GivingWorkspace>
      <GivingHeader
        title="Records"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Giving", href: "/giving" },
          { label: "Records" },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => setRecordOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Giving
              </Button>
            )}
          </div>
        }
      />

      <TableCard
        title="Giving Records"
        itemName="records"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        toolbar={
          <div
            role="group"
            aria-label="Collection filters"
            className="flex flex-wrap items-end gap-3"
          >
            {isAdminHq ? (
              <Select
                value={branchId || "all"}
                onValueChange={(v) => {
                  setBranchId(v === "all" ? "" : v);
                  setServiceId("all");
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="w-full sm:w-44"
                  aria-label="Branch filter"
                >
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {(branchesQuery.data?.data ?? []).map((branch) => (
                    <SelectItem key={branch.branchId} value={branch.branchId}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={profile?.branchId ?? "__no_branch__"} disabled>
                <SelectTrigger
                  className="w-full sm:w-44"
                  aria-label="Branch filter locked to your branch"
                >
                  <SelectValue
                    placeholder={profile?.branch?.name ?? "Your branch"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={profile?.branchId ?? "__no_branch__"}>
                    {profile?.branch?.name ?? "Your branch"}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="w-full sm:w-36"
                aria-label="Giving status filter"
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-36 sm:w-40"
                aria-label="From date"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-36 sm:w-40"
                aria-label="To date"
              />
            </div>
            <GivingMoreFilters
              count={
                Number(categoryId !== "all") +
                Number(type !== "all") +
                Number(serviceId !== "all")
              }
            >
              {can("giving:categories", "read") && (
                <Select
                  value={categoryId}
                  onValueChange={(v) => {
                    setCategoryId(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className="w-full sm:w-44"
                    aria-label="Giving category filter"
                  >
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(categoriesQuery.data?.data ?? []).map((c) => (
                      <SelectItem key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="w-full sm:w-40"
                  aria-label="Giving method filter"
                >
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              {can("attendance:services", "read") && (
                <Select
                  value={serviceId}
                  onValueChange={(v) => {
                    setServiceId(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className="w-full sm:w-48"
                    aria-label="Giving service filter"
                  >
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {(servicesQuery.data?.data ?? []).map((s) => (
                      <SelectItem key={s.serviceId} value={s.serviceId}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBranchId("");
                  setCategoryId("all");
                  setStatus("all");
                  setType("all");
                  setServiceId("all");
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </GivingMoreFilters>
          </div>
        }
        exportAction={
          <ExportDropdown
            tableId="giving-records"
            columns={givingExportColumns}
            data={exportData}
            fetchAllRows={fetchAllExportRows}
            title="Giving Records"
            filename="giving-records"
            disabled={exportData.length === 0}
          />
        }
      >
        {isLoading ? (
          <LoadingState variant="table" />
        ) : transactions.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title="No giving records"
              description={
                categoryId !== "all" ||
                status !== "all" ||
                type !== "all" ||
                serviceId !== "all" ||
                startDate ||
                endDate
                  ? "Try adjusting your filters."
                  : canCreate
                    ? "Record the first gift to get started."
                    : "No transactions have been recorded yet."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto px-4">
            <Table exportable={false} tableId="giving-records">
              <TableHeader>
                <TableRow>
                  <TableHead exportKeys={["date", "recordedAt"]}>
                    Date
                  </TableHead>
                  <TableHead
                    exportKeys={[
                      "name",
                      "linkType",
                      "linkedTo",
                      "description",
                      "meetingDate",
                      "branch",
                    ]}
                  >
                    Name / Linked To
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead exportKeys={["amount", "currency"]}>
                    Amount
                  </TableHead>
                  <TableHead exportKeys={["method", "gateway"]}>
                    Method
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    exportKeys={[
                      "receiptNumber",
                      "paymentReference",
                      "transactionId",
                    ]}
                  >
                    Receipt #
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.transactionId}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(
                        parseISO(tx.givingDate ?? tx.createdAt),
                        "MMM d, yyyy",
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[180px]">
                          {linkedName(tx)}
                        </p>
                        <Badge variant="outline" className="mt-0.5">
                          {linkedKind(tx)}
                        </Badge>
                        {tx.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tx.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tx.categoryName}
                      {tx.cellGroupName && (
                        <p className="text-xs text-muted-foreground">
                          {tx.cellGroupName} · {tx.cellGroupMeetingDate}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">
                      {givingMoney(tx.currency, tx.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {tx.type.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <GivingStatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {tx.receiptNumber || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.status === "success" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Receipt actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => void downloadReceipt(tx)}
                            >
                              <Receipt className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            {(canEmailReceipt || canWhatsAppReceipt) && (
                              <DropdownMenuSeparator />
                            )}
                            {(canEmailReceipt || canWhatsAppReceipt) && (
                              <DropdownMenuItem
                                onClick={() => setReceiptTarget(tx)}
                              >
                                <SendHorizonal className="mr-2 h-4 w-4" />
                                Send to giver…
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TableCard>

      <RecordCashDialog
        presentationClassName={givingWorkspaceClass}
        open={recordOpen}
        onOpenChange={setRecordOpen}
        branchId={effectiveBranchId || undefined}
      />

      {/* Send-receipt channel dialog */}
      <Dialog
        open={!!receiptTarget}
        onOpenChange={(open) => !open && setReceiptTarget(null)}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Send Receipt</DialogTitle>
            <DialogDescription>
              Send the receipt for{" "}
              <span className="font-medium text-foreground">
                {receiptTarget
                  ? `${receiptTarget.currency} ${receiptTarget.amount.toLocaleString()} — ${receiptTarget.categoryName}`
                  : ""}
              </span>{" "}
              via:
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {canWhatsAppReceipt && (
              <Button
                variant="outline"
                onClick={() => void handleSendReceipt("whatsapp")}
                disabled={sendReceiptMutation.isPending}
              >
                WhatsApp
              </Button>
            )}
            {canEmailReceipt && (
              <Button
                onClick={() => void handleSendReceipt("email")}
                disabled={sendReceiptMutation.isPending}
              >
                Email
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GivingWorkspace>
  );
}
