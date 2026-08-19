"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Settings = {
  theme: "light" | "dark";
  sidebar: "light" | "darkgreen" | "nightblue" | "darkgray" | "royalblue" | "indigo";
  color: "primary" | "brightblue" | "lunargreen" | "lavendar" | "magenta" | "chromeyellow" | "lavared";
  layout: "default" | "mini" | "horizontal" | "horizontal-single" | "detached" | "twocolumn" | "without-header" | "horizontal-overlay" | "horizontal-sidemenu" | "stacked" | "modern" | "transparent";
  topbar: "white" | "darkaqua" | "whiterock" | "rockblue" | "bluehaze" | "orangegradient" | "purplegradient" | "bluegradient" | "maroongradient";
  card: "bordered" | "borderless" | "shadow";
  size: "default" | "compact" | "hoverview";
  width: "fluid" | "box";
  loader: "enable" | "disable";
};

const DEFAULTS: Settings = {
  theme: "light",
  sidebar: "light",
  color: "primary",
  layout: "default",
  topbar: "white",
  card: "bordered",
  size: "default",
  width: "fluid",
  loader: "disable",
};

const STORAGE_KEYS: Record<keyof Settings, string> = {
  theme: "theme",
  sidebar: "sidebarTheme",
  color: "color",
  layout: "layout",
  topbar: "topbar",
  card: "card",
  size: "size",
  width: "width",
  loader: "loader",
};

function readFromStorage(): Settings {
  const result = { ...DEFAULTS };
  for (const key of Object.keys(STORAGE_KEYS) as (keyof Settings)[]) {
    const stored = localStorage.getItem(STORAGE_KEYS[key]);
    if (stored && stored in getDefaultMap(key)) {
      (result as Record<string, string>)[key] = stored;
    }
  }
  return result;
}

function getDefaultMap(key: keyof Settings): Record<string, boolean> {
  const maps: Record<string, Record<string, boolean>> = {
    theme: { light: true, dark: true },
    sidebar: { light: true, darkgreen: true, nightblue: true, darkgray: true, royalblue: true, indigo: true },
    color: { primary: true, brightblue: true, lunargreen: true, lavendar: true, magenta: true, chromeyellow: true, lavared: true },
    layout: { default: true, mini: true, horizontal: true, "horizontal-single": true, detached: true, twocolumn: true, "without-header": true, "horizontal-overlay": true, "horizontal-sidemenu": true, stacked: true, modern: true, transparent: true },
    topbar: { white: true, darkaqua: true, whiterock: true, rockblue: true, bluehaze: true, orangegradient: true, purplegradient: true, bluegradient: true, maroongradient: true },
    card: { bordered: true, borderless: true, shadow: true },
    size: { default: true, compact: true, hoverview: true },
    width: { fluid: true, box: true },
    loader: { enable: true, disable: true },
  };
  return maps[key] || {};
}

function applySettingsToDOM(settings: Settings) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;

  html.setAttribute("data-theme", settings.theme);
  html.setAttribute("data-sidebar", settings.sidebar);
  html.setAttribute("data-color", settings.color);
  html.setAttribute("data-layout", settings.layout);
  html.setAttribute("data-topbar", settings.topbar);
  html.setAttribute("data-card", settings.card);
  html.setAttribute("data-size", settings.size);
  html.setAttribute("data-width", settings.width);
  html.setAttribute("data-loader", settings.loader);

  const body = document.body;
  let layoutMini = 0;

  if (settings.layout === "mini") {
    body.classList.add("mini-sidebar");
    layoutMini = 1;
  } else {
    body.classList.remove("mini-sidebar");
  }

  if (settings.size === "compact") {
    body.classList.add("mini-sidebar");
    body.classList.remove("expand-menu");
    layoutMini = 1;
  } else if (settings.size === "hoverview") {
    body.classList.add("expand-menu");
    if (layoutMini === 0) {
      body.classList.remove("mini-sidebar");
    }
  } else {
    if (layoutMini === 0) {
      body.classList.remove("mini-sidebar");
    }
    body.classList.remove("expand-menu");
  }

  if (settings.width === "box") {
    body.classList.add("layout-box-mode");
  } else {
    body.classList.remove("layout-box-mode");
  }
}

function saveToStorage(settings: Settings) {
  for (const key of Object.keys(STORAGE_KEYS) as (keyof Settings)[]) {
    localStorage.setItem(STORAGE_KEYS[key], settings[key]);
  }
}

type SettingsContextValue = {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = readFromStorage();
    setSettings(loaded);
    applySettingsToDOM(loaded);
    setHydrated(true);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        applySettingsToDOM(next);
        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULTS);
    applySettingsToDOM(DEFAULTS);
    saveToStorage(DEFAULTS);
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
