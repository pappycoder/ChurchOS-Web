"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteCellGroup, type CellGroup } from "@/hooks/use-admin";

interface DeleteCellGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: CellGroup | null;
  onDeleted?: (groupId: string) => void;
}

export function DeleteCellGroupDialog({
  open,
  onOpenChange,
  group,
  onDeleted,
}: DeleteCellGroupDialogProps) {
  const deleteMutation = useDeleteCellGroup();

  const handleConfirm = () => {
    if (!group) return;
    deleteMutation.mutate(group.id, {
      onSuccess: () => {
        toast.success("Cell group deleted");
        onOpenChange(false);
        onDeleted?.(group.id);
      },
      onError: (error) => {
        toast.error("Failed to delete cell group", {
          description: error?.message || "Please try again.",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </span>
            Delete Cell Group
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{group?.name}</span>? Its members
            and attendance records will also be removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}