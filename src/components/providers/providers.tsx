"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SettingsProvider } from "@/contexts/settings-context";
import { SidebarProvider } from "@/contexts/sidebar-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </AuthProvider>
      </SidebarProvider>
    </SettingsProvider>
  );
}
