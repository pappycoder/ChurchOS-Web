"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header sidebarCollapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />

      <main
        className={cn(
          "pt-[52px] transition-all duration-300",
          collapsed ? "ml-[70px]" : "ml-[252px]"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
