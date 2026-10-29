"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Flattens evaluated permission branches while preserving the existing buttons/handlers. */
function actions(
  children: React.ReactNode,
): React.ReactElement<React.ComponentProps<typeof Button>>[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return [];
    if (child.type === React.Fragment) return actions(child.props.children);
    return child.type === Button
      ? [child as React.ReactElement<React.ComponentProps<typeof Button>>]
      : [];
  });
}

function labelledChildren(
  item: React.ReactElement<React.ComponentProps<typeof Button>>,
) {
  const label = item.props.title;
  if (!label) return item.props.children;
  if (
    item.props.asChild &&
    React.isValidElement<{ children?: React.ReactNode }>(item.props.children)
  ) {
    const child = item.props.children;
    return React.cloneElement(
      child,
      {},
      <>
        {child.props.children}
        <span>{label}</span>
      </>,
    );
  }
  const hasText = React.Children.toArray(item.props.children).some(
    (child) => typeof child === "string" && child.trim(),
  );
  return hasText ? (
    item.props.children
  ) : (
    <>
      {item.props.children}
      <span>{label}</span>
    </>
  );
}

export function WorkspaceManagementMenu({
  children,
  label,
  triggerRef,
  onOpenChange,
}: {
  children: React.ReactNode;
  label: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onOpenChange?: (open: boolean) => void;
}) {
  const items = actions(children);
  if (!items.length) return null;
  const ordered = [
    ...items.filter(
      (item) => !item.props.className?.includes("text-destructive"),
    ),
    ...items.filter((item) =>
      item.props.className?.includes("text-destructive"),
    ),
  ];
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label={label}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {ordered.map((item, index) => {
          const destructive =
            item.props.className?.includes("text-destructive");
          return (
            <React.Fragment key={index}>
              {destructive &&
                !ordered[index - 1]?.props.className?.includes(
                  "text-destructive",
                ) && <DropdownMenuSeparator />}
              <DropdownMenuItem
                asChild
                variant={destructive ? "destructive" : "default"}
              >
                {React.cloneElement(item, {
                  children: labelledChildren(item),
                  variant: "ghost",
                  className: `h-auto min-h-10 w-full justify-start rounded-sm px-2 py-1.5 text-sm font-normal shadow-none ${destructive ? "text-destructive" : ""}`,
                })}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WorkspaceRowMenu({
  children,
  label,
  returnFocusRef,
}: {
  children: React.ReactNode;
  label: string;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  return (
    <WorkspaceManagementMenu
      label={label}
      triggerRef={ref}
      onOpenChange={(open) => {
        if (open) returnFocusRef.current = ref.current;
      }}
    >
      {children}
    </WorkspaceManagementMenu>
  );
}
