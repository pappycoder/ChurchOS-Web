"use client";

/**
 * @file Navigation chrome for the settings area, modeled on the SmartHR
 * settings pages: a solid top-tab strip switching between settings
 * categories (client-side state, one route) and a sticky left
 * settings-list of the active tab's section anchors with scrollspy.
 */

import * as React from "react";
import { ArrowRight, Settings, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsTabId = "general" | "security";

export interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: LucideIcon;
}

/** Settings categories — order matches the tab strip. */
export const SETTINGS_TABS: SettingsTab[] = [
  { id: "general", label: "General Settings", icon: Settings },
  { id: "security", label: "Security", icon: ShieldCheck },
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

/** Solid top-tab strip — active tab gets the primary underline treatment. */
export function SettingsTabsNav({
  activeId,
  onSelect,
}: {
  activeId: SettingsTabId;
  onSelect: (id: SettingsTabId) => void;
}) {
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex items-center gap-1 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Left settings-list card content. The active entry mirrors SmartHR's
 * arrow-badge-right treatment.
 */
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
            <ArrowRight className="mr-2 h-3.5 w-3.5" />
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
