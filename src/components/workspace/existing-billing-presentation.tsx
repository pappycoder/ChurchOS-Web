"use client";

import type { ReactNode } from "react";
import { remainingWorkspaceClass } from "./remaining-workspace";

/** A previously activated subscription identifies the existing-account view. */
export function ExistingBillingPresentation({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) return children;
  return (
      <div
        data-workspace-root
        data-remaining-workspace
        className={`${remainingWorkspaceClass} min-h-dvh w-full bg-background text-foreground`}
      >
        {children}
      </div>
  );
}
