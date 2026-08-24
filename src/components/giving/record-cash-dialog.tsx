"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGivingCategories,
  useCreateGivingCategory,
  useRecordCashGiving,
  type GivingTransaction,
} from "@/hooks/use-giving";
import { useAttendanceServices } from "@/hooks/use-attendance";
import { useEventsList } from "@/hooks/use-events";
import { MemberCombobox } from "@/components/members/member-combobox";
import { api } from "@/lib/api";

/** Built-in pseudo-category for recording a service/event day-total. */
export const OVERALL_TOTAL_CATEGORY = "Overall Total";
const OVERALL_TOTAL_VALUE = "__overall_total__";

type LinkTo = "general" | "member" | "service" | "event";

const LINK_TABS: { value: LinkTo; label: string }[] = [
  { value: "general", label: "General" },
  { value: "member", label: "Member" },
  { value: "service", label: "Service" },
  { value: "event", label: "Event" },
];

export function RecordCashDialog({
  open,
  onOpenChange,
  onRecorded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: (transaction: GivingTransaction) => void;
}) {
  const categoriesQuery = useGivingCategories({ limit: 100 });
  const servicesQuery = useAttendanceServices({ isActive: true, limit: 100 });
  const eventsQuery = useEventsList({ limit: 50 });
  const createCategoryMutation = useCreateGivingCategory();
  const recordMutation = useRecordCashGiving();

  const categories = categoriesQuery.data?.data ?? [];

  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<"cash" | "bank_transfer">("cash");
  const [linkTo, setLinkTo] = React.useState<LinkTo>("general");
  const [memberId, setMemberId] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [eventId, setEventId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setAmount("");
      setMethod("cash");
      setLinkTo("general");
      setMemberId("");
      setServiceId("");
      setEventId("");
      setCategoryId("");
      setNewCategoryName("");
      setNotes("");
    }
  }, [open]);

  /**
   * Resolves the chosen category to an ID. Built-in "Overall Total" and
   * custom-typed names are created on first use; a duplicate-name rejection
   * resolves to the existing row instead of failing.
   */
  const resolveCategoryId = async (): Promise<string> => {
    if (
      categoryId &&
      categoryId !== OVERALL_TOTAL_VALUE &&
      categoryId !== "__new_category__"
    ) {
      return categoryId;
    }

    const name =
      categoryId === OVERALL_TOTAL_VALUE ? OVERALL_TOTAL_CATEGORY : newCategoryName.trim();
    if (!name) throw new Error("Please choose or type a category");

    const existing = categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.isActive
    );
    if (existing) return existing.categoryId;

    try {
      const created = await createCategoryMutation.mutateAsync({ name, isRecurring: false });
      return created.categoryId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already exists/i.test(message)) {
        const fresh = await api.get<{
          data: { categoryId: string; name: string }[];
        }>("/giving/categories?limit=100");
        const match = fresh.data.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (match) return match.categoryId;
      }
      throw error;
    }
  };

  const handleSubmit = async () => {
    const amountNumber = Number(amount);
    if (!amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (
      (linkTo === "member" && !memberId) ||
      (linkTo === "service" && !serviceId) ||
      (linkTo === "event" && !eventId)
    ) {
      toast.error("Pick who or which the giving belongs to");
      return;
    }

    setPending(true);
    try {
      const resolvedCategoryId = await resolveCategoryId();
      const transaction = await recordMutation.mutateAsync({
        categoryId: resolvedCategoryId,
        amount: amountNumber,
        type: method,
        memberId: linkTo === "member" ? memberId : undefined,
        serviceId: linkTo === "service" ? serviceId : undefined,
        eventId: linkTo === "event" ? eventId : undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`Recorded ${transaction.currency} ${transaction.amount.toLocaleString()}`, {
        description: transaction.receiptNumber ? `Receipt ${transaction.receiptNumber}` : undefined,
      });
      onOpenChange(false);
      onRecorded?.(transaction);
    } catch (error) {
      toast.error("Failed to record giving", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  // Select shows the typed-name entry as a pseudo item while in custom mode.
  const categorySelectValue =
    categoryId === OVERALL_TOTAL_VALUE
      ? OVERALL_TOTAL_VALUE
      : newCategoryName
        ? "__new_category__"
        : categoryId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Giving</DialogTitle>
          <DialogDescription>
            Log a cash or bank-transfer gift against a member, service or event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Amount *</p>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Method *</p>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as "cash" | "bank_transfer")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Linked to</p>
            <div className="flex gap-1 rounded-md border p-1 w-fit">
              {LINK_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setLinkTo(tab.value)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    linkTo === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {linkTo === "member" && (
              <div className="pt-1">
                <MemberCombobox
                  value={memberId}
                  onChange={(id) => setMemberId(id)}
                  placeholder="Search members by name..."
                />
              </div>
            )}
            {linkTo === "service" && (
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {(servicesQuery.data?.data ?? []).map((s) => (
                    <SelectItem key={s.serviceId} value={s.serviceId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {linkTo === "event" && (
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {(eventsQuery.data?.data ?? []).map((ev) => (
                    <SelectItem key={ev.eventId} value={ev.eventId}>
                      {ev.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Category *</p>
            <Select
              value={categorySelectValue}
              onValueChange={(v) => {
                setCategoryId(v);
                if (v !== "__new_category__") setNewCategoryName("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose or type a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => c.isActive)
                  .map((c) => (
                    <SelectItem key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </SelectItem>
                  ))}
                <SelectItem value={OVERALL_TOTAL_VALUE}>
                  {OVERALL_TOTAL_CATEGORY} (day/event total)
                </SelectItem>
                <SelectItem value="__new_category__">+ Add new category…</SelectItem>
              </SelectContent>
            </Select>
            {categorySelectValue === "__new_category__" && (
              <Input
                autoFocus
                placeholder="Type the new category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Not listed? Pick “+ Add new category…” and type it — it&apos;s created
              automatically.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Notes</p>
            <Textarea
              rows={2}
              placeholder="Optional context, e.g. Sunday first service bucket"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={pending}>
            {pending ? "Recording..." : "Record Giving"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
