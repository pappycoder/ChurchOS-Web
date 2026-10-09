"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** Persistent query failures stay visible; mutation feedback uses the toaster. */
export function ErrorState({
  title = "Unable to load this content",
  description = "Please try again. If this continues, come back in a moment.",
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/15 bg-destructive/5 px-6 py-12 text-center sm:py-16", className)}>
      <div className="mb-2 flex size-14 items-center justify-center rounded-2xl border border-destructive/15 bg-card text-destructive shadow-xs">
        <CircleAlert className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {onRetry && <Button variant="outline" className="mt-2" onClick={onRetry} disabled={retrying} loading={retrying}>
        <RotateCcw className="size-4" /> Try again
      </Button>}
    </div>
  );
}
