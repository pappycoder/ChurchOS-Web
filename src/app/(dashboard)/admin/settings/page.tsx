"use client";

/** Church settings with shared Shadcn navigation and forms. */

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getSettingsSections,
  SettingsSideNav,
  SettingsTabsNav,
  useScrollSpy,
  type SettingsTabId,
} from "@/components/settings/settings-nav";
import { MessagingIntegrationsTab } from "@/components/settings/messaging-integrations-tab";
import { GeneralSettingsTab } from "@/components/settings/general-settings-tab";
import { SecuritySettingsTab } from "@/components/settings/security-settings-tab";
import { useChurch } from "@/hooks/use-church";
import { usePermissions } from "@/hooks/use-permissions";

export default function ChurchSettingsPage() {
  const [activeTabId, setActiveTabId] = React.useState<SettingsTabId>("general");
  const churchQuery = useChurch();
  // Editing church settings requires the church_settings:update permission.
  const { can } = usePermissions();
  const canManage = can("church_settings", "update");
  const canReadMessaging = can("integrations", "read");

  const sections = getSettingsSections(activeTabId);
  const activeSection = useScrollSpy();

  return (
    <Tabs value={activeTabId} onValueChange={(value) => setActiveTabId(value as SettingsTabId)} className="space-y-4">
      <PageHeader title="Settings" breadcrumbs={[{ label: "Settings" }]} />

      <SettingsTabsNav showMessaging={canReadMessaging} />

      {churchQuery.data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{churchQuery.data.memberCount} members</Badge>
          <Badge variant="secondary">{churchQuery.data.branchCount} branches</Badge>
          {!canManage && (
            <span className="text-xs">(read-only — only admins can make changes)</span>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <Card>
            <CardContent className="py-3">
              <SettingsSideNav sections={sections} activeId={activeSection} />
            </CardContent>
          </Card>
        </aside>

        <Card>
          <CardContent className="p-6">
            <TabsContent value="general"><GeneralSettingsTab /></TabsContent>
            <TabsContent value="security"><SecuritySettingsTab /></TabsContent>
            {canReadMessaging && <TabsContent value="messaging"><MessagingIntegrationsTab /></TabsContent>}
          </CardContent>
        </Card>
      </div>
    </Tabs>
  );
}
