"use client";

import * as React from "react";
import { GeneralSettingsTab } from "@/components/settings/general-settings-tab";
import { PageHeader } from "@/components/paper/section";

export default function ChurchSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Church"
        title="The church&apos;s own details."
        description="Name, contact, location and preferences — the identity every export and receipt wears."
      />
      <GeneralSettingsTab />
    </div>
  );
}
