"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { monthLabel } from "@/hooks/use-reports";

interface TrendPoint {
  month: string;
  total: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  loading?: boolean;
  color?: string;
}

const trendConfig = { total: { label: "Total", color: "var(--chart-1)" } } satisfies ChartConfig;

export function TrendChart({ data, loading, color }: TrendChartProps) {
  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No data in the selected range.
      </div>
    );
  }

  const config: ChartConfig = color
    ? { total: { label: "Total", color } }
    : trendConfig;

  const chartData = data.map((d) => ({
    month: monthLabel(d.month),
    total: d.total,
  }));

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--color-total)"
          fill="url(#trendFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}