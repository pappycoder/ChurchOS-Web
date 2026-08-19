"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapse: () => void;
  openMobile: () => void;
  closeMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "sidebarCollapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setCollapsed(true);
      document.body.classList.add("mini-sidebar");
    }
    setHydrated(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      if (next) {
        document.body.classList.add("mini-sidebar");
      } else {
        document.body.classList.remove("mini-sidebar");
        document.body.classList.remove("expand-menu");
      }
      return next;
    });
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
    document.body.classList.add("menu-opened");
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    document.body.classList.remove("menu-opened");
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, toggleCollapse, openMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
