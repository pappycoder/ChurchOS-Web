"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
          <defs>
            <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.85} />
              <stop offset="95%" stopColor={color} stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow">
                  <div className="font-medium">{label}</div>
                  <div className="text-muted-foreground">
                    {Number(payload[0].value).toLocaleString()} {unit}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="value" fill="url(#histFill)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
