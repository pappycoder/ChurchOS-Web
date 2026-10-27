"use client";
import { useEffect, useRef } from "react";

const activeDrafts = new Set<symbol>();
const handledLinks = new WeakSet<MouseEvent>();

/** Shared by links and explicit Back/Cancel buttons; successful mutations do not use it. */
export function confirmDiscardChanges() {
  return activeDrafts.size === 0 || window.confirm("You have unsaved changes. Leave this page and discard them?");
}

export function useUnsavedChanges(dirty: boolean) {
  const identity = useRef(Symbol("draft"));
  useEffect(() => {
    if (!dirty) return;
    const key = identity.current;
    activeDrafts.add(key);
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      if (handledLinks.has(event) || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const next = new URL(anchor.href, window.location.href);
      if (next.pathname === window.location.pathname && next.search === window.location.search) return;
      handledLinks.add(event);
      if (!confirmDiscardChanges()) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
    return () => { activeDrafts.delete(key); window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);
}
