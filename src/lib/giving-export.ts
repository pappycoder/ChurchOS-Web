import type { GivingTransaction } from "@/hooks/use-giving";
import type { ExportColumn } from "./export-utils";

export const givingExportColumns: ExportColumn[] = [
  { key: "date", label: "Giving Date" }, { key: "recordedAt", label: "Recorded At (UTC)" },
  { key: "name", label: "Member / Source" }, { key: "branch", label: "Branch" },
  { key: "linkType", label: "Link Type" }, { key: "linkedTo", label: "Linked To" },
  { key: "meetingDate", label: "Group Meeting Date" }, { key: "category", label: "Category" },
  { key: "amount", label: "Amount" }, { key: "currency", label: "Currency" },
  { key: "method", label: "Payment Method" }, { key: "gateway", label: "Payment Provider" },
  { key: "status", label: "Status" }, { key: "receiptNumber", label: "Receipt Number" },
  { key: "paymentReference", label: "Payment Reference" }, { key: "transactionId", label: "Transaction ID" },
  { key: "description", label: "Notes" },
];
export function givingExportRows(rows: GivingTransaction[]) {
  return rows.map(t => ({
    date: t.givingDate ?? t.createdAt.slice(0, 10), recordedAt: t.createdAt,
    name: t.memberName || t.cellGroupName || t.serviceName || t.eventName || "General giving",
    branch: t.branchName || (t.branchId ? "Branch name unavailable" : "Not recorded"),
    linkType: t.cellGroupId ? "Cell Group" : t.memberId ? "Member" : t.serviceId ? "Service" : t.eventId ? "Event" : "General",
    linkedTo: t.cellGroupName || t.memberName || t.serviceName || t.eventName || "General giving",
    meetingDate: t.cellGroupMeetingDate || "", category: t.categoryName || "Unspecified",
    amount: t.amount, currency: t.currency,
    method: (t.paymentMethod || t.type).replaceAll("_", " "), gateway: t.paymentGateway,
    status: t.status, receiptNumber: t.receiptNumber || "", paymentReference: t.paymentReference || "",
    transactionId: t.transactionId, description: t.notes || t.description || "",
  }));
}
