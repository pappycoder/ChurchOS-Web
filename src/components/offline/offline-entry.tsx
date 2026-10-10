"use client";
import { useEffect, useState } from "react";
import { WifiOff, HardDriveDownload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

const DISMISSED = "churchos-offline-banner-dismissed";

export function OfflineHeaderButton() {
  const { ready, can } = usePermissions();
  if (!ready || !can("offline", "read")) return null;
  return (
    <a
      href="/offline"
      className="btn-menubar inline-flex items-center gap-2"
      aria-label="Offline workspace"
      title="Offline workspace"
    >
      <HardDriveDownload size={18} aria-hidden="true" />
    </a>
  );
}

export function OfflineEntry() {
  const { ready, can } = usePermissions();
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISSED) === "true");
    } catch {
      setDismissed(false);
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!ready || !can("offline", "read") || dismissed) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2 text-sm">
      <span className="flex items-center gap-2">
        {offline ? (
          <>
            <WifiOff size={16} aria-hidden="true" />
            Connection lost. Use your prepared offline workspace.
          </>
        ) : (
          <>
            <HardDriveDownload size={16} aria-hidden="true" />
            Prepare this device to work offline.
          </>
        )}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/offline">Offline workspace</a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss offline banner"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(DISMISSED, "true");
            } catch {
              /* Optional preference. */
            }
          }}
        >
          <X size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
