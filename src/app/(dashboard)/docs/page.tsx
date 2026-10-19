import { DashboardHelpHub } from "@/components/help/dashboard-help-hub";
import { helpSearchIndex } from "@/lib/help/content";
export default function DocsPage() {
  return <DashboardHelpHub index={helpSearchIndex()} />;
}
