"use client";

import * as React from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { SettingsPanel } from "@/components/layouts/settings-panel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <Header />
      <SettingsPanel />

      <main className="page-wrapper">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
