"use client";

import * as React from "react";
import type { UseMutationResult } from "@tanstack/react-query";
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
import { Archive, ArchiveRestore, AlertTriangle } from "lucide-react";

export type ArchiveDialogKind = "archive" | "restore" | "purge";

const COPY: Record<
  ArchiveDialogKind,
  { title: (label: string, name?: string | null) => string; body: (label: string) => string }
> = {
  archive: {
    title: (label, name) => (name ? `Archive ${name}` : `Archive ${label}`),
    body: (label) =>
      `This ${label} will be hidden from active lists, but their record is kept. You can restore them anytime from the Archived view.`,
  },
  restore: {
    title: (label, name) => (name ? `Restore ${name}` : `Restore ${label}`),
    body: (label) =>
      `This ${label} will reappear in active lists.`,
  },
  purge: {
    title: (label, name) => (name ? `Delete ${name} forever?` : `Delete this ${label} forever?`),
    body: () =>
      `This permanently deletes the record and cannot be undone. Consider archiving instead if you may need it again.`,
  },
};

interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ArchiveDialogKind;
  entityLabel: string;
  targetName?: string | null;
  targetId: string;
  mutation: UseMutationResult<unknown, Error, string>;
  /** Called after a successful action. */
  onConfirmed?: () => void;
}

export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  kind,
  entityLabel,
  targetName,
  targetId,
  mutation,
  onConfirmed,
}: ArchiveConfirmDialogProps) {
  const isPurge = kind === "purge";
  const Icon = isPurge ? AlertTriangle : kind === "archive" ? Archive : ArchiveRestore;
  const copy = COPY[kind];

  const handleConfirm = () => {
    mutation.mutate(targetId, {
      onSuccess: () => {
        toast.success(
          kind === "archive"
            ? `${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} archived`
            : kind === "restore"
              ? `${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} restored`
              : "Deleted forever"
        );
        onOpenChange(false);
        onConfirmed?.();
      },
      onError: (error: Error) => {
        toast.error(
          kind === "archive"
            ? `Failed to archive ${entityLabel}`
            : kind === "restore"
              ? `Failed to restore ${entityLabel}`
              : "Failed to delete",
          { description: error?.message || "Please try again." }
        );
      },
    });
  };

  React.useEffect(() => {
    if (!open) mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              isPurge ? "bg-destructive/10" : "bg-primary/10"
            }`}
          >
            <Icon className={`h-6 w-6 ${isPurge ? "text-destructive" : "text-primary"}`} />
          </div>
          <DialogTitle className="text-center">
            {copy.title(entityLabel, targetName)}
          </DialogTitle>
          <DialogDescription className="text-center">
            {copy.body(entityLabel)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isPurge ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? kind === "archive"
                ? "Archiving..."
                : kind === "restore"
                  ? "Restoring..."
                  : "Deleting..."
              : kind === "archive"
                ? "Archive"
                : kind === "restore"
                  ? "Restore"
                  : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}