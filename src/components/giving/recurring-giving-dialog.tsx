"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberCombobox } from "@/components/members/member-combobox";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";
import { useGivingCategories, useCreateRecurringGiving } from "@/hooks/use-giving";
import { toast } from "@/lib/toast";

export function RecurringGivingDialog({ open, onOpenChange, branchId: initialBranchId }: { open: boolean; onOpenChange: (open: boolean) => void; branchId?: string }) {
  const { data: profile } = useCurrentProfile();
  const [selectedBranch, setSelectedBranch] = useState("");
  const branchId = profile?.isAdminHq ? selectedBranch : profile?.branchId ?? "";
  const branches = useBranchesList({ limit: 100 }, { enabled: open && !!profile?.isAdminHq });
  const categories = useGivingCategories({ limit: 100, branchId: branchId || undefined }, { enabled: open && !!branchId });
  const mutation = useCreateRecurringGiving();
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  useEffect(() => {
    if (!open) return;
    setSelectedBranch(initialBranchId ?? ""); setMemberId(""); setMemberName(""); setEmail(""); setCategoryId(""); setAmount(""); setFrequency("monthly");
  }, [open, initialBranchId]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!branchId || !memberId || !categoryId || Number(amount) < 100) {
      toast.error("Choose a branch, member and category, and enter at least ₦100"); return;
    }
    try {
      await mutation.mutateAsync({ branchId, memberId, categoryId, email: email.trim(), amount: Number(amount), frequency });
      toast.success("Recurring giving schedule created"); onOpenChange(false);
    } catch (error) { toast.error("Could not create recurring giving", { description: error instanceof Error ? error.message : "Please try again." }); }
  };
  const options = (categories.data?.data ?? []).filter((category) => category.isActive && category.isRecurring);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>Create Recurring Giving</DialogTitle><DialogDescription>Schedule giving for a member. Automatic charges require the giver to complete payment authorization.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>Branch</Label><Select value={branchId || undefined} disabled={!profile?.isAdminHq || mutation.isPending} onValueChange={(value) => { setSelectedBranch(value); setMemberId(""); setMemberName(""); setEmail(""); setCategoryId(""); }}>
        <SelectTrigger aria-label="Recurring giving branch"><SelectValue placeholder="Select a branch" /></SelectTrigger><SelectContent>
          {profile?.isAdminHq ? (branches.data?.data ?? []).map((branch) => <SelectItem key={branch.branchId} value={branch.branchId}>{branch.name}</SelectItem>) : branchId ? <SelectItem value={branchId}>{profile?.branch?.name ?? "Your branch"}</SelectItem> : null}
        </SelectContent></Select></div>
      <div className="space-y-2"><Label>Member</Label><MemberCombobox branchId={branchId || undefined} value={memberId} selectedName={memberName} disabled={!branchId || mutation.isPending} onChange={(id, member) => { setMemberId(id); setMemberName(member ? `${member.firstName} ${member.lastName}` : ""); setEmail(member?.email ?? ""); }} /></div>
      <div className="space-y-2"><Label>Category</Label><Select value={categoryId || undefined} onValueChange={setCategoryId} disabled={!branchId || mutation.isPending}><SelectTrigger aria-label="Recurring giving category"><SelectValue placeholder="Select a recurring category" /></SelectTrigger><SelectContent>{options.map((category) => <SelectItem key={category.categoryId} value={category.categoryId}>{category.name}</SelectItem>)}</SelectContent></Select>{!categories.isLoading && branchId && options.length === 0 && <p className="text-sm text-muted-foreground">Enable recurring giving on a category in Giving Categories first.</p>}</div>
      <div className="space-y-2"><Label htmlFor="recurring-email">Payer email</Label><Input id="recurring-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={mutation.isPending} /></div>
      <div className="space-y-2"><Label htmlFor="recurring-amount">Amount (NGN)</Label><Input id="recurring-amount" type="number" min={100} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} disabled={mutation.isPending} /></div>
      <div className="space-y-2"><Label>Frequency</Label><Select value={frequency} onValueChange={(value) => setFrequency(value as typeof frequency)} disabled={mutation.isPending}><SelectTrigger aria-label="Giving frequency"><SelectValue /></SelectTrigger><SelectContent>{["weekly", "monthly", "quarterly"].map((value) => <SelectItem key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</SelectItem>)}</SelectContent></Select></div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button><Button type="submit" loading={mutation.isPending} disabled={!branchId || !memberId || !categoryId}>Create Schedule</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
