"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ThemeColor = "primary" | "brightblue" | "lunargreen" | "lavendar" | "magenta" | "chromeyellow" | "lavared";
type SidebarColor = "light" | "dark" | "darkgreen" | "nightblue" | "darkgray" | "royalblue" | "indigo";
type TopbarColor = "white" | "dark" | "darkaqua" | "whiterock" | "rockblue" | "bluehaze" | "orangegradient" | "purplegradient" | "bluegradient" | "maroongradient";
type Layout = "default" | "mini" | "horizontal" | "horizontal-single" | "detached" | "twocolumn" | "without-header" | "horizontal-overlay" | "horizontal-sidemenu" | "stacked" | "modern" | "transparent";
type CardStyle = "bordered" | "borderless" | "shadow";
type Size = "default" | "compact" | "hoverview";
type Width = "fluid" | "box";
type Loader = "enable" | "disable";

type Settings = {
  theme: "light" | "dark";
  sidebar: SidebarColor;
  color: ThemeColor;
  layout: Layout;
  topbar: TopbarColor;
  topbarcolor: TopbarColor;
  sidebarBg: string;
  topbarBg: string;
  card: CardStyle;
  size: Size;
  width: Width;
  loader: Loader;
  rtl: boolean;
};

const DEFAULTS: Settings = {
  theme: "light",
  sidebar: "light",
  color: "primary",
  layout: "default",
  topbar: "white",
  topbarcolor: "white",
  sidebarBg: "",
  topbarBg: "",
  card: "bordered",
  size: "default",
  width: "fluid",
  loader: "disable",
  rtl: false,
};

const STORAGE_KEYS: Record<keyof Settings, string> = {
  theme: "theme",
  sidebar: "sidebarTheme",
  color: "color",
  layout: "layout",
  topbar: "topbar",
  topbarcolor: "topbarcolor",
  sidebarBg: "sidebarBg",
  topbarBg: "topbarBg",
  card: "card",
  size: "size",
  width: "width",
  loader: "loader",
  rtl: "rtl",
};

const VALID_LAYOUTS: Record<Layout, true> = {
  default: true,
  mini: true,
  horizontal: true,
  "horizontal-single": true,
  detached: true,
  twocolumn: true,
  "without-header": true,
  "horizontal-overlay": true,
  "horizontal-sidemenu": true,
  stacked: true,
  modern: true,
  transparent: true,
};

const VALID_SIDEBARS: Record<SidebarColor, true> = {
  light: true,
  dark: true,
  darkgreen: true,
  nightblue: true,
  darkgray: true,
  royalblue: true,
  indigo: true,
};

const VALID_TOPBARS: Record<TopbarColor, true> = {
  white: true,
  dark: true,
  darkaqua: true,
  whiterock: true,
  rockblue: true,
  bluehaze: true,
  orangegradient: true,
  purplegradient: true,
  bluegradient: true,
  maroongradient: true,
};

function readFromStorage(): Settings {
  const result = { ...DEFAULTS };

  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (storedTheme === "light" || storedTheme === "dark") result.theme = storedTheme;

  const storedSidebar = localStorage.getItem(STORAGE_KEYS.sidebar);
  if (storedSidebar && storedSidebar in VALID_SIDEBARS) result.sidebar = storedSidebar as SidebarColor;

  const storedColor = localStorage.getItem(STORAGE_KEYS.color);
  if (storedColor && isThemeColor(storedColor)) result.color = storedColor;

  const storedLayout = localStorage.getItem(STORAGE_KEYS.layout);
  if (storedLayout && storedLayout in VALID_LAYOUTS) result.layout = storedLayout as Layout;

  const storedTopbar = localStorage.getItem(STORAGE_KEYS.topbar);
  if (storedTopbar && storedTopbar in VALID_TOPBARS) result.topbar = storedTopbar as TopbarColor;

  const storedTopbarColor = localStorage.getItem(STORAGE_KEYS.topbarcolor);
  if (storedTopbarColor && storedTopbarColor in VALID_TOPBARS) result.topbarcolor = storedTopbarColor as TopbarColor;

  const storedSidebarBg = localStorage.getItem(STORAGE_KEYS.sidebarBg);
  if (storedSidebarBg !== null) result.sidebarBg = storedSidebarBg;

  const storedTopbarBg = localStorage.getItem(STORAGE_KEYS.topbarBg);
  if (storedTopbarBg !== null) result.topbarBg = storedTopbarBg;

  const storedCard = localStorage.getItem(STORAGE_KEYS.card);
  if (storedCard === "bordered" || storedCard === "borderless" || storedCard === "shadow") result.card = storedCard;

  const storedSize = localStorage.getItem(STORAGE_KEYS.size);
  if (storedSize === "default" || storedSize === "compact" || storedSize === "hoverview") result.size = storedSize;

  const storedWidth = localStorage.getItem(STORAGE_KEYS.width);
  if (storedWidth === "fluid" || storedWidth === "box") result.width = storedWidth;

  const storedLoader = localStorage.getItem(STORAGE_KEYS.loader);
  if (storedLoader === "enable" || storedLoader === "disable") result.loader = storedLoader;

  const storedRtl = localStorage.getItem(STORAGE_KEYS.rtl);
  if (storedRtl !== null) result.rtl = storedRtl === "true";

  return result;
}

