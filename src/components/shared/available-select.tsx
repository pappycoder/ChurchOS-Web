"use client";

import { useState, type ComponentProps } from "react";
import { Select } from "@/components/ui/select";
import { toast } from "@/lib/toast";

/** Keep unavailable choices out of an empty popup and report the action centrally. */
export function AvailableSelect({
  unavailableMessage,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ComponentProps<typeof Select> & { unavailableMessage?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return <Select
    {...props}
    open={unavailableMessage ? false : controlledOpen ?? open}
    onOpenChange={(nextOpen) => {
      if (nextOpen && unavailableMessage) {
        toast.error(unavailableMessage);
        return;
      }
      setOpen(nextOpen);
      onOpenChange?.(nextOpen);
    }}
  />;
}
