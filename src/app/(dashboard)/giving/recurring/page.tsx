"use client";

import { RecurringGivingDialog } from "@/components/giving/recurring-giving-dialog";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { getToastErrorMessage, toast } from "@/lib/toast";
import { Pause, Play, RefreshCcwDot, Repeat, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import {
  GivingWorkspace,
  GivingHeader,
  GivingStatusBadge,
  givingWorkspaceClass,
  givingMoney,
} from "@/components/giving/giving-presentation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useRecurringPaymentOptions,
  usePauseRecurringGiving,
  useResumeRecurringGiving,
  useCancelRecurringGiving,
  type RecurringGiving,
} from "@/hooks/use-giving";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";

type Action = "pause" | "resume" | "cancel";

const ACTION_COPY: Record<
  Action,
  { title: string; description: string; label: string }
> = {
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
  const { canAny } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const isAdminHq = !!profile?.isAdminHq;
  const [branchId, setBranchId] = React.useState("");
  const effectiveBranchId = isAdminHq ? branchId : (profile?.branchId ?? "");
  const branchesQuery = useBranchesList({ limit: 100 }, { enabled: isAdminHq });
  const canUpdate = canAny("giving:recurring:update");
  const canCreate = canAny("giving:recurring:create");
  const paymentOptions = useRecurringPaymentOptions();
  const [createOpen, setCreateOpen] = React.useState(false);

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

  const actionTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const actionTriggers = React.useRef(new Map<string, HTMLButtonElement>());
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
        `${ACTION_COPY[actionTarget.action].label}d: ${actionTarget.schedule.memberName ?? "schedule"}`,
      );
      setActionTarget(null);
    } catch (err) {
      toast.error(`Failed to ${actionTarget.action} schedule`, {
        description: getToastErrorMessage(err, "Please try again."),
      });
      setActionTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <GivingHeader
          title="Recurring Giving"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Giving", href: "/giving" },
            { label: "Recurring" },
          ]}
        />
        <ErrorState title="Failed to load recurring schedules." />
      </div>
    );
  }

  return (
    <GivingWorkspace>
      <GivingHeader
        count={meta?.total}
        title="Recurring Giving"
        action={
          canCreate ? (
            <Button
              disabled={!paymentOptions.data?.recurringAvailable}
              onClick={() => setCreateOpen(true)}
            >
              Create Recurring Giving
            </Button>
          ) : undefined
        }
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Giving", href: "/giving" },
          { label: "Recurring" },
        ]}
      />

      {canCreate && paymentOptions.isError && (
        <p role="alert" className="text-sm">
          Unable to check payment availability.{" "}
          <Button
            variant="outline"
            onClick={() => void paymentOptions.refetch()}
          >
            Retry
          </Button>
        </p>
      )}
      {canCreate && paymentOptions.data?.recurringAvailable === false && (
        <p className="text-sm text-muted-foreground">
          Recurring giving requires an enabled Paystack account. Ask an
          administrator to check payment integration settings.
        </p>
      )}
      <RecurringGivingDialog
        presentationClassName={givingWorkspaceClass}
        open={createOpen}
        onOpenChange={setCreateOpen}
        branchId={effectiveBranchId || undefined}
      />
      <p className="text-sm text-muted-foreground">
        Create and manage recurring giving schedules for members in the selected
        branch.
      </p>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <span className="text-sm font-medium">Branch</span>
        {isAdminHq ? (
          <Select
            value={branchId || "all"}
            onValueChange={(value) => {
              setBranchId(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52" aria-label="Branch filter">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {(branchesQuery.data?.data ?? []).map((branch) => (
                <SelectItem key={branch.branchId} value={branch.branchId}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={profile?.branchId ?? "__no_branch__"} disabled>
            <SelectTrigger
              className="w-52"
              aria-label="Branch filter locked to your branch"
            >
              <SelectValue
                placeholder={profile?.branch?.name ?? "Your branch"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={profile?.branchId ?? "__no_branch__"}>
                {profile?.branch?.name ?? "Your branch"}
              </SelectItem>
            </SelectContent>
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
              description="Create a schedule or ask a giver to set up recurring giving online."
            />
          </div>
        ) : (
          <div className="overflow-x-auto px-4">
            <Table exportable>
              <TableHeader>
                <TableRow>
                  <TableHead>Giver</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Charge</TableHead>
                  <TableHead>Status</TableHead>
                  {canUpdate && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.memberName || s.memberId}
                    </TableCell>
                    <TableCell>{s.categoryName}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums font-medium">
                      {givingMoney(s.currency, s.amount)}
                    </TableCell>
                    <TableCell className="capitalize">{s.frequency}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {s.isActive && s.nextChargeDate
                        ? format(new Date(s.nextChargeDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <GivingStatusBadge
                          status={s.isActive ? "active" : "inactive"}
                        />
                        {s.failedAttemptCount > 0 && (
                          <Badge
                            variant="outline"
                            className="border-red-600/15 bg-red-500/8 text-red-700 dark:text-red-300"
                          >
                            {s.failedAttemptCount} failed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {canUpdate && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10"
                              aria-label={`Manage schedule for ${s.memberName || s.memberId}`}
                              ref={(element) => {
                                if (element)
                                  actionTriggers.current.set(s.id, element);
                                else actionTriggers.current.delete(s.id);
                              }}
                              disabled={
                                pauseMutation.isPending ||
                                resumeMutation.isPending ||
                                cancelMutation.isPending
                              }
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                actionTriggerRef.current =
                                  actionTriggers.current.get(s.id) ?? null;
                                setActionTarget({
                                  schedule: s,
                                  action: s.isActive ? "pause" : "resume",
                                });
                              }}
                            >
                              {s.isActive ? (
                                <Pause className="size-4" />
                              ) : (
                                <Play className="size-4" />
                              )}
                              {s.isActive ? "Pause" : "Resume"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => {
                                actionTriggerRef.current =
                                  actionTriggers.current.get(s.id) ?? null;
                                setActionTarget({
                                  schedule: s,
                                  action: "cancel",
                                });
                              }}
                            >
                              <RefreshCcwDot className="size-4" />
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        <DialogContent
          className={`${givingWorkspaceClass} sm:max-w-[400px]`}
          onCloseAutoFocus={(event) => {
            if (actionTriggerRef.current?.isConnected) {
              event.preventDefault();
              const target = actionTriggerRef.current;
              requestAnimationFrame(() => {
                if (target.isConnected) target.focus();
              });
            }
          }}
        >
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
              variant={
                actionTarget?.action === "cancel" ? "destructive" : "default"
              }
              onClick={() => void handleConfirm()}
              disabled={
                pauseMutation.isPending ||
                resumeMutation.isPending ||
                cancelMutation.isPending
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GivingWorkspace>
  );
}
