import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  decorative?: boolean;
}

/** Animated, accessible progress indicator for data and page loading states. */
export function LoadingIndicator({
  label = "Loading",
  size = "md",
  className,
  decorative = false,
}: LoadingIndicatorProps) {
  const sizeClass = size === "sm" ? "size-3.5" : size === "lg" ? "size-8" : "size-5";

  return (
    <span role={decorative ? undefined : "status"} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined} className={cn("inline-flex items-center justify-center text-primary", className)}>
      <LoaderCircle aria-hidden="true" className={cn(sizeClass, "animate-spin motion-reduce:animate-none")} />
      {!decorative && <span className="sr-only">{label}</span>}
    </span>
  );
}
