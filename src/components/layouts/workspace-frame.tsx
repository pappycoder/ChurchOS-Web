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
import { OfflineEntry } from "@/components/offline/offline-entry";

export function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:p-3 focus:shadow-lg"
      >
        Skip to content
      </a>
      <TopProgressBar />
      <Sidebar />
      <SidebarInset className="min-w-0">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-6 lg:px-8"
        >
          <OfflineEntry />
          <BillingNotice />
          <PlanLimitDialog />
          <TableColumnsProvider key={pathname}>
            <PermissionRouteGate>{children}</PermissionRouteGate>
          </TableColumnsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
