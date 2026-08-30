"use client";

import * as React from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquare,
  Phone,
  Plus,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { SearchInput } from "@/components/shared/search-input";
import { TableCard } from "@/components/shared/table-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useMessagesList,
  useSendMessage,
  MESSAGE_CHANNELS,
  MESSAGE_CHANNEL_LABELS,
  MESSAGE_DIRECTION_LABELS,
  MESSAGE_DIRECTION_TEXT,
  MESSAGE_STATUS_LABELS,
  MESSAGE_STATUS_TEXT,
  type Message,
  type MessageChannel,
  type MessageDirection,
  type ListMessagesParams,
} from "@/hooks/use-communication";
import { usePermissions } from "@/hooks/use-permissions";

function MessagesListContent() {
  const { can } = usePermissions();
  const canSend = can("whatsapp", "create");

  const [phoneInput, setPhoneInput] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [direction, setDirection] = React.useState<MessageDirection | "">("");
  const [channelFilter, setChannelFilter] = React.useState<MessageChannel | "">("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [viewing, setViewing] = React.useState<Message | null>(null);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [sendTo, setSendTo] = React.useState("");
  const [sendText, setSendText] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPhone(phoneInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [phoneInput]);

  const queryParams: ListMessagesParams = React.useMemo(
    () => ({
      limit: 200,
      phone: phone || undefined,
      direction: direction || undefined,
    }),
    [phone, direction]
  );

  const { data, isLoading, error } = useMessagesList(queryParams);
  const allMessages = React.useMemo(() => data?.data ?? [], [data]);

  const filtered = React.useMemo(() => {
    if (!channelFilter) return allMessages;
    return allMessages.filter((m) => m.channel === channelFilter);
  }, [allMessages, channelFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = React.useMemo(
    () => filtered.slice((safePage - 1) * perPage, safePage * perPage),
    [filtered, safePage, perPage]
  );

  const totalFetch = data?.total ?? 0;
  const outbound = allMessages.filter((m) => m.direction === "outbound").length;
  const inbound = allMessages.filter((m) => m.direction === "inbound").length;
  const failed = allMessages.filter((m) => m.status === "failed").length;

  const sendMutation = useSendMessage();

  const handleSend = async () => {
    const to = sendTo.trim();
    const text = sendText.trim();
    if (!to || !text) {
      toast.error("Recipient phone and message are required");
      return;
    }
    try {
      await sendMutation.mutateAsync({ to, text, type: "text" });
      toast.success("Message sent");
      setSendOpen(false);
      setSendTo("");
      setSendText("");
    } catch (err) {
      toast.error("Failed to send message", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Messages"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Messages" }]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load messages.</p>
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
        title="Messages"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Messages" }]}
        action={
          canSend && (
            <Button onClick={() => setSendOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Messages"
          value={totalFetch}
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <StatsCard
          title="Outbound"
          value={outbound}
          icon={<ArrowUpRight className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Inbound"
          value={inbound}
          icon={<ArrowDownLeft className="h-4 w-4" />}
          variant="success"
        />
        <StatsCard
          title="Failed"
          value={failed}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="default"
        />
      </div>

      <TableCard
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={channelFilter}
                onChange={(e) => {
                  setChannelFilter(e.target.value as MessageChannel | "");
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">All Channels</option>
                {MESSAGE_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {MESSAGE_CHANNEL_LABELS[ch]}
                  </option>
                ))}
              </select>
              <select
                value={direction}
                onChange={(e) => {
                  setDirection(e.target.value as MessageDirection | "");
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">All Directions</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            <SearchInput
              value={phoneInput}
              onChange={(v) => setPhoneInput(v)}
              placeholder="Search by phone..."
              className="w-full sm:w-64"
            />
          </div>
        }
        itemName="messages"
        page={safePage}
        perPage={perPage}
        total={total}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<MessageSquare className="h-12 w-12" />}
              title="No messages"
              description={
                phone || direction || channelFilter
                  ? "Try adjusting your filters."
                  : "Messages sent and received through your communication channels will appear here."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((message) => (
                <TableRow
                  key={message.messageId}
                  className="cursor-pointer"
                  onClick={() => setViewing(message)}
                >
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {message.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${MESSAGE_DIRECTION_TEXT[message.direction]}`}>
                      {message.direction === "inbound" ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                      {MESSAGE_DIRECTION_LABELS[message.direction]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{MESSAGE_CHANNEL_LABELS[message.channel]}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <p className="truncate text-muted-foreground">
                      {message.content || (message.mediaUrl ? "[media]" : "-")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${MESSAGE_STATUS_TEXT[message.status]}`}>
                      {MESSAGE_STATUS_LABELS[message.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                    {format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      {/* View detail */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {viewing ? MESSAGE_DIRECTION_LABELS[viewing.direction] : ""} Message
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              {viewing && (
                <Badge variant="secondary">{MESSAGE_CHANNEL_LABELS[viewing.channel]}</Badge>
              )}
              {viewing && (
                <span className={`text-sm font-medium ${MESSAGE_STATUS_TEXT[viewing.status]}`}>
                  {MESSAGE_STATUS_LABELS[viewing.status]}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                  <p className="font-medium">{viewing.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Direction</p>
                  <p className="font-medium">{MESSAGE_DIRECTION_LABELS[viewing.direction]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Sent / Received</p>
                  <p className="font-medium">
                    {format(new Date(viewing.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
              {viewing.content && (
                <div className="rounded-md border bg-muted/40 p-4 whitespace-pre-wrap">
                  {viewing.content}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Send a WhatsApp text message to a phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Recipient Phone *</label>
              <Input
                placeholder="e.g. +2348012345678"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message *</label>
              <Textarea
                placeholder="Type your message..."
                rows={4}
                value={sendText}
                onChange={(e) => setSendText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendOpen(false)}
              disabled={sendMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSend()} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Sending..." : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MessagesListPage() {
  return (
    <Suspense fallback={null}>
      <MessagesListContent />
    </Suspense>
  );
}
