"use client";

import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { toast } from "@/lib/toast";
import {
  Pause,
  Play,
  RefreshCcwDot,
  Repeat,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRecurringGiving,
  usePauseRecurringGiving,
  useResumeRecurringGiving,
  useCancelRecurringGiving,
  type RecurringGiving,
} from "@/hooks/use-giving";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";

type Action = "pause" | "resume" | "cancel";

const ACTION_COPY: Record<Action, { title: string; description: string; label: string }> = {
  pause: {
    title: "Pause Schedule",
    description:
      "Pause future automatic charges for this schedule? You can resume it any time.",
    label: "Pause",
  },
  resume: {
    title: "Resume Schedule",
    description: "Resume automatic charges on this schedule's next due date?",
    label: "Resume",
  },
  cancel: {
    title: "Cancel Schedule",
    description:
      "Permanently cancel this recurring giving schedule? This cannot be undone.",
    label: "Cancel",
  },
};

export default function RecurringGivingPage() {
  const { can } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const isAdminHq = !!profile?.isAdminHq;
  const [branchId, setBranchId] = React.useState("");
  const effectiveBranchId = isAdminHq ? branchId : profile?.branchId ?? "";
  const branchesQuery = useBranchesList({ limit: 100 }, { enabled: isAdminHq });
  const canUpdate = can("giving", "update");

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const { data, isLoading, error } = useRecurringGiving({
    page,
    limit: perPage,
    branchId: effectiveBranchId || undefined,
  });
  const pauseMutation = usePauseRecurringGiving();
  const resumeMutation = useResumeRecurringGiving();
  const cancelMutation = useCancelRecurringGiving();

  const schedules = data?.data ?? [];
  const meta = data?.meta;

  const [actionTarget, setActionTarget] = React.useState<{
    schedule: RecurringGiving;
    action: Action;
  } | null>(null);

  const handleConfirm = async () => {
    if (!actionTarget) return;
    const mutation =
      actionTarget.action === "pause"
        ? pauseMutation
        : actionTarget.action === "resume"
          ? resumeMutation
          : cancelMutation;
    try {
      await mutation.mutateAsync(actionTarget.schedule.id);
      toast.success(
        `${ACTION_COPY[actionTarget.action].label}d: ${actionTarget.schedule.memberName ?? "schedule"}`
      );
      setActionTarget(null);
    } catch (err) {
      toast.error(`Failed to ${actionTarget.action} schedule`, {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setActionTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Recurring Giving"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Giving", href: "/giving" },
            { label: "Recurring" },
          ]}
        />
        <ErrorState title="Failed to load recurring schedules." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recurring Giving"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Giving", href: "/giving" },
          { label: "Recurring" },
        ]}
      />

      <p className="text-sm text-muted-foreground">
        Schedules are created automatically when a giver completes their first online
        gift with &quot;make it recurring&quot; — manage them here.
      </p>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <span className="text-sm font-medium">Branch</span>
        {isAdminHq ? (
          <Select value={branchId || "all"} onValueChange={(value) => { setBranchId(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-52" aria-label="Branch filter"><SelectValue placeholder="All branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {(branchesQuery.data?.data ?? []).map((branch) => (
                <SelectItem key={branch.branchId} value={branch.branchId}>{branch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={profile?.branchId ?? "__no_branch__"} disabled>
            <SelectTrigger className="w-52" aria-label="Branch filter locked to your branch"><SelectValue placeholder={profile?.branch?.name ?? "Your branch"} /></SelectTrigger>
            <SelectContent><SelectItem value={profile?.branchId ?? "__no_branch__"}>{profile?.branch?.name ?? "Your branch"}</SelectItem></SelectContent>
          </Select>
        )}
      </div>

      <TableCard
        title="Recurring Schedules"
        itemName="schedules"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      >
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Repeat className="h-12 w-12" />}
                title="No recurring schedules yet"
                description="Schedules appear here after a giver sets up recurring giving online."
              />
            </div>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Giver</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Charge</TableHead>
                    <TableHead>Status</TableHead>
                    {canUpdate && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.memberName || s.memberId}
                      </TableCell>
                      <TableCell>{s.categoryName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {s.currency} {s.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize">{s.frequency}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {s.isActive && s.nextChargeDate
                          ? format(new Date(s.nextChargeDate), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={s.isActive ? "default" : "secondary"}>
                            {s.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {s.failedAttemptCount > 0 && (
                            <Badge variant="destructive">
                              {s.failedAttemptCount} failed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {canUpdate && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {s.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pauseMutation.isPending}
                                onClick={() => setActionTarget({ schedule: s, action: "pause" })}
                              >
                                <Pause className="h-3.5 w-3.5 mr-1" />
                                Pause
                              </Button>
                            )}
                            {!s.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resumeMutation.isPending}
                                onClick={() => setActionTarget({ schedule: s, action: "resume" })}
                              >
                                <Play className="h-3.5 w-3.5 mr-1" />
                                Resume
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={cancelMutation.isPending}
                              onClick={() => setActionTarget({ schedule: s, action: "cancel" })}
                            >
                              <RefreshCcwDot className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </TableCard>

      {/* Action confirmation */}
      <Dialog
        open={!!actionTarget}
        onOpenChange={(open) => !open && setActionTarget(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {actionTarget ? ACTION_COPY[actionTarget.action].title : ""}
            </DialogTitle>
            <DialogDescription>
              {actionTarget
                ? `${ACTION_COPY[actionTarget.action].description}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setActionTarget(null)}>
              Back
            </Button>
            <Button
              variant={actionTarget?.action === "cancel" ? "destructive" : "default"}
              onClick={() => void handleConfirm()}
              disabled={
                pauseMutation.isPending || resumeMutation.isPending || cancelMutation.isPending
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
