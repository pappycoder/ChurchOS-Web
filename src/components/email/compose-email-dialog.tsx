"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Search, Send, UserRound, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEmailContacts,
  useSendEmail,
  type EmailContact,
} from "@/hooks/use-email";

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyToId?: string;
  replySubject?: string;
  initialBody?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  senior_pastor: "Senior Pastor",
  church_admin: "Church Admin",
  branch_pastor: "Branch Pastor",
  department_head: "Department Head",
  secretary: "Secretary",
  treasurer: "Treasurer",
  cell_leader: "Cell Leader",
};

export function ComposeEmailDialog({
  open,
  onOpenChange,
  replyToId,
  replySubject,
  initialBody = "",
}: ComposeEmailDialogProps) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<EmailContact[]>([]);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  const resolvedSubject = subject || (replySubject ? `Re: ${replySubject}` : "");

  const { data: contacts, isLoading } = useEmailContacts({ search: search || undefined });
  const sendEmail = useSendEmail();

  // Reset draft whenever the dialog opens or the target changes.
  React.useEffect(() => {
    if (open) {
      setSearch("");
      setSelected([]);
      setSubject("");
      setBody(initialBody);
    }
  }, [open, initialBody]);

  const unselected = (contacts?.data ?? []).filter(
    (c) => !selected.some((s) => s.id === c.id)
  );

  const toggleSelect = (contact: EmailContact) => {
    setSelected((prev) =>
      prev.some((s) => s.id === contact.id)
        ? prev.filter((s) => s.id !== contact.id)
        : [...prev, contact]
    );
    setSearch("");
  };

  const handleSend = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }
    if (!resolvedSubject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Message is required");
      return;
    }
    try {
      await sendEmail.mutateAsync({
        recipientIds: selected.map((s) => s.id),
        subject: resolvedSubject.trim(),
        body: body.trim(),
        replyToId,
      });
      toast.success("Email sent");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send email";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{replyToId ? "Reply" : "Compose"}</DialogTitle>
          <DialogDescription>
            Send an internal message to a church teammate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div className="space-y-2">
            <Label>To</Label>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((c) => (
                  <Badge
                    key={c.id}
                    variant="secondary"
                    className="gap-1 pr-1.5"
                    onClick={() => toggleSelect(c)}
                  >
                    {c.name}
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, role, branch, or email…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="size-4 animate-spin" /> Loading contacts…
              </div>
            )}

            {!isLoading && unselected.length > 0 && (
              <div className="max-h-44 overflow-y-auto rounded-md border divide-y">
                {unselected.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
                    onClick={() => toggleSelect(c)}
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={c.avatarUrl} alt={c.name} />
                      <AvatarFallback>
                        {initials(c.name) || <UserRound className="size-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {ROLE_LABEL[c.role] ?? c.role}
                        {c.branchName ? ` · ${c.branchName}` : ""}
                        {c.email ? ` · ${c.email}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-none">Add</Badge>
                  </button>
                ))}
              </div>
            )}

            {!isLoading && search && unselected.length === 0 && selected.length > 0 && (
              <p className="text-sm text-muted-foreground">
                All matching contacts are already selected.
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              placeholder={replySubject ? `Re: ${replySubject}` : "Subject"}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea
              id="email-body"
              rows={7}
              placeholder="Write your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sendEmail.isPending}
          >
            {sendEmail.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {replyToId ? "Send Reply" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
