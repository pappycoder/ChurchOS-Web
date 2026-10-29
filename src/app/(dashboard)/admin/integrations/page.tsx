import { WorkspaceHeader as PageHeader } from "@/components/workspace/workspace-presentation";
import { IntegrationSettingsTab } from "@/components/settings/integration-settings-tab";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Integrations" },
        ]}
      />
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            Your church’s connected services
          </h2>
          <p className="text-sm text-muted-foreground">
            Add your church’s provider credentials, check the account, then
            select it for each service below. Services are disabled by default.
            Choose provider account and save to enable a service using only your
            church’s keys. Email also needs a sender email. Provider usage
            charges apply separately.
          </p>
        </div>
        <IntegrationSettingsTab />
      </div>
    </div>
  );
}
