import { PRIVATE_ROBOTS } from "@/lib/seo";
export const metadata = { title: "Workspace", robots: PRIVATE_ROBOTS };
import { WorkspaceFrame } from "@/components/layouts/workspace-frame";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
