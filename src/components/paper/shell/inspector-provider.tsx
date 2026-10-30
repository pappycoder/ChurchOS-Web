"use client";

import * as React from "react";

export interface InspectorPayload {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  content: React.ReactNode;
  width?: "default" | "wide";
}

interface InspectorContextValue {
  payload: InspectorPayload | null;
  isOpen: boolean;
  open: (payload: InspectorPayload) => void;
  close: () => void;
}

const InspectorContext = React.createContext<InspectorContextValue | null>(null);

export function InspectorProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = React.useState<InspectorPayload | null>(null);

  const open = React.useCallback((next: InspectorPayload) => setPayload(next), []);
  const close = React.useCallback(() => setPayload(null), []);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const value = React.useMemo(
    () => ({ payload, isOpen: !!payload, open, close }),
    [payload, open, close],
  );

  return (
    <InspectorContext.Provider value={value}>
      {children}
    </InspectorContext.Provider>
  );
}

export function useInspector() {
  const ctx = React.useContext(InspectorContext);
  if (!ctx)
    throw new Error("useInspector must be used inside <InspectorProvider>");
  return ctx;
}
