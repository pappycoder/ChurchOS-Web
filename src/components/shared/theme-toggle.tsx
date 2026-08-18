"use client";

import * as React from "react";
import { Settings } from "lucide-react";

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
    // Remove all theme classes
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
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all hover:scale-110"
        style={{
          backgroundColor: "var(--primary)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Color Swatches Panel */}
      {open && (
        <div
          className="absolute bottom-16 right-0 p-3 rounded-lg shadow-xl border"
          style={{ backgroundColor: "#fff", minWidth: 160 }}
        >
          <p
            className="mb-2 fw-semibold"
            style={{ fontSize: 12, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            Theme Color
          </p>
          <div className="d-flex gap-2 flex-wrap">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className="d-flex align-items-center justify-content-center"
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
