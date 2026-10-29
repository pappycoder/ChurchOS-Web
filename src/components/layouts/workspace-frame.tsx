"use client";
import { PlanLimitDialog } from "@/components/billing/plan-limit-dialog";
import { BillingNotice } from "@/components/billing/billing-notice";
import { usePathname } from "next/navigation";
import { TableColumnsProvider } from "@/contexts/table-columns-context";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TopProgressBar } from "@/components/layouts/top-progress-bar";
import { PermissionRouteGate } from "@/components/shared/permission-route-gate";
import { WorkspaceMotion } from "@/components/workspace/workspace-motion";
// Temporarily hidden until offline workspace returns in a future build.
// import { OfflineEntry } from "@/components/offline/offline-entry";

export function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
      <SidebarProvider data-workspace-root style={{ "--sidebar-width": "20rem", "--sidebar-width-icon": "4.5rem" } as React.CSSProperties}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:p-3 focus:shadow-lg"
        >
          Skip to content
        </a>
        <TopProgressBar />
        <Sidebar />
        <SidebarInset className="workspace-inset min-w-0">
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="workspace-main flex min-w-0 flex-1 flex-col"
          >
            {/* <OfflineEntry /> */}
            <BillingNotice />
            <PlanLimitDialog />
            <TableColumnsProvider key={pathname}>
              <PermissionRouteGate><WorkspaceMotion>{children}</WorkspaceMotion></PermissionRouteGate>
            </TableColumnsProvider>
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
