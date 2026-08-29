"use client";

/**
 * Segmented "All | Archived" control used on list pages that support the
 * archive lifecycle. Switching clears any pending selection so batch actions
 * never bleed between the active and archived views.
 */

import * as React from "react";

export type ArchivedFilterValue = "all" | "archived";

interface ArchivedFilterProps {
  value: ArchivedFilterValue;
  onChange: (value: ArchivedFilterValue) => void;
  /** Optional: clears cross-view state (e.g. selected rows) on switch. */
  onClearSelection?: () => void;
}

export function ArchivedFilter({ value, onChange, onClearSelection }: ArchivedFilterProps) {
  const handleChange = (next: ArchivedFilterValue) => {
    if (next === value) return;
    onClearSelection?.();
    onChange(next);
  };

  return (
    <div className="flex items-center rounded-md border bg-muted p-0.5 text-sm">
      <button
        type="button"
        onClick={() => handleChange("all")}
        className={`rounded-sm px-3 py-1.5 font-medium transition-colors ${
          value === "all"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Active
      </button>
      <button
        type="button"
        onClick={() => handleChange("archived")}
        className={`rounded-sm px-3 py-1.5 font-medium transition-colors ${
          value === "archived"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Archived
      </button>
    </div>
  );
}