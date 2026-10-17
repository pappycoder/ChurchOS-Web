"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings-context";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function ColorModeToggle({ className }: { className?: string }) {
  const { settings, updateSetting } = useSettings();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isDark = mounted && settings.theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(className)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => updateSetting("theme", isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
    </Button>
  );
}
