"use client";

import * as React from "react";
import { IntegrationSettingsTab } from "@/components/settings/integration-settings-tab";
import { PageHeader } from "@/components/paper/section";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Church"
        title="Connect the tools behind the scenes."
        description="Email, messaging, calls and payments — provider accounts stay church-owned, encrypted and write-only."
      />
      <IntegrationSettingsTab />
    </div>
  );
}
