import { LoadingIndicator } from "@/components/shared/loading-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  variant?: "spinner" | "table" | "cards" | "detail";
  rows?: number;
  className?: string;
}

/** Layout-aware loading placeholders, without changing fetching behavior. */
export function LoadingState({ label = "Loading content", variant = "spinner", rows = 5, className }: LoadingStateProps) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={cn(variant === "spinner" ? "flex min-h-48 items-center justify-center rounded-2xl" : "space-y-4 p-4 sm:p-6", className)}>
      <span className="sr-only">{label}</span>
      {variant === "spinner" ? <LoadingIndicator size="lg" label={label} decorative /> : variant === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: rows }).map((_, i) => <div key={i} className="space-y-4 rounded-2xl border bg-card p-5"><Skeleton className="size-10 rounded-xl" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-7 w-1/2" /><Skeleton className="h-3 w-full" /></div>)}
        </div>
      ) : variant === "detail" ? <><Skeleton className="h-7 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-40 w-full" /><Skeleton className="h-4 w-5/6" /></> : (
        <div className="divide-y rounded-xl border">
          {Array.from({ length: rows }).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><Skeleton className="size-9 shrink-0 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-3/4" /></div><Skeleton className="hidden h-6 w-20 sm:block" /></div>)}
        </div>
      )}
    </div>
  );
}
