"use client";
import { usePathname } from "next/navigation";
import { TableColumnsProvider } from "@/contexts/table-columns-context";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { TopProgressBar } from "@/components/layouts/top-progress-bar";
import { PermissionRouteGate } from "@/components/shared/permission-route-gate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="main-wrapper min-h-dvh">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-background focus:p-3 focus:shadow-lg">Skip to content</a>
    <TopProgressBar />
    <Sidebar />
    <Header />
    <main id="main-content" className="page-wrapper min-h-dvh" tabIndex={-1}>
      <div className="px-4 pt-4 pb-8 md:px-6 md:pt-6 md:pb-10">
        <TableColumnsProvider key={pathname}><PermissionRouteGate>{children}</PermissionRouteGate></TableColumnsProvider>
      </div>
    </main>
  </div>;
}
