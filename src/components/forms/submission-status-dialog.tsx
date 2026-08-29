"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useUpdateSubmissionStatus,
  type FormSubmission,
  type SubmissionStatus,
} from "@/hooks/use-forms";

export interface SubmissionStatusDialogProps {
  formId: string;
  submission?: FormSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionStatusDialog({
  formId,
  submission,
  open,
  onOpenChange,
}: SubmissionStatusDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const mutation = useUpdateSubmissionStatus(formId);

  const handleAction = async (status: SubmissionStatus) => {
    if (!submission) return;
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("A rejection reason is required");
      return;
    }
    try {
      await mutation.mutateAsync({
        submissionId: submission.id,
        input: {
          status,
          ...(status === "rejected" ? { rejectionReason: rejectionReason.trim() } : {}),
        },
      });
      toast.success(status === "approved" ? "Submission approved" : "Submission rejected");
      setRejectionReason("");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update submission", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Review submission</DialogTitle>
          <DialogDescription>Approve or reject this submission.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="rejectionReason">Rejection reason (required when rejecting)</Label>
          <Textarea
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this submission is being rejected"
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => handleAction("rejected")}
            >
              Reject
            </Button>
            <Button
              type="button"
              disabled={mutation.isPending}
              onClick={() => handleAction("approved")}
            >
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
