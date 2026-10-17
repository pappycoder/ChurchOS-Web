"use client";

/** Settings navigation built with shared Shadcn tabs and section links. */

import * as React from "react";
import { Settings, ShieldCheck, Plug, type LucideIcon } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SettingsTabId = "general" | "security" | "messaging";

export interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: LucideIcon;
}

/** Settings categories — order matches the tab strip. */
export const SETTINGS_TABS: SettingsTab[] = [
  { id: "general", label: "General Settings", icon: Settings },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "messaging", label: "Integrations", icon: Plug },
];

export interface SettingsSectionLink {
  id: string;
  label: string;
}

/** Left-nav entries per tab — order matches the DOM order of the sections. */
export const SETTINGS_SECTIONS_BY_TAB: Record<SettingsTabId, SettingsSectionLink[]> = {
  general: [
    { id: "church", label: "Church" },
    { id: "email", label: "Email" },
    { id: "preferences", label: "Preferences" },
  ],
  messaging: [{ id: "provider-accounts", label: "Provider accounts" }, { id: "channel-email", label: "Email" }, { id: "channel-whatsapp", label: "WhatsApp" }, { id: "channel-sms", label: "SMS" }, { id: "channel-voice", label: "Live calls" }, { id: "channel-payment", label: "Payments" }],
  security: [
    { id: "password", label: "Password" },
    { id: "two-factor", label: "Two-Factor Authentication" },
    { id: "email-verification", label: "Email Verification" },
  ],
};

/** Left-nav entries for a tab. */
export function getSettingsSections(tabId: SettingsTabId): SettingsSectionLink[] {
  return SETTINGS_SECTIONS_BY_TAB[tabId];
}

export function SettingsTabsNav({ showMessaging = false }: { showMessaging?: boolean }) {
  return <TabsList aria-label="Settings categories">
    {SETTINGS_TABS.filter((tab) => tab.id !== "messaging" || showMessaging).map((tab) => <TabsTrigger key={tab.id} value={tab.id}><tab.icon className="size-4" />{tab.label}</TabsTrigger>)}
  </TabsList>;
}

export function SettingsSideNav({
  sections,
  activeId,
}: {
  sections: SettingsSectionLink[];
  activeId: string;
}) {
  if (sections.length === 0) return null;
  return (
    <nav className="flex flex-col gap-0.5">
      {sections.map((section) =>
        section.id === activeId ? (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current="true"
            className="inline-flex items-center rounded px-3 py-2 text-sm font-medium text-foreground transition-colors bg-muted"
          >
            {section.label}
          </a>
        ) : (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex items-center rounded px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            {section.label}
          </a>
        ),
      )}
    </nav>
  );
}

/**
 * Tracks which `[data-settings-section]` element is currently in view.
 * Uses a MutationObserver so sections mounted after async data loads (or
 * tab switches) are picked up automatically.
 */
export function useScrollSpy(): string {
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -66% 0px" },
    );

    const observed = new Set<Element>();
    const scan = () => {
      document.querySelectorAll("[data-settings-section]").forEach((el) => {
        if (!observed.has(el)) {
          observer.observe(el);
          observed.add(el);
        }
      });
    };
    scan();
    const mutation = new MutationObserver(scan);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return activeId;
}
