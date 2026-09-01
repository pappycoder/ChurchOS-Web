"use client";

import * as React from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { TopProgressBar } from "@/components/layouts/top-progress-bar";
import { useSettings } from "@/contexts/settings-context";
import { PermissionRouteGate } from "@/components/shared/permission-route-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const [loading, setLoading] = React.useState(settings.loader === "enable");

  React.useEffect(() => {
    if (settings.loader === "enable") {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
    setLoading(false);
  }, [settings.loader]);

  React.useEffect(() => {
    const resizePageWrapper = () => {
      const pageWrapper = document.querySelector(
        ".page-wrapper",
      ) as HTMLElement | null;
      if (pageWrapper) {
        pageWrapper.style.minHeight = `${window.innerHeight}px`;
      }
    };
    resizePageWrapper();
    window.addEventListener("resize", resizePageWrapper);
    return () => window.removeEventListener("resize", resizePageWrapper);
  }, []);

  return (
    <div className="main-wrapper min-h-screen">
      <TopProgressBar />
      <div id="global-loader" style={{ display: loading ? "block" : "none" }}>
        <div className="page-loader" />
      </div>
      <Sidebar />
      <Header />

      <main className="page-wrapper">
        <div className="px-4 pt-4 pb-0 md:px-6 md:pt-6 md:pb-6">
          <PermissionRouteGate>{children}</PermissionRouteGate>
        </div>
      </main>
    </div>
  );
}
