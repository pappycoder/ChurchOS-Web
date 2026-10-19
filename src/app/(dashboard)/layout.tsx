import { WorkspaceFrame } from "@/components/layouts/workspace-frame";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
