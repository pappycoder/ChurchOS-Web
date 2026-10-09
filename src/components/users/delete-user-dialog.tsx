"use client";

import * as React from "react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeactivateUser } from "@/hooks/use-users";
import type { UserProfile } from "@/hooks/use-users";
import { AlertTriangle } from "lucide-react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** One or more users to deactivate. */
  users: UserProfile[];
  /** Called after all deactivations finish (even with partial failures). */
  onDeactivated?: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  users,
  onDeactivated,
}: DeleteUserDialogProps) {
  const deactivateMutation = useDeactivateUser();
  const [pendingCount, setPendingCount] = React.useState(0);

  const single = users.length === 1 ? users[0] : null;
  const displayName = (u: UserProfile) => `${u.firstName} ${u.lastName}`;

  const handleDeactivate = () => {
    if (users.length === 0) return;
    setPendingCount(users.length);

    let failed = 0;
    let done = 0;
    let succeeded = 0;

    users.forEach((user) => {
      deactivateMutation.mutate(user.profileId, {
        onSuccess: () => {
          succeeded++;
        },
        onError: (error) => {
          failed++;
          if (single || users.length <= 3) {
            toast.error(`Failed to deactivate ${displayName(user)}`, {
              description: error?.message || "Please try again.",
            });
          }
        },
        onSettled: () => {
          done++;
          setPendingCount(users.length - done);
          if (done === users.length) {
            if (!single && users.length > 3 && failed > 0) {
              toast.warning(
                `Deactivated ${succeeded} of ${users.length} users`,
                {
                  description:
                    "Some users could not be deactivated. Please try again.",
                }
              );
            } else if (!single && succeeded > 0) {
              toast.success(`${succeeded} user(s) deactivated`);
            }
            setPendingCount(0);
            // Single deletes stay open on failure so the error stays visible.
            if (!single || succeeded === users.length) {
              onOpenChange(false);
              if (succeeded > 0) onDeactivated?.();
            }
          }
        },
      });
    });
  };

  React.useEffect(() => {
    if (!open) {
      deactivateMutation.reset();
      setPendingCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">
            {single ? "Deactivate User" : `Deactivate ${users.length} Users`}
          </DialogTitle>
          <DialogDescription className="text-center">
            {single ? (
              <>
                Are you sure you want to deactivate{" "}
                <span className="font-medium text-foreground">
                  {displayName(single)}
                </span>
                ? They will no longer be able to sign in.
              </>
            ) : (
              <>
                Are you sure you want to deactivate{" "}
                <span className="font-medium text-foreground">
                  {users.length} users
                </span>
                ? They will no longer be able to sign in.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pendingCount > 0}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeactivate} disabled={pendingCount > 0}>
            {pendingCount > 0
              ? `Deactivating... (${users.length - pendingCount}/${users.length})`
              : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
