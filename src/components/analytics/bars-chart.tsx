"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
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
    <ChartContainer config={{ value: { label: valueLabel || "Total", color } }} style={{ height }} className="w-full aspect-auto">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) =>
              formatValue ? formatValue(Number(v)) : Number(v).toLocaleString()
            }
          />
          <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent formatter={(value) => <span className="font-medium tabular-nums">{formatValue ? formatValue(Number(value)) : `${Number(value).toLocaleString()} ${valueLabel ?? ""}`}</span>} />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
    </ChartContainer>
  );
}
