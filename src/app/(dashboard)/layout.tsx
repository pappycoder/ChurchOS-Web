import { PRIVATE_ROBOTS } from "@/lib/seo";
export const metadata = { title: "Workspace", robots: PRIVATE_ROBOTS };
import { RemainingWorkspace } from "@/components/workspace/remaining-workspace";
import { WorkspaceFrame } from "@/components/layouts/workspace-frame";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceFrame>
      <RemainingWorkspace>{children}</RemainingWorkspace>
    </WorkspaceFrame>
  );
}
