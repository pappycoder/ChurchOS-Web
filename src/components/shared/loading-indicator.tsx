import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Animated, accessible progress indicator for data and page loading states. */
export function LoadingIndicator({
  label = "Loading",
  size = "md",
  className,
}: LoadingIndicatorProps) {
  const sizeClass = size === "sm" ? "size-3.5" : size === "lg" ? "size-8" : "size-5";

  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center justify-center text-muted-foreground", className)}>
      <LoaderCircle aria-hidden="true" className={cn(sizeClass, "animate-spin")} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
