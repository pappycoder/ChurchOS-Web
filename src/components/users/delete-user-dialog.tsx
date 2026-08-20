"use client";

import * as React from "react";
import { toast } from "sonner";
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
  user: UserProfile | null;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
}: DeleteUserDialogProps) {
  const deactivateMutation = useDeactivateUser();

  const handleDeactivate = () => {
    if (!user) return;

    deactivateMutation.mutate(user.profileId, {
      onSuccess: () => {
        toast.success("User deactivated successfully");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Failed to deactivate user", {
          description: error?.message || "Please try again.",
        });
      },
    });
  };

  React.useEffect(() => {
    if (!open) {
      deactivateMutation.reset();
    }
  }, [open, deactivateMutation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Deactivate User</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to deactivate{" "}
            <span className="font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            ? They will no longer be able to sign in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deactivateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
