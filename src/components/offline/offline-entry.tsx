"use client";
import { useEffect, useState } from "react";
import { WifiOff, HardDriveDownload } from "lucide-react";
import { Button } from "@/components/ui/button";
export function OfflineEntry() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2 text-sm">
      <span className="flex items-center gap-2">
        {offline ? (
          <>
            <WifiOff size={16} />
            Connection lost. Use your prepared offline workspace.
          </>
        ) : (
          <>
            <HardDriveDownload size={16} />
            Prepare this device to work offline.
          </>
        )}
      </span>
      <Button variant="outline" size="sm" asChild>
        <a href="/offline">Offline workspace</a>
      </Button>
    </div>
  );
}
