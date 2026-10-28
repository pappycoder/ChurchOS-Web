"use client";
import * as React from "react";
function hasActions(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some(
    (child) =>
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      (child.type === React.Fragment ? hasActions(child.props.children) : true),
  );
}
/** Native disclosure keeps mutation triggers mounted for predictable focus return. */
export function RecordActions({ children, label = "Manage record" }: { children: React.ReactNode; label?: string }) {
  if (!hasActions(children)) return null;
  return (
    <details className="max-w-full rounded-lg border px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
        {label}
      </summary>
      <div
        role="group"
        aria-label="Record administration"
        className="mt-3 flex flex-wrap items-center gap-2"
      >
        {children}
      </div>
    </details>
  );
}
