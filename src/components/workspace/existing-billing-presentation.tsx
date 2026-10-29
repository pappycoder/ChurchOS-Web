"use client";

import type { ReactNode } from "react";
import { WorkspaceAppearanceProvider } from "@/contexts/workspace-appearance-context";
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
    <WorkspaceAppearanceProvider>
      <div
        data-workspace-root
        data-remaining-workspace
        className={`${remainingWorkspaceClass} min-h-dvh w-full bg-background text-foreground`}
      >
        {children}
      </div>
    </WorkspaceAppearanceProvider>
  );
}
