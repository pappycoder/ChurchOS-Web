"use client";

import { useTheme } from "next-themes";
import { createContext, useContext, useMemo } from "react";

type Settings = { theme: "light" | "dark" };
type SettingsContextValue = {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
};
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();
  const value = useMemo<SettingsContextValue>(() => ({
    settings: { theme: resolvedTheme === "dark" ? "dark" : "light" },
    updateSetting: (_key, theme) => setTheme(theme),
    resetSettings: () => setTheme("light"),
  }), [resolvedTheme, setTheme]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
}
