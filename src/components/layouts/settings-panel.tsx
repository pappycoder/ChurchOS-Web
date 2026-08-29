"use client";

import * as React from "react";
import { useSettings } from "@/contexts/settings-context";
import {
  DefaultThumb, MiniThumb, HorizontalThumb, HorizontalSingleThumb,
  DetachedThumb, TwoColumnThumb, WithoutHeaderThumb, OverlayThumb,
  MenuAsideThumb, StackedThumb, ModernThumb, TransparentThumb, RtlThumb,
} from "./theme-previews";
import { Sun, Moon, RotateCcw, ShoppingCart, X } from "lucide-react";
import { ActionTooltip } from "@/components/ui/tooltip";

function AccordionSection({ title, defaultOpen = true, children }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="accordion-item border-0 border-b border-border">
      <h2 className="accordion-header">
        <button
          onClick={() => setOpen(!open)}
          className="accordion-button w-full flex items-center justify-between py-3 px-0 bg-transparent text-foreground text-sm font-semibold"
          style={{ background: "none", border: 0, cursor: "pointer" }}
        >
          {title}
          <span
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
              fontSize: 10,
              color: "var(--muted-foreground)",
            }}
          >
            ▼
          </span>
        </button>
      </h2>
      {open && <div className="accordion-body pb-4">{children}</div>}
    </div>
  );
}

function SwatchRadio({ name, value, checked, onChange, color, size = 40 }: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  color: string;
  size?: number;
}) {
  return (
    <label style={{ cursor: "pointer" }}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span
        style={{
          width: size, height: size, borderRadius: 5, display: "block",
          background: color,
          border: checked ? "3px solid var(--primary)" : "2px solid var(--border)",
          boxShadow: color === "#FFFFFF" || color === "#fff" ? "inset 0 0 0 1px #e5e7eb" : "none",
        }}
      />
    </label>
  );
}

function ColorSetRadio({ value, checked, onChange, className }: {
  value: string;
  checked: boolean;
  onChange: () => void;
  className: string;
}) {
  return (
    <label style={{ cursor: "pointer" }}>
      <input type="radio" name="accent-color" value={value} checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span
        className={className}
        style={{
          width: 40, height: 40, borderRadius: 6, display: "flex",
          alignItems: "center", justifyContent: "center",
          border: checked ? "3px solid var(--primary)" : "2px solid var(--border)",
        }}
      >
        {checked && <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>}
      </span>
    </label>
  );
}

const SIDEBAR_COLORS = [
  { value: "light" as const, color: "#FFFFFF" },
  { value: "dark" as const, color: "#111827" },
  { value: "darkgreen" as const, color: "#1B5E20" },
  { value: "nightblue" as const, color: "#0D1B2A" },
  { value: "darkgray" as const, color: "#374151" },
  { value: "royalblue" as const, color: "#1565C0" },
  { value: "indigo" as const, color: "#283593" },
];

const THEME_COLORS = [
  { value: "primary" as const, className: "primary-clr" },
  { value: "brightblue" as const, className: "brightblue-clr" },
  { value: "lunargreen" as const, className: "lunargreen-clr" },
  { value: "lavendar" as const, className: "lavendar-clr" },
  { value: "magenta" as const, className: "magenta-clr" },
  { value: "chromeyellow" as const, className: "chromeyellow-clr" },
  { value: "lavared" as const, className: "lavared-clr" },
];

const TOPBAR_COLORS = [
  { value: "white" as const, color: "#FFFFFF" },
  { value: "darkaqua" as const, color: "#116D6E" },
  { value: "whiterock" as const, color: "#F0E4D7" },
  { value: "rockblue" as const, color: "#8CB9BD" },
  { value: "bluehaze" as const, color: "#B5C0D0" },
  { value: "orangegradient" as const, color: "linear-gradient(180deg, #FF9945, #FC6173)" },
  { value: "purplegradient" as const, color: "linear-gradient(180deg, #667CE8, #754EA7)" },
  { value: "bluegradient" as const, color: "linear-gradient(180deg, #00C0F9, #0257CE)" },
  { value: "maroongradient" as const, color: "linear-gradient(180deg, #EF3B4A, #513A8F)" },
];

