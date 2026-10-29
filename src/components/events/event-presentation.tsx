"use client";

import * as React from "react";
import { DetailManagementMenu } from "@/components/shared/detail-management-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_MAP, type EventType } from "@/hooks/use-events";
export {
  PeopleWorkspace as EventsWorkspace,
  PeopleHeader as EventsHeader,
  PeopleMoreFilters as EventsMoreFilters,
  PeopleFormSection as EventsFormSection,
  peopleWorkspaceClass as eventsWorkspaceClass,
} from "@/components/members/people-presentation";

export const eventTones: Record<EventType | "attendance", string> = {
  service: "border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-200",
  conference:
    "border-violet-500/20 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  lifecycle:
    "border-rose-500/20 bg-rose-500/10 text-rose-800 dark:text-rose-200",
  training:
    "border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  social:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  attendance:
    "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-200",
};
export function EventTypeBadge({ type }: { type: EventType }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full text-[11px] font-medium", eventTones[type])}
    >
      {EVENT_TYPE_MAP[type] ?? type}
    </Badge>
  );
}
export function EventStateBadge({ status }: { status: string }) {
  const tone = /^(paid|used|checked in|active)$/.test(status.toLowerCase())
    ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-800 dark:text-emerald-200"
    : /^(pending|reserved)$/.test(status.toLowerCase())
      ? "border-amber-500/20 bg-amber-500/8 text-amber-900 dark:text-amber-200"
      : /^(failed|cancelled|expired)$/.test(status.toLowerCase())
        ? "border-red-500/20 bg-red-500/8 text-red-800 dark:text-red-200"
        : "border-slate-500/20 bg-slate-500/8 text-slate-700 dark:text-slate-200";
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full text-[11px] font-medium capitalize", tone)}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function EventRowActions({
  label,
  actions,
  returnFocusRef,
}: Omit<React.ComponentProps<typeof DetailManagementMenu>, "triggerRef"> & {
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  return (
    <DetailManagementMenu
      label={label}
      triggerRef={triggerRef}
      actions={actions.map((action) => ({
        ...action,
        onSelect: () => {
          if (returnFocusRef) returnFocusRef.current = triggerRef.current;
          action.onSelect();
        },
      }))}
    />
  );
}
