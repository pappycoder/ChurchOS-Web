"use client";

import * as React from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Eye,
  Megaphone,
  MoreHorizontal,
  Plus,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useBroadcastsList,
  useCancelBroadcast,
  BROADCAST_CHANNELS,
  BROADCAST_CHANNEL_LABELS,
  BROADCAST_CHANNEL_TEXT,
  BROADCAST_STATUS_LABELS,
  BROADCAST_STATUS_TEXT,
  type Broadcast,
  type BroadcastChannel,
  type BroadcastStatus,
  type ListBroadcastsParams,
} from "@/hooks/use-broadcasts";
import { usePermissions } from "@/hooks/use-permissions";

const BROADCAST_STATUS_FILTERS: BroadcastStatus[] = [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "cancelled",
  "failed",
];

function BroadcastsListContent() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can("broadcasts", "create");
  const canUpdate = can("broadcasts", "update");
  const canManage = canCreate || canUpdate;

  const [statusFilter, setStatusFilter] = React.useState<BroadcastStatus | "">("");
  const [channel, setChannel] = React.useState<BroadcastChannel | "">("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [viewing, setViewing] = React.useState<Broadcast | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<Broadcast | null>(null);

  const queryParams: ListBroadcastsParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      status: statusFilter || undefined,
      channel: channel || undefined,
    }),
    [page, perPage, statusFilter, channel]
  );

  const { data, isLoading, error } = useBroadcastsList(queryParams);

  const allQuery = useBroadcastsList({ limit: 200 });
  const allBroadcasts = React.useMemo(() => allQuery.data?.data ?? [], [allQuery.data]);

  const total = data?.meta?.total ?? 0;
  const broadcasts = React.useMemo(() => data?.data ?? [], [data]);

  const sent = allBroadcasts.filter((b) => b.status === "sent").length;
  const scheduled = allBroadcasts.filter((b) => b.status === "scheduled").length;
  const failed = allBroadcasts.filter((b) => b.status === "failed").length;

  const cancelMutation = useCancelBroadcast();

  const isCancelable = (b: Broadcast) =>
    b.status === "scheduled" || b.status === "sending";

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync(cancelTarget.broadcastId);
      toast.success("Broadcast cancelled");
      setCancelTarget(null);
      setViewing((v) => (v && v.broadcastId === cancelTarget.broadcastId ? null : v));
    } catch (err) {
      toast.error("Failed to cancel broadcast", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setCancelTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Broadcasts"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Broadcasts" }]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load broadcasts.</p>
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
        title="Broadcasts"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Broadcasts" }]}
        action={
          canCreate && (
            <Button onClick={() => router.push("/communication/broadcasts/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Broadcast
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Broadcasts"
          value={allQuery.data?.meta?.total ?? allBroadcasts.length}
          icon={<Megaphone className="h-4 w-4" />}
        />
        <StatsCard
          title="Sent"
          value={sent}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
        />
        <StatsCard
          title="Scheduled"
          value={scheduled}
          icon={<CalendarClock className="h-4 w-4" />}
          variant="warning"
        />
        <StatsCard
          title="Failed"
          value={failed}
          icon={<XCircle className="h-4 w-4" />}
          variant="default"
        />
      </div>

      <TableCard
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as BroadcastStatus | "");
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">All Statuses</option>
                {BROADCAST_STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {BROADCAST_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <select
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value as BroadcastChannel | "");
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">All Channels</option>
                {BROADCAST_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {BROADCAST_CHANNEL_LABELS[ch]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
        itemName="broadcasts"
        page={page}
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
        ) : broadcasts.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Megaphone className="h-12 w-12" />}
              title="No broadcasts yet"
              description={
                statusFilter || channel
                  ? "Try adjusting your filters."
                  : "Create a broadcast to send a message to your members."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Recipients</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((broadcast) => (
                <TableRow
                  key={broadcast.broadcastId}
                  className="cursor-pointer"
                  onClick={() => setViewing(broadcast)}
                >
                  <TableCell className="font-medium">{broadcast.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {broadcast.templateName || "-"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 ${BROADCAST_CHANNEL_TEXT[broadcast.channel]}`}>
                      {BROADCAST_CHANNEL_LABELS[broadcast.channel]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${BROADCAST_STATUS_TEXT[broadcast.status]}`}>
                      {BROADCAST_STATUS_LABELS[broadcast.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {broadcast.status === "sent" && broadcast.sentAt
                      ? format(new Date(broadcast.sentAt), "MMM d, yyyy")
                      : broadcast.scheduledAt
                        ? format(new Date(broadcast.scheduledAt), "MMM d, yyyy")
                        : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {broadcast.totalRecipients}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewing(broadcast)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {canUpdate && isCancelable(broadcast) && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setCancelTarget(broadcast)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      {/* View detail */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              {viewing && (
                <Badge variant="secondary">{BROADCAST_CHANNEL_LABELS[viewing.channel]}</Badge>
              )}
              {viewing && (
                <span className={`text-sm font-medium ${BROADCAST_STATUS_TEXT[viewing.status]}`}>
                  {BROADCAST_STATUS_LABELS[viewing.status]}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Template</p>
                  <p className="font-medium">{viewing.templateName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Recipients</p>
                  <p className="font-medium">{viewing.totalRecipients}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Scheduled</p>
                  <p className="font-medium">
                    {viewing.scheduledAt
                      ? format(new Date(viewing.scheduledAt), "MMM d, yyyy h:mm a")
                      : "Immediately"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Sent</p>
                  <p className="font-medium">
                    {viewing.sentAt
                      ? format(new Date(viewing.sentAt), "MMM d, yyyy h:mm a")
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="rounded-md border bg-muted/40 p-4 text-xs text-muted-foreground">
                Created {format(new Date(viewing.createdAt), "MMM d, yyyy h:mm a")}
              </div>
              {canUpdate && isCancelable(viewing) && (
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setViewing(null);
                      setCancelTarget(viewing);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Broadcast
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Cancel Broadcast</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to cancel{" "}
              <span className="font-medium text-foreground">{cancelTarget?.name}</span>?
              It will not be sent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={cancelMutation.isPending}
            >
              Keep Broadcast
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BroadcastsListPage() {
  return (
    <Suspense fallback={null}>
      <BroadcastsListContent />
    </Suspense>
  );
}
