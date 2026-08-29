"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export interface BarsChartDatum {
  label: string;
  value: number;
}

interface BarsChartProps {
  data: BarsChartDatum[];
  loading?: boolean;
  /** Formatter for the value (e.g. naira), shown in axis labels + tooltip. */
  formatValue?: (value: number) => string;
  /** Label of the value axis for the tooltip, e.g. "Total (₦)". */
  valueLabel?: string;
  color?: string;
  height?: number;
}

export function BarsChart({
  data,
  loading,
  formatValue,
  valueLabel,
  color = "var(--chart-1)",
  height = 220,
}: BarsChartProps) {
  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No data in the selected range.
      </div>
    );
  }

  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) =>
              formatValue ? formatValue(Number(v)) : Number(v).toLocaleString()
            }
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = Number(payload[0].value ?? 0);
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow">
                  <div className="font-medium">{label}</div>
                  <div className="text-muted-foreground">
                    {formatValue ? formatValue(v) : `${v.toLocaleString()} ${valueLabel ?? ""}`}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
