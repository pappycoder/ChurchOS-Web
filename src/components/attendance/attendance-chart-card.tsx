"use client";

import * as React from "react";
import { BarChart3, type LucideIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type ChartQuery = {
  error: unknown;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
};
const tones = {
  blue: "from-blue-500/[0.07]",
  violet: "from-violet-500/[0.07]",
  teal: "from-teal-500/[0.07]",
  amber: "from-amber-500/[0.07]",
  pink: "from-pink-500/[0.07]",
};
export function AttendanceChartCard({
  title,
  description,
  tone = "blue",
  icon: Icon = BarChart3,
  query,
  children,
  className = "",
}: {
  title: string;
  description: string;
  tone?: keyof typeof tones;
  icon?: LucideIcon;
  query: ChartQuery;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      data-attendance-chart
      className={`min-w-0 gap-3 rounded-2xl bg-gradient-to-br ${tones[tone]} via-card to-card py-4 ${className}`}
    >
      <CardHeader className="px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/8 text-blue-600 dark:text-blue-300">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="mt-0.5 text-[11px]">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        {query.error ? (
          <div
            role="alert"
            className="flex h-44 flex-col items-center justify-center gap-2 text-center"
          >
            <p className="text-xs text-muted-foreground">
              Unable to load {title.toLowerCase()}.
            </p>
            <Button
              variant="ghost"
              size="sm"
              disabled={query.isFetching}
              onClick={() => {
                void query.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : query.isLoading ? (
          <Skeleton
            className="h-44 w-full rounded-xl"
            aria-label={`Loading ${title}`}
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
