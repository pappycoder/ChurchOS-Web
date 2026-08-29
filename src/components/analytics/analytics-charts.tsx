"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DatePointEntry } from "@/hooks/use-analytics";
import { periodLabel } from "@/hooks/use-analytics";

interface AnalyticsTrendChartProps {
  data: DatePointEntry[];
  loading?: boolean;
  kind?: "single" | "split";
  formatValue?: (value: number) => string;
}

const singleConfig = { total: { label: "Total", color: "var(--chart-1)" } } satisfies ChartConfig;

const splitConfig = {
  members: { label: "Members", color: "var(--chart-1)" },
  visitors: { label: "Visitors", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function AnalyticsTrendChart({
  data,
  loading,
  kind = "single",
  formatValue,
}: AnalyticsTrendChartProps) {
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

  const chartData = data.map((d) => ({
    label: periodLabel(d.date),
    total: d.total,
    members: d.members,
    visitors: d.visitors,
  }));

  const config: ChartConfig = kind === "split" ? splitConfig : singleConfig;

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
        <defs>
          <linearGradient id="analysisSingle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0} />
          </linearGradient>
          {kind === "split" && (
            <>
              <linearGradient id="analysisMembers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-members)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-members)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="analysisVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0} />
              </linearGradient>
            </>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={
                formatValue
                  ? (value) => formatValue(Number(value))
                  : undefined
              }
            />
          }
        />
        {kind === "split" ? (
          <>
            <Area
              type="monotone"
              dataKey="members"
              stroke="var(--color-members)"
              fill="url(#analysisMembers)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="var(--color-visitors)"
              fill="url(#analysisVisitors)"
              strokeWidth={2}
            />
          </>
        ) : (
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--color-total)"
            fill="url(#analysisSingle)"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ChartContainer>
  );
}

interface AnalyticsBarsProps {
  data: Array<{ label: string; value: number }>;
  loading?: boolean;
  formatValue?: (value: number) => string;
}

const barConfig = { value: { label: "Value", color: "var(--chart-1)" } } satisfies ChartConfig;

export function AnalyticsBars({ data, loading, formatValue }: AnalyticsBarsProps) {
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

  return (
    <>
      <ChartContainer config={barConfig} className="h-56 w-full">
        <BarChart data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={
                  formatValue ? (value) => formatValue(Number(value)) : undefined
                }
              />
            }
          />
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </>
  );
}

interface AnalyticsLegendProps {
  entries: Array<{ name: string; value: number; color: string }>;
  formatValue?: (value: number) => string;
}

export function AnalyticsLegend({ entries, formatValue }: AnalyticsLegendProps) {
  if (entries.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No data yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {entries.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: entry.color }} />
          <span className="capitalize text-muted-foreground">{entry.name}</span>
          <span className="font-semibold tabular-nums">
            {formatValue ? formatValue(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
