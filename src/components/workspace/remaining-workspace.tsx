"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./remaining-workspace.module.css";

const RemainingContext = createContext(false);
export const useRemainingWorkspace = () => useContext(RemainingContext);

const refreshedSections = new Set([
  "communication",
  "appointments",
  "departments",
  "assets",
  "pastoral",
  "forms",
  "reports",
  "analytics",
  "admin",
  "profile",
  "support",
]);

/** Opt in remaining authenticated sections without affecting completed modules. */
export function RemainingWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!refreshedSections.has(pathname.split("/")[1])) return children;
  return (
    <RemainingContext.Provider value={true}>
      <div className={styles.workspace} data-remaining-workspace>
        {children}
      </div>
    </RemainingContext.Provider>
  );
}

export const remainingWorkspaceClass = styles.workspace;
