import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { WorkspaceShell } from "@/components/paper/shell/workspace-shell";

export const metadata: Metadata = {
  title: "Workspace",
  robots: PRIVATE_ROBOTS,
};

export default function PaperWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
