"use client";

import * as React from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getRoleLabel } from "@/hooks/use-users";

interface ResetRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function ResetRoleDialog({
  open,
  onOpenChange,
  roleName,
  onConfirm,
  isPending,
}: ResetRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset role to defaults
          </DialogTitle>
          <DialogDescription>
            This deletes every church-specific permission override for{" "}
            <span className="font-medium">{getRoleLabel(roleName)}</span> and
            restores the role&apos;s global defaults.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900/50 dark:bg-yellow-950/30">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
          <p className="text-muted-foreground">
            Members with this role lose any extra permissions immediately. This
            cannot be undone, but you can re-add permissions afterwards.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Resetting..." : "Reset to Defaults"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
