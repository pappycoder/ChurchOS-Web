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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {loading && <div className="page-loader" />}
      <Sidebar />
      <Header />
      <SettingsPanel />

      <main className="page-wrapper">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
