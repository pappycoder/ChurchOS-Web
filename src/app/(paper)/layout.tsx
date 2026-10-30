import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { WorkspaceShell } from "@/components/paper/shell/workspace-shell";
import { PaperBrandSync } from "@/components/paper/shell/paper-brand-sync";

export const metadata: Metadata = {
  title: "Workspace",
  robots: PRIVATE_ROBOTS,
};

export default function PaperWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PaperBrandSync />
      <WorkspaceShell>{children}</WorkspaceShell>
    </>
  );
}