const TOPBARCOLOR_COLORS = [
  { value: "white" as const, color: "#FFFFFF" },
  { value: "dark" as const, color: "#111827" },
  { value: "darkaqua" as const, color: "#116D6E" },
  { value: "whiterock" as const, color: "#F0E4D7" },
  { value: "rockblue" as const, color: "#8CB9BD" },
  { value: "bluehaze" as const, color: "#B5C0D0" },
  { value: "orangegradient" as const, color: "linear-gradient(180deg, #FF9945, #FC6173)" },
  { value: "purplegradient" as const, color: "linear-gradient(180deg, #667CE8, #754EA7)" },
  { value: "bluegradient" as const, color: "linear-gradient(180deg, #00C0F9, #0257CE)" },
  { value: "maroongradient" as const, color: "linear-gradient(180deg, #EF3B4A, #513A8F)" },
];

const SIDEBAR_BG_COLORS = [
  { value: "", color: "#FFFFFF", label: "Default" },
  { value: "darkgreen", color: "#1B5E20", label: "Dark Green" },
  { value: "nightblue", color: "#0D1B2A", label: "Night Blue" },
  { value: "darkgray", color: "#374151", label: "Dark Gray" },
  { value: "royalblue", color: "#1565C0", label: "Royal Blue" },
  { value: "indigo", color: "#283593", label: "Indigo" },
];

const TOPBAR_BG_COLORS = [
  { value: "", color: "#FFFFFF", label: "Default" },
  { value: "darkaqua", color: "#116D6E", label: "Dark Aqua" },
  { value: "whiterock", color: "#F0E4D7", label: "White Rock" },
  { value: "rockblue", color: "#8CB9BD", label: "Rock Blue" },
  { value: "bluehaze", color: "#B5C0D0", label: "Blue Haze" },
];

const LAYOUTS = [
  { value: "default" as const, label: "Default", Thumb: DefaultThumb },
  { value: "mini" as const, label: "Mini", Thumb: MiniThumb },
  { value: "horizontal" as const, label: "Horizontal", Thumb: HorizontalThumb },
  { value: "horizontal-single" as const, label: "H. Single", Thumb: HorizontalSingleThumb },
  { value: "detached" as const, label: "Detached", Thumb: DetachedThumb },
  { value: "twocolumn" as const, label: "Two Column", Thumb: TwoColumnThumb },
  { value: "without-header" as const, label: "No Header", Thumb: WithoutHeaderThumb },
  { value: "horizontal-overlay" as const, label: "Overlay", Thumb: OverlayThumb },
  { value: "horizontal-sidemenu" as const, label: "Menu Aside", Thumb: MenuAsideThumb },
  { value: "stacked" as const, label: "Stacked", Thumb: StackedThumb },
  { value: "modern" as const, label: "Modern", Thumb: ModernThumb },
  { value: "transparent" as const, label: "Transparent", Thumb: TransparentThumb },
];



