"use client";

import { AuthShell } from "@/components/shared/auth-shell";
import { GuestOnly } from "@/components/shared/guest-only";
import { usePathname } from "next/navigation";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const entry = pathname === "/login" || pathname === "/register";
  return <AuthShell>{entry ? <GuestOnly key={pathname}>{children}</GuestOnly> : children}</AuthShell>;
}
