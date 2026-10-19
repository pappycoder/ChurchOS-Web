"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SettingsProvider } from "@/contexts/settings-context";
import { SupportChatProvider } from "@/components/support/support-chat-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={0}><SupportChatProvider>{children}</SupportChatProvider></TooltipProvider>
        </AuthProvider>
    </SettingsProvider>
  );
}
