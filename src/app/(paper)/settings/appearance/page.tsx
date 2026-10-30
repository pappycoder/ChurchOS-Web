"use client";

import * as React from "react";
import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { PageHeader, SectionCard } from "@/components/paper/section";
import { Tag } from "@/components/paper/stat";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "light", title: "Light", note: "Warm paper — the Sunday-morning default.", icon: Sun },
  { value: "dark", title: "Dark", note: "Charcoal ink for late ledgers and bright rooms.", icon: Moon },
  { value: "system", title: "System", note: "Follows the device. The quiet, sensible choice.", icon: Monitor },
] as const;

export default function SettingsAppearancePage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Appearance"
        title="The light you work in."
        description="One honest choice — how the workspace should look on this device."
      />

      <SectionCard eyebrow="Colour mode" title={mounted ? `Currently rendering in ${resolvedTheme === "dark" ? "charcoal ink" : "warm paper"}` : "Choosing…"} actions={<Tag tone="terracotta">{mounted ? (theme ?? "system") : "system"}</Tag>}>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((mode) => {
            const active = (theme ?? "system") === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(mode.value)}
                className={cn(
                  "paper-card flex flex-col items-start gap-3 rounded-2xl p-5 text-left transition-all",
                  active ? "border-terracotta/50 bg-terracotta-soft/30" : "lift hover:border-ink/20",
                )}
              >
                <span className={cn("grid size-10 place-items-center rounded-xl", active ? "bg-terracotta text-paper" : "bg-muted text-ink-faint")}>
                  <mode.icon className="size-4" />
                </span>
                <span>
                  <span className="block font-display text-sm font-semibold">{mode.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-faint">{mode.note}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-ink-faint">
          The Paper palette stays constant — terracotta, moss, gold and sky carry meaning across both lights, so a
          chart read at 6am says the same thing at 11pm.
        </p>
      </SectionCard>

      <div className="paper-card rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-ink-faint" />
          <p className="rule-label">The palette in the room</p>
        </div>
        <div className="mt-3 flex gap-2">
          {[
            ["var(--terracotta)", "terracotta · the accent"],
            ["var(--moss)", "moss · growth & good"],
            ["var(--gold)", "gold · attention"],
            ["var(--sky)", "sky · information"],
            ["var(--rose)", "rose · warnings"],
            ["var(--ink)", "ink · type"],
          ].map(([token, label]) => (
            <span key={token} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="h-8 w-full rounded-lg border border-line" style={{ background: token }} />
              <span className="text-center text-[8px] uppercase tracking-wider text-ink-faint">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
