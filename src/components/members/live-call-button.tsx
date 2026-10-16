"use client";
import * as React from "react";
import { Phone } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export function LiveCallButton({ memberId, memberName, disabled }: { memberId: string; memberName: string; disabled?: boolean }) {
  const { can } = usePermissions();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  if (!can("calls", "create") || !can("members:all", "read")) return null;
  async function call() {
    setBusy(true);
    try { await api.post("/calls", { memberId }); toast.success("Answer the call on your staff phone to connect to the member."); }
    catch (error) { toast.error(typeof error === "object" && error && "message" in error ? String(error.message) : "Unable to connect the call."); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" disabled={disabled || busy}><Phone className="mr-2 h-4 w-4" />{busy ? "Connecting…" : "Call member"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Call {memberName}?</DialogTitle><DialogDescription>We will call the phone number on your staff profile first. Answer it to connect to this member using the church’s configured caller number. Provider charges apply. Calls end after ten minutes; hang up your phone to end sooner.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" disabled={busy} onClick={() => { setOpen(false); void call(); }}>Call my phone</Button></DialogFooter></DialogContent></Dialog>;
}
