"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const WorkspacePresentation = createContext(false);
export const useRemainingWorkspace = () => useContext(WorkspacePresentation);
export const remainingWorkspaceClass = "workspace-surface";

/** One presentation system for every authenticated route, including its editors. */
export function RemainingWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <WorkspacePresentation.Provider value={true}>
    <div className="workspace-surface" data-workspace-view={pathname.split("/")[1]}>{children}</div>
  </WorkspacePresentation.Provider>;
}
