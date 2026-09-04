"use client";

import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArchiveRestore,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Mail,
  MailOpen,
  Pencil,
  Reply,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
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
  // Mobile-only: expand/collapse the folder icon rail.
  const [mobileFoldersOpen, setMobileFoldersOpen] = React.useState(false);

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

      {/* Email layout: 3-pane on desktop, folder-rail→list→detail on mobile */}
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* ── Folder sidebar ─────────────────────────────── */}
        <aside className="rounded-xl border bg-card p-3 md:sticky md:top-20">
          {/* Desktop: full-width vertical folder list */}
          <div className="hidden lg:block">
            {canSend && (
              <Button className="w-full justify-start gap-2" onClick={() => { setReplyCtx(null); setComposeOpen(true); }}>
                <Pencil className="size-4" /> Compose
              </Button>
            )}

            <nav className="mt-4 space-y-1 text-sm">
              <button
                type="button"
                onClick={() => selectFolder("inbox")}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 transition-colors ${
                  folder === "inbox" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Inbox className="size-4" /> Inbox
                </span>
                {(unread?.count ?? 0) > 0 && (
                  <Badge variant="destructive" className="rounded-full px-2">{unread?.count}</Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => selectFolder("sent")}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 transition-colors ${
                  folder === "sent" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Send className="size-4" /> Sent
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectFolder("trash")}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 transition-colors ${
                  folder === "trash" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="size-4" /> Trash
                </span>
              </button>
            </nav>
          </div>

          {/* Mobile: minimizable icon rail (collapsed → expandable) */}
          <div className="flex lg:hidden">
            <div className="flex flex-col items-center gap-1 w-fit">
              <button
                type="button"
                onClick={() => setMobileFoldersOpen((v) => !v)}
                aria-label="Toggle folders"
                title={mobileFoldersOpen ? "Collapse folders" : "Expand folders"}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-muted"
              >
                {mobileFoldersOpen ? <ChevronsLeft className="size-4" /> : <ChevronsRight className="size-4" />}
                {mobileFoldersOpen && <span className="text-sm">Folders</span>}
              </button>

              {canSend && (
                <button
                  type="button"
                  onClick={() => { setReplyCtx(null); setComposeOpen(true); }}
                  aria-label="Compose"
                  title="Compose"
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                    "text-primary hover:bg-primary/10"
                  }`}
                >
                  <Pencil className="size-4" />
                  {mobileFoldersOpen && <span className="text-sm whitespace-nowrap">Compose</span>}
                </button>
              )}

              <button
                type="button"
                onClick={() => selectFolder("inbox")}
                aria-label="Inbox"
                title="Inbox"
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                  folder === "inbox" && !mobileFoldersOpen ? "text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="relative">
                  <Inbox className="size-4" />
                  {(unread?.count ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </span>
                {mobileFoldersOpen && <span className="text-sm whitespace-nowrap">Inbox</span>}
              </button>

              <button
                type="button"
                onClick={() => selectFolder("sent")}
                aria-label="Sent"
                title="Sent"
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                  folder === "sent" && !mobileFoldersOpen ? "text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Send className="size-4" />
                {mobileFoldersOpen && <span className="text-sm whitespace-nowrap">Sent</span>}
              </button>

              <button
                type="button"
                onClick={() => selectFolder("trash")}
                aria-label="Trash"
                title="Trash"
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                  folder === "trash" && !mobileFoldersOpen ? "text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Trash2 className="size-4" />
                {mobileFoldersOpen && <span className="text-sm whitespace-nowrap">Trash</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* ── Mail list ──────────────────────────────────── */}
        <section className={`min-w-0 rounded-xl border bg-card overflow-hidden ${mobileDetailOpen ? "hidden lg:block" : ""}`}>
          {listLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Mail className="size-10 text-muted-foreground/50" />
              <p className="font-medium">
                {isTrashView ? "Trash is empty" : box === "sent" ? "No sent messages" : "Inbox is empty"}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {canSend
                  ? "Compose a message to a teammate to get started."
                  : "Messages sent to you will appear here."}
              </p>
              {canSend && (
                <Button variant="outline" size="sm" onClick={() => { setReplyCtx(null); setComposeOpen(true); }}>
                  <Pencil className="size-4" /> Compose
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* List header */}
              <div className="flex items-center justify-between border-b px-4 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {isTrashView ? "Trash" : box === "sent" ? "Sent" : "Inbox"}
                </span>
                {!isTrashView && box === "inbox" && (
                  <span>{unread?.count ?? 0} unread</span>
                )}
              </div>

              {/* Messages */}
              <ul className="divide-y max-h-[70vh] overflow-y-auto">
                {items.map((m) => {
                  const unreadMsg = !isTrashView && box === "inbox" && !m.readAt;
                  const isSelected = m.id === selectedId;
                  const senderLabel =
                    box === "sent" ? m.recipientName || "Recipient" : m.senderName || "Unknown";
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => openMessage(m.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <Avatar className={`size-9 ${unreadMsg ? "ring-2 ring-primary/30" : ""}`}>
                          <AvatarImage src={m.senderAvatarUrl} alt={senderLabel} />
                          <AvatarFallback>
                            {initials(senderLabel) || <UserRound className="size-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`truncate text-sm ${unreadMsg ? "font-semibold" : "font-medium"}`}>
                              {senderLabel}
                            </p>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatWhen(m.createdAt)}
                            </span>
                          </div>
                          <p className={`truncate text-sm ${unreadMsg ? "text-foreground" : "text-muted-foreground"}`}>
                            {m.subject}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        {/* ── Detail pane ────────────────────────────────── */}
        <section className={`min-w-0 rounded-xl border bg-card overflow-hidden ${!selectedId ? "hidden lg:block" : ""}`}>
          {selectedId && detailLoading ? (
            <div className="space-y-4 p-5">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !selectedId || !detail ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
              <MailOpen className="size-10 text-muted-foreground/40" />
              <p className="font-medium">Select a message to read it</p>
              <p className="text-sm max-w-xs">
                Choose a message from the list to view its contents.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1 border-b p-2">
                <Button variant="ghost" size="sm" className="lg:hidden" onClick={backToList}>
                  <ChevronLeft className="size-4" /> Back
                </Button>
                {!isTrashView && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleReply}>
                      <Reply className="size-4" /> Reply
                    </Button>
                    {box === "inbox" && (
                      <Button variant="ghost" size="sm" onClick={handleMarkUnread}>
                        <MailOpen className="size-4" /> Unread
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={handleTrash}>
                        <Trash2 className="size-4" /> Trash
                      </Button>
                    )}
                  </>
                )}
                {isTrashView && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleRestore}>
                      <ArchiveRestore className="size-4" /> Restore
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={handleDeleteForever}
                      >
                        <Trash2 className="size-4" /> Delete Forever
                      </Button>
                    )}
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-4 flex items-start gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={detail.senderAvatarUrl} alt={detail.senderName ?? ""} />
                    <AvatarFallback>
                      {initials(detail.senderName ?? "?") || <UserRound className="size-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold">{detail.subject}</h3>
                    <p className="text-sm font-medium">{detail.senderName || "Unknown sender"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(detail.createdAt), "EEE, MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-sm leading-relaxed">{detail.body}</div>
              </div>
            </div>
          )}
        </section>
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
