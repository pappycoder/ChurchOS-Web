"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  MoreHorizontal,
  Plus,
  Receipt,
  SendHorizonal,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TablePagination } from "@/components/shared/table-pagination";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
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

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive"> = {
  success: "default",
  pending: "secondary",
  failed: "destructive",
  reversed: "destructive",
};

export default function GivingRecordsPage() {
  const { can } = usePermissions();
  const canCreate = can("giving", "create");

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
  const servicesQuery = useAttendanceServices({ limit: 100 });

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
      sortBy: "created_at" as const,
      sortOrder: "desc" as const,
    }),
    [page, perPage, categoryId, status, type, serviceId, startDate, endDate]
  );

  const { data, isLoading, error } = useGivingTransactions(queryParams);
  const transactions = data?.data ?? [];
  const meta = data?.meta;

  const [recordOpen, setRecordOpen] = React.useState(false);
  const [receiptTarget, setReceiptTarget] = React.useState<GivingTransaction | null>(null);
  const sendReceiptMutation = useSendReceipt(receiptTarget?.transactionId ?? "");

  const linkedName = (tx: GivingTransaction): string =>
    tx.memberName || tx.serviceName || tx.eventName || "General";

  const linkedKind = (tx: GivingTransaction): string =>
    tx.memberId ? "Member" : tx.serviceId ? "Service" : tx.eventId ? "Event" : "General";

  const buildExportRows = React.useCallback(
    (rows: GivingTransaction[]) =>
      rows.map((t) => ({
        date: format(new Date(t.createdAt), "yyyy-MM-dd"),
        name: t.memberName || "",
        linkType: linkedKind(t),
        linkedTo: linkedName(t),
        category: t.categoryName,
        amount: t.amount,
        currency: t.currency,
        type: t.type.replace("_", " "),
        gateway: t.paymentGateway,
        status: t.status,
        receiptNumber: t.receiptNumber || "",
      })),
    []
  );
  const exportData = buildExportRows(transactions);

  // Export walks every page of the current filter set server-side.
  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<GivingTransaction>((p) =>
      api.get(listUrl("/giving/transactions", { ...queryParams, page: p, limit: 100 }))
    );
    return buildExportRows(rows);
  }, [queryParams, buildExportRows]);

  const downloadReceipt = async (tx: GivingTransaction) => {
    try {
      const blob = await api.getBlob(`/giving/transactions/${tx.transactionId}/receipt`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tx.receiptNumber ?? "receipt"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download receipt", {
        description: error instanceof Error ? error.message : "Please try again.",
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
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setReceiptTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Records"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Giving", href: "/giving" },
            { label: "Records" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load giving records.</p>
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
        title="Records"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Giving", href: "/giving" },
          { label: "Records" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              columns={[
                { key: "date", label: "Date" },
                { key: "name", label: "Name" },
                { key: "linkType", label: "Link Type" },
                { key: "linkedTo", label: "Linked To" },
                { key: "category", label: "Category" },
                { key: "amount", label: "Amount" },
                { key: "currency", label: "Currency" },
                { key: "type", label: "Method" },
                { key: "gateway", label: "Gateway" },
                { key: "status", label: "Status" },
                { key: "receiptNumber", label: "Receipt #" },
              ]}
              data={exportData}
              fetchAllRows={fetchAllExportRows}
              title="Giving Records"
              filename="giving-records"
              disabled={exportData.length === 0}
            />
            {canCreate && (
              <Button onClick={() => setRecordOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Giving
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
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
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36">
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
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48">
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
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-38"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-38"
              aria-label="To date"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name / Linked To</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.transactionId}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(tx.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[180px]">
                            {linkedName(tx)}
                          </p>
                          <Badge variant="outline" className="mt-0.5">
                            {linkedKind(tx)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{tx.categoryName}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {tx.currency} {tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {tx.type.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[tx.status] ?? "secondary"}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {tx.receiptNumber || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.status === "success" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Receipt actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void downloadReceipt(tx)}>
                                <Receipt className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setReceiptTarget(tx)}>
                                <SendHorizonal className="mr-2 h-4 w-4" />
                                Send to giver…
                              </DropdownMenuItem>
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
        </CardContent>
      </Card>

      <TablePagination
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        itemName="records"
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />

      <RecordCashDialog open={recordOpen} onOpenChange={setRecordOpen} />

      {/* Send-receipt channel dialog */}
      <Dialog open={!!receiptTarget} onOpenChange={(open) => !open && setReceiptTarget(null)}>
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
            <Button
              variant="outline"
              onClick={() => void handleSendReceipt("whatsapp")}
              disabled={sendReceiptMutation.isPending}
            >
              WhatsApp
            </Button>
            <Button onClick={() => void handleSendReceipt("email")} disabled={sendReceiptMutation.isPending}>
              Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
