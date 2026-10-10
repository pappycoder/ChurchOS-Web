"use client";
import * as React from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/** Reflect actual server work, with a short delay to avoid flashes. */
export function TopProgressBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const busy = fetching + mutating > 0;
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (!busy) { setVisible(false); return; }
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, [busy]);
  if (!visible) return null;
  return <div role="progressbar" aria-label="Updating content" className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/10"><div className="h-full w-1/3 bg-primary progress-slide" /></div>;
}