export function SettingsPanel() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="sidebar-contact">
        <div
          className="toggle-theme"
          onClick={() => setOpen(true)}
          title="Theme Customizer"
        >
          <span style={{ display: "inline-block", animation: "fa-spin 2s infinite linear" }}>⚙</span>
        </div>
      </div>

      <div
        className={`settings-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />

      <div className={`settings-panel ${open ? "open" : ""}`}>
        <div className="settings-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3>Theme Customizer</h3>
            <p>Choose your themes & layouts etc.</p>
          </div>
          <ActionTooltip label="Close theme customizer">
            <button
              onClick={() => setOpen(false)}
              className="custom-btn-close"
              aria-label="Close theme customizer"
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 20 }}
            >
              <X size={20} />
            </button>
          </ActionTooltip>
        </div>

        <div className="settings-body">
          <div className="accordion accordion-customicon1 accordions-items-seperate" id="settingtheme">
            <AccordionSection title="Select Layouts">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {LAYOUTS.map((layout) => (
                  <label
                    key={layout.value}
                    style={{
                      border: settings.layout === layout.value ? "2px solid var(--primary)" : "1px solid var(--border)",
                      borderRadius: 6, padding: 6, cursor: "pointer", textAlign: "center",
                      background: settings.layout === layout.value ? "rgba(37, 99, 235, 0.04)" : "transparent",
                      display: "block",
                    }}
                  >
                    <input
                      type="radio" name="layout" value={layout.value}
                      checked={settings.layout === layout.value}
                      onChange={() => updateSetting("layout", layout.value)}
                      style={{ display: "none" }}
                    />
                    <div style={{ display: "block", marginBottom: 4 }}><layout.Thumb /></div>
                    <span style={{ fontSize: 10, fontWeight: 500, color: "var(--foreground)" }}>{layout.label}</span>
                  </label>
                ))}
                <label
                  style={{
                    border: settings.rtl ? "2px solid var(--primary)" : "1px solid var(--border)",
                    borderRadius: 6, padding: 6, cursor: "pointer", textAlign: "center",
                    background: settings.rtl ? "rgba(37, 99, 235, 0.04)" : "transparent",
                    display: "block",
                  }}
                >
                  <input
                    type="checkbox" name="rtl"
                    checked={settings.rtl}
                    onChange={() => updateSetting("rtl", !settings.rtl)}
                    style={{ display: "none" }}
                  />
                  <div style={{ display: "block", marginBottom: 4 }}><RtlThumb /></div>
                  <span style={{ fontSize: 10, fontWeight: 500, color: "var(--foreground)" }}>RTL</span>
                </label>
              </div>
            </AccordionSection>

            <AccordionSection title="Layout Width" defaultOpen={false}>
              <div style={{ display: "flex", gap: 16 }}>
                {(["fluid", "box"] as const).map((v) => (
                  <label key={v} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="radio" name="width" checked={settings.width === v} onChange={() => updateSetting("width", v)} style={{ accentColor: "var(--primary)" }} />
                    <span style={{ fontSize: 13 }}>{v === "fluid" ? "Fluid Layout" : "Boxed Layout"}</span>
                  </label>
                ))}
              </div>
            </AccordionSection>

            {settings.width === "box" && (
              <AccordionSection title="Boxed Backgrounds" defaultOpen={true}>
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Sidebar Background</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {SIDEBAR_BG_COLORS.map((c) => (
                      <SwatchRadio
                        key={c.value || "default"}
                        name="sidebar-bg"
                        value={c.value}
                        checked={settings.sidebarBg === c.value}
                        onChange={() => updateSetting("sidebarBg", c.value)}
                        color={c.color}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Topbar Background</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {TOPBAR_BG_COLORS.map((c) => (
                      <SwatchRadio
                        key={c.value || "default"}
                        name="topbar-bg"
                        value={c.value}
                        checked={settings.topbarBg === c.value}
                        onChange={() => updateSetting("topbarBg", c.value)}
                        color={c.color}
                      />
                    ))}
                  </div>
                </div>
              </AccordionSection>
            )}

            <AccordionSection title="Card Layout" defaultOpen={false}>
              <div style={{ display: "flex", gap: 16 }}>
                {(["bordered", "borderless", "shadow"] as const).map((v) => (
                  <label key={v} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="radio" name="card" checked={settings.card === v} onChange={() => updateSetting("card", v)} style={{ accentColor: "var(--primary)" }} />
                    <span style={{ fontSize: 13, textTransform: "capitalize" }}>{v}</span>
                  </label>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Sidebar Color">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {SIDEBAR_COLORS.map((c) => (
                  <div key={c.value} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <SwatchRadio name="sidebar-color" value={c.value} checked={settings.sidebar === c.value} onChange={() => updateSetting("sidebar", c.value)} color={c.color} />
                    <span style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "capitalize" }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Color Mode">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["light", "dark"] as const).map((v) => (
                  <label
                    key={v}
                    style={{
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 12px", borderRadius: 6,
                      border: settings.theme === v ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: settings.theme === v ? "rgba(37, 99, 235, 0.04)" : "transparent",
                    }}
                  >
                    <input type="radio" name="theme" checked={settings.theme === v} onChange={() => updateSetting("theme", v)} style={{ display: "none" }} />
                    {v === "light" ? <Sun size={18} style={{ color: settings.theme === v ? "#F59E0B" : "var(--muted-foreground)" }} /> : <Moon size={18} style={{ color: settings.theme === v ? "#F59E0B" : "var(--muted-foreground)" }} />}
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{v === "light" ? "Light Mode" : "Dark Mode"}</span>
                  </label>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Sidebar Size">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[
                  { value: "default" as const, label: "Default", Thumb: DefaultThumb },
                  { value: "compact" as const, label: "Compact", Thumb: MiniThumb },
                  { value: "hoverview" as const, label: "Hover View", Thumb: DefaultThumb },
                ].map((s) => (
                  <label
                    key={s.value}
                    style={{
                      border: settings.size === s.value ? "2px solid var(--primary)" : "1px solid var(--border)",
                      borderRadius: 6, padding: 6, cursor: "pointer", textAlign: "center", display: "block",
                      background: settings.size === s.value ? "rgba(37, 99, 235, 0.04)" : "transparent",
                    }}
                  >
                    <input type="radio" name="size" checked={settings.size === s.value} onChange={() => updateSetting("size", s.value)} style={{ display: "none" }} />
                    <div style={{ display: "block", marginBottom: 4 }}><s.Thumb /></div>
                    <span style={{ fontSize: 10, fontWeight: 500 }}>{s.label}</span>
                  </label>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Top Bar Color" defaultOpen={false}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {TOPBAR_COLORS.map((c) => (
                  <SwatchRadio key={c.value} name="topbar" value={c.value} checked={settings.topbar === c.value} onChange={() => updateSetting("topbar", c.value)} color={c.color} />
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Topbar Color Mode" defaultOpen={false}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {TOPBARCOLOR_COLORS.map((c) => (
                  <SwatchRadio key={c.value} name="topbarcolor" value={c.value} checked={settings.topbarcolor === c.value} onChange={() => updateSetting("topbarcolor", c.value)} color={c.color} />
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Theme Colors">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {THEME_COLORS.map((c) => (
                  <ColorSetRadio
                    key={c.value}
                    value={c.value}
                    checked={settings.color === c.value}
                    onChange={() => updateSetting("color", c.value)}
                    className={c.className}
                  />
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Preloader" defaultOpen={false}>
              <div style={{ display: "flex", gap: 16 }}>
                {(["enable", "disable"] as const).map((v) => (
                  <label key={v} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="radio" name="loader" checked={settings.loader === v} onChange={() => updateSetting("loader", v)} style={{ accentColor: "var(--primary)" }} />
                    <span style={{ fontSize: 13 }}>{v === "enable" ? "With Preloader" : "Without Preloader"}</span>
                  </label>
                ))}
              </div>
            </AccordionSection>
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button
            onClick={resetSettings}
            style={{
              padding: "8px 16px", borderRadius: 5, border: "1px solid var(--border)",
              background: "var(--background)", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13,
              fontWeight: 500, color: "var(--foreground)",
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={() => setOpen(false)}
            style={{
              padding: "8px 16px", borderRadius: 5, border: "none",
              background: "var(--primary)", color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <ShoppingCart size={14} /> Buy Product
          </button>
        </div>
      </div>
    </>
  );
}
