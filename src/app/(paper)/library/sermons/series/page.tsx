"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Layers, Radio } from "lucide-react";
import { PageHeader } from "@/components/paper/section";
import { StatCard, Tag } from "@/components/paper/stat";
import { EmptyState } from "@/components/paper/primitives";
import { StaggerGroup, StaggerItem } from "@/components/paper/motion/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useSermonsSeries } from "@/hooks/use-sermons";
import { formatDate } from "@/hooks/use-media";

export default function SermonSeriesPage() {
  const router = useRouter();
  const series = useSermonsSeries();
  const rows = series.data ?? [];
  const total = rows.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library · Sermons"
        title="Series — messages that keep talking."
        description="Collections people can binge, and preachers can plan a whole season around."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Series" value={rows.length} tone="brand" icon={<Layers className="size-4" />} />
        <StatCard label="Messages in series" value={total} tone="moss" deltaLabel="across the archive" />
        <StatCard label="Longest run" value={rows.reduce((max, s) => Math.max(max, s.count), 0)} tone="sky" deltaLabel="parts" />
      </div>

      {series.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title="No series yet"
          description="Series form as sermons share a name — a book-by-book plan starts here."
        />
      ) : (
        <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((item) => (
            <StaggerItem key={item.name}>
              <button
                type="button"
                onClick={() => router.push(`/library/sermons?series=${encodeURIComponent(item.name)}`)}
                className="paper-card lift flex h-full w-full flex-col rounded-2xl p-5 text-left"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Radio className="size-4" />
                  </span>
                  <Tag tone="neutral">{new Date(item.lastDate).getFullYear() || "—"}</Tag>
                </div>
                <p className="mt-3 flex-1 font-display text-base font-semibold leading-snug tracking-tight">{item.name}</p>
                <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-[11px] text-ink-faint">
                  <span className="num">{item.count} messages · last {formatDate(item.lastDate)}</span>
                  <ChevronRight className="size-3.5" />
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
