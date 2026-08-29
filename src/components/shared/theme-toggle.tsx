"use client";

import * as React from "react";
import { Settings } from "lucide-react";
import { ActionTooltip } from "@/components/ui/tooltip";

const themes = [
  { id: "", label: "Blue", color: "#2563EB" },
  { id: "theme-orange", label: "Orange", color: "#F26522" },
  { id: "theme-green", label: "Green", color: "#16A34A" },
  { id: "theme-purple", label: "Purple", color: "#7C3AED" },
];

export function ThemeToggle() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState("");

  React.useEffect(() => {
    const saved = localStorage.getItem("auth-theme") || "";
    setActive(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (themeId: string) => {
    const html = document.documentElement;
    html.classList.remove("theme-orange", "theme-green", "theme-purple");
    if (themeId) {
      html.classList.add(themeId);
    }
  };

  const handleSelect = (themeId: string) => {
    setActive(themeId);
    applyTheme(themeId);
    localStorage.setItem("auth-theme", themeId);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <ActionTooltip label={open ? "Close theme settings" : "Open theme settings"}>
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close theme settings" : "Open theme settings"}
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all hover:scale-110"
          style={{
            backgroundColor: "var(--primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Settings className="w-5 h-5" />
        </button>
      </ActionTooltip>

      {/* Color Swatches Panel */}
      {open && (
        <div
          className="absolute bottom-16 right-0 p-3 rounded-lg shadow-xl border bg-white"
          style={{ minWidth: 160 }}
        >
          <p
            className="mb-2 font-semibold text-xs uppercase tracking-wider"
            style={{ color: "#374151" }}
          >
            Theme Color
          </p>
          <div className="flex gap-2 flex-wrap">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className="flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: theme.color,
                  border: active === theme.id ? "3px solid #202C4B" : "2px solid #ededed",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  transform: active === theme.id ? "scale(1.1)" : "scale(1)",
                }}
                title={theme.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
