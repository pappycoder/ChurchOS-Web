"use client";

import * as React from "react";
import { Check, RotateCcw } from "lucide-react";
import { useWorkspaceAppearance } from "@/contexts/workspace-appearance-context";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  normalizeAccent,
} from "@/lib/workspace-appearance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AppearanceDialog({
  open,
  onOpenChange,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const appearance = useWorkspaceAppearance();
  const [hex, setHex] = React.useState(appearance.savedAccent);
  const [saveWarning, setSaveWarning] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setHex(appearance.savedAccent);
      setSaveWarning(false);
    }
  }, [open, appearance.savedAccent]);
  const valid = normalizeAccent(hex);
  const choose = (value: string) => {
    setHex(value);
    appearance.preview(value);
  };
  const close = (value: boolean) => {
    if (!value) appearance.cancel();
    onOpenChange(value);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>
            Choose your dashboard accent for this church. Saved for your account
            in this browser; other users are unchanged.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium">Accent color</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.color}
                type="button"
                aria-label={`${preset.name} accent`}
                aria-pressed={appearance.accent === preset.color}
                onClick={() => choose(preset.color)}
                className="flex flex-col items-center gap-2 rounded-xl border p-2.5 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="relative flex size-7 items-center justify-center rounded-full border border-black/15"
                  style={{ backgroundColor: preset.color }}
                >
                  {appearance.accent === preset.color && (
                    <Check className="size-4 text-white" aria-hidden="true" />
                  )}
                </span>
                {preset.name}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="workspace-color">Custom color</Label>
              <input
                id="workspace-color"
                aria-label="Custom accent color"
                type="color"
                value={appearance.accent}
                onChange={(event) => choose(event.target.value)}
                className="block h-10 w-14 cursor-pointer rounded-lg border bg-card p-1"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="workspace-hex">Hex color</Label>
              <Input
                id="workspace-hex"
                value={hex}
                spellCheck={false}
                maxLength={7}
                aria-invalid={!valid}
                aria-describedby={!valid ? "accent-error" : undefined}
                onChange={(event) => {
                  setHex(event.target.value);
                  const color = normalizeAccent(event.target.value);
                  if (color) appearance.preview(color);
                }}
              />
            </div>
          </div>
          {!valid && (
            <p
              id="accent-error"
              role="alert"
              className="text-xs text-destructive"
            >
              Enter a six-digit hex color, such as #0f766e.
            </p>
          )}
        </fieldset>
        <section
          aria-label="Accent preview"
          className="space-y-3 rounded-xl border bg-muted/30 p-4"
        >
          <p className="text-xs font-medium text-muted-foreground">Preview</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button">Primary action</Button>
            <span className="rounded-lg border bg-card px-3 py-2 text-sm font-medium text-[var(--workspace-accent-readable)] shadow-[inset_3px_0_var(--workspace-accent-readable)]">
              Selected page
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Pages and sidebar stay neutral. Status and chart colors retain their
            meaning.
          </p>
        </section>
        {(appearance.storageError || saveWarning) && (
          <p role="status" className="rounded-lg border p-3 text-sm">
            Browser storage is unavailable. Your accent works for this session,
            but could not be saved for future visits.
          </p>
        )}
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => choose(DEFAULT_ACCENT)}>
            <RotateCcw className="size-4" />
            Reset to default
          </Button>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              disabled={!valid || !appearance.ready}
              onClick={() => {
                if (appearance.save()) {
                  onOpenChange(false);
                } else {
                  setSaveWarning(true);
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
