import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statsCardVariants = cva("rounded-lg border p-4 bg-muted/50", {
  variants: {
    variant: {
      default: "",
      primary: "border-primary/20 bg-primary/5",
      success: "border-green-200 bg-green-50",
      warning: "border-yellow-200 bg-yellow-50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface StatsCardProps extends VariantProps<typeof statsCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant,
  className,
}: StatsCardProps) {
  return (
    <div className={cn(statsCardVariants({ variant }), className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-semibold">{value}</h3>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        )}
      </div>
    </div>
  );
}