function isThemeColor(value: string): value is ThemeColor {
  return ["primary", "brightblue", "lunargreen", "lavendar", "magenta", "chromeyellow", "lavared"].includes(value);
}

function applySettingsToDOM(settings: Settings) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;

  html.setAttribute("data-theme", settings.theme);
  html.setAttribute("data-sidebar", settings.sidebar);
  html.setAttribute("data-color", settings.color);
  html.setAttribute("data-layout", settings.layout);
  html.setAttribute("data-topbar", settings.topbar);
  html.setAttribute("data-topbarcolor", settings.topbarcolor);
  html.setAttribute("data-card", settings.card);
  html.setAttribute("data-size", settings.size);
  html.setAttribute("data-width", settings.width);
  html.setAttribute("data-loader", settings.loader);
  html.setAttribute("dir", settings.rtl ? "rtl" : "ltr");

  if (settings.sidebarBg) {
    body.setAttribute("data-sidebarbg", settings.sidebarBg);
  } else {
    body.removeAttribute("data-sidebarbg");
  }

  if (settings.topbarBg) {
    body.setAttribute("data-topbarbg", settings.topbarBg);
  } else {
    body.removeAttribute("data-topbarbg");
  }

  // Sync next-themes class to avoid conflicts
  html.classList.remove("light", "dark");
  html.classList.add(settings.theme);

  // Layout classes
  body.classList.remove(
    "mini-sidebar",
    "expand-menu",
    "menu-horizontal",
    "layout-box-mode",
    "layout-mode-rtl",
    "layout-detached",
    "layout-twocolumn",
    "layout-stacked",
    "layout-modern",
    "layout-transparent"
  );

  let layoutMini = 0;

  if (settings.layout === "mini") {
    body.classList.add("mini-sidebar");
    layoutMini = 1;
  }

  if (["horizontal", "horizontal-single", "horizontal-overlay"].includes(settings.layout)) {
    body.classList.add("menu-horizontal");
  }

  if (settings.layout === "detached") body.classList.add("layout-detached");
  if (settings.layout === "twocolumn") body.classList.add("layout-twocolumn");
  if (settings.layout === "stacked") body.classList.add("layout-stacked");
  if (settings.layout === "modern") body.classList.add("layout-modern");
  if (settings.layout === "transparent") body.classList.add("layout-transparent");

  // Size handling
  if (settings.size === "compact") {
    body.classList.add("mini-sidebar");
    layoutMini = 1;
  } else if (settings.size === "hoverview") {
    body.classList.add("expand-menu");
    if (layoutMini === 0) {
      body.classList.remove("mini-sidebar");
    }
  }

  // Width handling
  if (settings.width === "box") {
    body.classList.add("layout-box-mode");
    const isHorizontalBoxed = ["horizontal", "horizontal-single", "horizontal-overlay", "without-header"].includes(settings.layout);
    if (!isHorizontalBoxed) {
      body.classList.add("mini-sidebar");
      layoutMini = 1;
    }
  }

  // RTL
  if (settings.rtl) {
    body.classList.add("layout-mode-rtl");
  }
}

function saveToStorage(settings: Settings) {
  for (const key of Object.keys(STORAGE_KEYS) as (keyof Settings)[]) {
    localStorage.setItem(STORAGE_KEYS[key], String(settings[key]));
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
