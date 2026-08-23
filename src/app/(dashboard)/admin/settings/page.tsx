"use client";

/**
 * @file Church settings page — a single route hosting both settings tabs in
 * the SmartHR grammar: breadcrumb header, solid top-tab strip (General
 * Settings · Security switched client-side), member/branch badges and the
 * two-column grid with a sticky left settings-list of the active tab's
 * sections plus one tall content card.
 */

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSettingsSections,
  SettingsSideNav,
  SettingsTabsNav,
  useScrollSpy,
  type SettingsTabId,
} from "@/components/settings/settings-nav";
import { GeneralSettingsTab } from "@/components/settings/general-settings-tab";
import { SecuritySettingsTab } from "@/components/settings/security-settings-tab";
import { useChurch, useCanManageChurch } from "@/hooks/use-church";

export default function ChurchSettingsPage() {
  const [activeTabId, setActiveTabId] = React.useState<SettingsTabId>("general");
  const churchQuery = useChurch();
  const canManage = useCanManageChurch();

  const sections = getSettingsSections(activeTabId);
  const activeSection = useScrollSpy();

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" breadcrumbs={[{ label: "Settings" }]} />

      <SettingsTabsNav activeId={activeTabId} onSelect={setActiveTabId} />

      {churchQuery.data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{churchQuery.data.memberCount} members</Badge>
          <Badge variant="secondary">{churchQuery.data.branchCount} branches</Badge>
          {!canManage && (
            <span className="text-xs">(read-only — only admins can make changes)</span>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <Card>
            <CardContent className="py-3">
              <SettingsSideNav sections={sections} activeId={activeSection} />
            </CardContent>
          </Card>
        </aside>

        <Card>
          <CardContent className="p-6">
            {activeTabId === "general" ? <GeneralSettingsTab /> : <SecuritySettingsTab />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
