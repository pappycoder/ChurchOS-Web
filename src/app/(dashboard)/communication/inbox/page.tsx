"use client";

import * as React from "react";
import { toast } from "@/lib/toast";
import { format } from "date-fns";
import {
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  MailOpen,
  Pencil,
  Reply,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ComposeEmailDialog } from "@/components/email/compose-email-dialog";
import {
  useEmails,
  useEmailDetail,
  useMarkEmailRead,
  useMarkEmailUnread,
  useTrashEmail,
  useRestoreEmail,
  useDeleteEmailForever,
  useEmailUnread,
  type EmailBox,
  type EmailContact,
} from "@/hooks/use-email";
import { usePermissions } from "@/hooks/use-permissions";

type Folder = EmailBox | "trash";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatWhen(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return format(d, "h:mm a");
  return format(d, "MMM d");
}

function InboxContent() {
  const { can } = usePermissions();
  const canSend = can("emails", "create");
  const canDelete = can("emails", "delete");

  const [folder, setFolder] = React.useState<Folder>("inbox");
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [replyCtx, setReplyCtx] = React.useState<{
    id: string;
    subject: string;
    body: string;
    recipients: EmailContact[];
  } | null>(null);
  // Mobile-only: when true, the reading pane replaces the mail list.
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);

  const includeTrashed = folder === "trash";
  const box: EmailBox = folder === "trash" ? "inbox" : folder;

  const { data: list, isLoading: listLoading } = useEmails({
    page,
    limit: 30,
    box,
    includeTrashed,
  });
  const { data: detail, isLoading: detailLoading } = useEmailDetail(selectedId);
  const { data: unread } = useEmailUnread();

  const markRead = useMarkEmailRead();
  const markUnread = useMarkEmailUnread();
  const trash = useTrashEmail();
  const restore = useRestoreEmail();
  const deleteForever = useDeleteEmailForever();

  const items = list?.data ?? [];
  const isTrashView = folder === "trash";

  // Auto-mark a selected inbox message as read.
  React.useEffect(() => {
    if (selectedId && !isTrashView && box === "inbox") {
      const item = items.find((m) => m.id === selectedId);
      if (item && !item.readAt) {
        markRead.mutate(selectedId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, box, isTrashView]);

  const handleReply = () => {
    if (!detail) return;
    setReplyCtx({
      id: detail.id,
      subject: detail.subject,
      body: detail.body,
      recipients: detail.senderId
        ? [
            {
              id: detail.senderId,
              name: detail.senderName || "Unknown sender",
              role: "",
            },
          ]
        : [],
    });
    setComposeOpen(true);
  };

  const handleTrash = () => {
    if (!selectedId) return;
    trash.mutate(selectedId, {
      onSuccess: () => {
        setSelectedId(null);
        backToList();
        toast.success("Message moved to trash");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Failed to move to trash"),
    });
  };

  const handleDeleteForever = () => {
    if (!selectedId) return;
    deleteForever.mutate(selectedId, {
      onSuccess: () => {
        setSelectedId(null);
        backToList();
        toast.success("Message deleted forever");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Failed to delete"),
    });
  };

  const handleMarkUnread = () => {
    if (!selectedId) return;
    markUnread.mutate(selectedId);
  };

  const handleRestore = () => {
    if (!selectedId) return;
    restore.mutate(selectedId, {
      onSuccess: () => {
        setSelectedId(null);
        backToList();
        toast.success("Message restored");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Failed to restore"),
    });
  };

  const selectFolder = (next: Folder) => {
    setFolder(next);
    setSelectedId(null);
    setPage(1);
    setMobileDetailOpen(false);
  };

  const openMessage = (id: string) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  const backToList = () => {
    setMobileDetailOpen(false);
    setSelectedId(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inbox"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Communication" }, { label: "Inbox" }]}
      />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid lg:h-[calc(100dvh-240px)] lg:min-h-[560px] lg:grid-cols-[170px_300px_minmax(0,1fr)] xl:grid-cols-[190px_340px_minmax(0,1fr)]">
          <aside className="border-b bg-muted/30 p-3 lg:border-b-0 lg:border-r lg:p-4">
            {canSend && (
              <Button className="mb-4 w-full rounded-xl gap-2 shadow-sm" onClick={() => { setReplyCtx(null); setComposeOpen(true); }}>
                <Pencil className="size-4" /> New message
              </Button>
            )}
            <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground lg:block">Mailbox</p>
            <nav aria-label="Mail folders" className="flex gap-1 lg:flex-col">
              {([{ id: "inbox", label: "Inbox", icon: Inbox }, { id: "sent", label: "Sent", icon: Send }, { id: "trash", label: "Trash", icon: Trash2 }] as const).map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" aria-current={folder === id ? "page" : undefined} onClick={() => selectFolder(id)}
                  className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors lg:flex-none ${folder === id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <Icon className="size-4 shrink-0" /><span>{label}</span>
                  {id === "inbox" && (unread?.count ?? 0) > 0 && <Badge className="ml-auto rounded-full px-1.5 text-[10px]">{unread?.count}</Badge>}
                </button>
              ))}
            </nav>
          </aside>

          <section aria-label="Message list" className={`min-w-0 flex-col lg:border-r ${mobileDetailOpen ? "hidden lg:flex" : "flex"}`}>
            <div className="flex items-center justify-between border-b px-5 py-5">
              <div>
                <h3 className="font-semibold capitalize">{folder}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{list?.total ?? 0} messages{folder === "inbox" ? ` · ${unread?.count ?? 0} unread` : ""}</p>
              </div>
              <div className="rounded-xl bg-muted p-2 text-muted-foreground"><Mail className="size-5" /></div>
            </div>
            <div className="min-h-[320px] flex-1 overflow-y-auto">
              {listLoading ? (
                <LoadingState label="Loading messages" variant="table" />
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
                  <div className="rounded-2xl bg-muted p-4"><Inbox className="size-7 text-muted-foreground" /></div>
                  <p className="text-sm font-semibold">{isTrashView ? "Trash is empty" : box === "sent" ? "No sent messages yet" : "You're all caught up"}</p>
                  <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{isTrashView ? "Messages you move to trash will appear here." : box === "sent" ? "Your sent messages will appear here." : "New messages will appear here when they arrive."}</p>
                </div>
              ) : (
                <ul className="space-y-1 p-2">
                  {items.map((m) => {
                    const unreadMsg = !isTrashView && box === "inbox" && !m.readAt;
                    const isSelected = m.id === selectedId;
                    const senderLabel = box === "sent" ? m.recipientName || "Recipient" : m.senderName || "Unknown";
                    return (
                      <li key={m.id}>
                        <button type="button" aria-pressed={isSelected} onClick={() => openMessage(m.id)}
                          className={`relative flex w-full gap-3 rounded-xl p-3 text-left transition-colors ${isSelected ? "bg-primary/10 ring-1 ring-inset ring-primary/15" : "hover:bg-muted/60"}`}>
                          <Avatar className="mt-0.5 size-9 shrink-0"><AvatarImage src={box === "sent" ? undefined : m.senderAvatarUrl} alt={senderLabel} /><AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{initials(senderLabel) || <UserRound className="size-4" />}</AvatarFallback></Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2"><p className={`truncate text-sm ${unreadMsg ? "font-semibold" : "font-medium"}`}>{senderLabel}</p><time dateTime={m.createdAt} className="shrink-0 text-[10px] text-muted-foreground">{formatWhen(m.createdAt)}</time></div>
                            <div className="mt-1 flex items-center gap-2"><p className={`truncate text-xs ${unreadMsg ? "font-semibold text-foreground" : "text-foreground/80"}`}>{m.subject || "(No subject)"}</p>{unreadMsg && <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-primary" />}</div>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{m.preview}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {(list?.total ?? 0) > 30 && <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
              <span>Page {page} of {Math.ceil((list?.total ?? 0) / 30)}</span>
              <div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Previous page" disabled={page === 1} onClick={() => { backToList(); setPage(page - 1); }}><ChevronLeft className="size-4" /></Button><Button variant="ghost" size="icon" aria-label="Next page" disabled={page * 30 >= (list?.total ?? 0)} onClick={() => { backToList(); setPage(page + 1); }}><ChevronRight className="size-4" /></Button></div>
            </div>}
          </section>

          <section aria-label="Reading pane" className={`min-w-0 flex-col bg-background/40 ${!mobileDetailOpen ? "hidden lg:flex" : "flex"}`}>
            {!selectedId ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center px-8 text-center">
                <div className="mb-6 rounded-3xl border bg-card p-6 shadow-sm"><MailOpen className="size-10 text-primary/70" strokeWidth={1.5} /></div>
                <h3 className="text-lg font-semibold">Your conversations, in one place</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">Select a message to read it and keep the conversation going.</p>
              </div>
            ) : (
              <>
                <div className="flex min-h-[65px] flex-wrap items-center gap-1 border-b px-3 py-3">
                  <Button variant="ghost" size="sm" className="lg:hidden" onClick={backToList}><ChevronLeft className="size-4" /> Back</Button>
                  {detail && !isTrashView && <>
                    {canSend && <Button variant="ghost" size="sm" onClick={handleReply}><Reply className="size-4" /> Reply</Button>}
                    {box === "inbox" && <Button variant="ghost" size="sm" disabled={markUnread.isPending} onClick={handleMarkUnread} loading={markUnread.isPending}><Mail className="size-4" /> Mark unread</Button>}
                    {canDelete && <Button variant="ghost" size="icon" className="ml-auto text-muted-foreground hover:text-destructive" aria-label="Move to trash" disabled={trash.isPending} onClick={handleTrash} loading={trash.isPending}><Trash2 className="size-4" /></Button>}
                  </>}
                  {detail && isTrashView && <>
                    <Button variant="ghost" size="sm" disabled={restore.isPending} onClick={handleRestore} loading={restore.isPending}><ArchiveRestore className="size-4" /> Restore</Button>
                    {canDelete && <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" disabled={deleteForever.isPending} onClick={handleDeleteForever} loading={deleteForever.isPending}><Trash2 className="size-4" /> Delete forever</Button>}
                  </>}
                </div>
                {detailLoading ? <LoadingState label="Loading message" variant="detail" className="flex-1" /> : !detail ? <div className="p-8 text-sm text-muted-foreground">Unable to load this message. Select it again to retry.</div> : (
                  <article className="flex-1 overflow-y-auto p-6 sm:p-8 xl:p-10">
                    <h3 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">{detail.subject || "(No subject)"}</h3>
                    <div className="mt-6 flex items-center gap-3 border-b pb-6">
                      <Avatar className="size-10"><AvatarImage src={detail.senderAvatarUrl} alt={detail.senderName ?? ""} /><AvatarFallback className="bg-primary/10 text-primary">{initials(detail.senderName ?? "?")}</AvatarFallback></Avatar>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{detail.senderName || "Unknown sender"}</p><p className="mt-1 text-xs text-muted-foreground">{format(new Date(detail.createdAt), "EEE, MMM d, yyyy · h:mm a")}</p></div>
                    </div>
                    <div className="mt-7 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/90">{detail.body}</div>
                    {canSend && !isTrashView && <Button variant="outline" className="mt-10 rounded-xl" onClick={handleReply}><Reply className="size-4" /> Reply to message</Button>}
                  </article>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        replyToId={replyCtx?.id}
        replySubject={replyCtx?.subject}
        initialRecipients={replyCtx?.recipients}
        initialBody={replyCtx ? `\n\n---\nOn ${format(new Date(detail?.createdAt ?? new Date()), "MMM d, yyyy")}, ${detail?.senderName ?? ""} wrote:\n${replyCtx.body}\n` : ""}
      />
    </div>
  );
}

export default function InboxPage() {
  const { ready } = usePermissions();
  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  return <InboxContent />;
}
