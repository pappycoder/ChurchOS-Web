"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Pause,
  Play,
  RefreshCcwDot,
  Repeat,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  useRecurringGiving,
  usePauseRecurringGiving,
  useResumeRecurringGiving,
  useCancelRecurringGiving,
  type RecurringGiving,
} from "@/hooks/use-giving";
import { usePermissions } from "@/hooks/use-permissions";

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
  const canUpdate = can("giving", "update");

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const { data, isLoading, error } = useRecurringGiving({ page, limit: perPage });
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
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load recurring schedules.</p>
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

      <Card>
        <CardHeader className="pb-0" />
        <CardContent className="p-0">
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
        </CardContent>
      </Card>

      <TablePagination
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        itemName="schedules"
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />

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
