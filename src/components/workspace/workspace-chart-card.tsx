"use client";

import type { ReactNode } from "react";
import { BarChart3, type LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WorkspaceChartCardProps = {
  title: string;
  description: string;
  tone?: "blue" | "violet" | "teal" | "amber" | "pink";
  icon?: LucideIcon;
  query: { error: unknown; isLoading: boolean; isFetching: boolean; refetch: () => Promise<unknown> };
  children: ReactNode;
  className?: string;
};

/** Independent chart recovery; a failing source never hides neighbouring insights. */
export function WorkspaceChartCard({ title, description, icon: Icon = BarChart3, query, children, className, kind }: WorkspaceChartCardProps & { kind: "giving" | "attendance" }) {
  return <Card {...{ [`data-${kind}-chart`]: true }} className={cn("min-w-0", className)}>
    <CardHeader>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary"><Icon className="size-[18px]" aria-hidden="true" /></span>
        <div className="min-w-0"><CardTitle>{title}</CardTitle><CardDescription className="mt-1">{description}</CardDescription></div>
      </div>
    </CardHeader>
    <CardContent>
      {query.error ? <div role="alert" className="flex min-h-54 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Unable to load {title.toLowerCase()}.</p>
        <Button variant="outline" size="sm" disabled={query.isFetching} onClick={() => void query.refetch()}>Retry</Button>
      </div> : query.isLoading ? <Skeleton className="h-54 w-full rounded-xl" aria-label={`Loading ${title}`} /> : children}
    </CardContent>
  </Card>;
}
