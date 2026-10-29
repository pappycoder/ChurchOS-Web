"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useCurrentProfile } from "@/hooks/use-profile";
import {
  accentTokens,
  appearanceKey,
  DEFAULT_ACCENT,
  normalizeAccent,
  readAccent,
} from "@/lib/workspace-appearance";

type Appearance = {
  accent: string;
  savedAccent: string;
  ready: boolean;
  storageError: boolean;
  preview: (accent: string) => void;
  cancel: () => void;
  save: () => boolean;
};
const Context = React.createContext<Appearance | null>(null);
export function WorkspaceAppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: profile } = useCurrentProfile();
  const { resolvedTheme } = useTheme();
  const key =
    profile?.profileId && profile.churchId
      ? appearanceKey(profile.profileId, profile.churchId)
      : "";
  const [state, setState] = React.useState({
    key: "",
    saved: DEFAULT_ACCENT,
    draft: DEFAULT_ACCENT,
    storageError: false,
  });
  const current =
    state.key === key
      ? state
      : {
          key,
          saved: DEFAULT_ACCENT,
          draft: DEFAULT_ACCENT,
          storageError: false,
        };
  React.useLayoutEffect(() => {
    if (!key) return;
    let saved = DEFAULT_ACCENT,
      storageError = false;
    try {
      saved = readAccent(localStorage.getItem(key));
    } catch {
      storageError = true;
    }
    setState({ key, saved, draft: saved, storageError });
    const sync = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage)
        return;
      if (event.key !== key && event.key !== null) return;
      const accent = readAccent(event.newValue);
      setState({ key, saved: accent, draft: accent, storageError: false });
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const tokens = accentTokens(current.draft, resolvedTheme === "dark");
    Object.entries(tokens).forEach(([name, value]) =>
      root.style.setProperty(name, value),
    );
    return () =>
      Object.keys(tokens).forEach((name) => root.style.removeProperty(name));
  }, [current.draft, resolvedTheme]);
  const preview = (accent: string) => {
    const valid = normalizeAccent(accent);
    if (key && valid)
      setState((previous) => ({
        ...(previous.key === key ? previous : current),
        draft: valid,
      }));
  };
  const cancel = () => setState({ ...current, draft: current.saved });
  const save = () => {
    if (!key) return false;
    let storageError = false;
    try {
      localStorage.setItem(key, JSON.stringify({ accent: current.draft }));
    } catch {
      storageError = true;
    }
    setState({ ...current, saved: current.draft, storageError });
    return !storageError;
  };
  return (
    <Context.Provider
      value={{
        accent: current.draft,
        savedAccent: current.saved,
        ready: !!key && state.key === key,
        storageError: current.storageError,
        preview,
        cancel,
        save,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspaceAppearance() {
  const value = React.useContext(Context);
  if (!value) throw new Error("Workspace appearance requires its provider");
  return value;
}
