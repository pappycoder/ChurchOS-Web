"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

export interface HistogramBin {
  /** Bin label, e.g. "18–30" or "Under 18". */
  label: string;
  value: number;
}

interface HistogramChartProps {
  data: HistogramBin[];
  loading?: boolean;
  /** Unit label for the value axis / tooltip, e.g. "members". */
  unit?: string;
  color?: string;
  height?: number;
}

export function HistogramChart({
  data,
  loading,
  unit = "",
  color = "var(--chart-2)",
  height = 220,
}: HistogramChartProps) {
  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No data yet.
      </div>
    );
  }

  return (
    <ChartContainer config={{ value: { label: unit || "Total", color } }} style={{ height }} className="w-full aspect-auto">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={36}
          />
          <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent formatter={(value) => <span className="font-medium tabular-nums">{Number(value).toLocaleString()} {unit}</span>} />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
        </BarChart>
    </ChartContainer>
  );
}
