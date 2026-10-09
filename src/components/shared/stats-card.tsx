import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statsCardVariants = cva("min-w-0 rounded-2xl border p-5 bg-card shadow-xs", {
  variants: {
    variant: {
      default: "",
      primary: "border-primary/20 bg-primary/5",
      success: "border-emerald-500/20 bg-emerald-500/5",
      warning: "border-amber-500/20 bg-amber-500/5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface StatsCardProps extends VariantProps<typeof statsCardVariants> {
  title: string;
  value: ReactNode;
  loading?: boolean;
  subtitle?: ReactNode;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({
  title,
  value,
  loading = false,
  subtitle,
  icon,
  trend,
  variant,
  className,
}: StatsCardProps) {
  return (
    <div className={cn(statsCardVariants({ variant }), className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {loading || value === "..." ? (
              <div role="status" aria-label={`Loading ${title}`}><Skeleton className="h-8 w-24" /></div>
            ) : <h3 className="break-words text-2xl font-semibold tracking-tight tabular-nums">{value}</h3>}
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                  trend.value >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                )}
              >
                {trend.value >= 0 ? <TrendingUp className="size-3" aria-hidden="true" /> : <TrendingDown className="size-3" aria-hidden="true" />}
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        </div>
        {icon && (
          <div className="shrink-0 p-2.5 rounded-xl bg-primary/8 text-primary [&_svg]:size-5">{icon}</div>
        )}
      </div>
    </div>
  );
}
