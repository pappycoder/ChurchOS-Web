"use client";

import { AuthShell } from "@/components/shared/auth-shell";
import { GuestOnly } from "@/components/shared/guest-only";
import { usePathname } from "next/navigation";
export default function AuthRouteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const entry = pathname === "/login" || pathname === "/register";
  // The billing flow owns its full page (no split-panel container — that is
  // what cramped the checkout screens).
  if (pathname === "/subscription" || pathname.startsWith("/subscription/")) {
    return <>{children}</>;
  }
  return <AuthShell>{entry ? <GuestOnly key={pathname}>{children}</GuestOnly> : children}</AuthShell>;
}
