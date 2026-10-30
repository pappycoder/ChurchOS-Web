"use client";

import { usePathname } from "next/navigation";
import { AuthShell } from "@/components/shared/auth-shell";
import { GuestOnly } from "@/components/shared/guest-only";
import { PublicPaperShell } from "@/components/shared/public-paper-shell";
import { WorkspaceShell } from "@/components/paper/shell/workspace-shell";
import { useAuth } from "@/hooks/use-auth";

export default function AuthRouteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const entry = pathname === "/login" || pathname === "/register";

  // Billing keeps one engine and two homes: signed-in users manage their
  // subscription inside the Paper workspace (dock and all); signed-out
  // visitors (fresh registration hand-off) get the same Paper design with
  // the marketing header instead of the workspace chrome.
  if (pathname === "/subscription" || pathname.startsWith("/subscription/")) {
    return user ? <WorkspaceShell>{children}</WorkspaceShell> : <PublicPaperShell>{children}</PublicPaperShell>;
  }

  return <AuthShell>{entry ? <GuestOnly key={pathname}>{children}</GuestOnly> : children}</AuthShell>;
}
