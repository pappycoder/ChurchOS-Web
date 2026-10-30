"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mic2, Users } from "lucide-react";
import { PageHeader } from "@/components/paper/section";
import { StatCard, Tag } from "@/components/paper/stat";
import { EmptyState, PersonAvatar } from "@/components/paper/primitives";
import { StaggerGroup, StaggerItem } from "@/components/paper/motion/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useSermonsSpeakers } from "@/hooks/use-sermons";
import { formatDate } from "@/hooks/use-media";

export default function SpeakersPage() {
  const router = useRouter();
  const speakers = useSermonsSpeakers();
  const rows = speakers.data ?? [];
  const total = rows.reduce((sum, s) => sum + s.count, 0);
  const mostHeard = [...rows].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library · Sermons"
        title="The voices in the room."
        description="Who has preached, how often, and what they&apos;ve given us to keep."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Speakers" value={rows.length} tone="terracotta" icon={<Mic2 className="size-4" />} />
        <StatCard label="Messages preached" value={total} tone="moss" icon={<Users className="size-4" />} />
        <StatCard label="Most heard" value={mostHeard?.count ?? 0} tone="sky" deltaLabel={mostHeard?.name ?? "—"} />
      </div>

      {speakers.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Mic2 />} title="No speakers yet" description="Names appear here as sermons record who spoke." />
      ) : (
        <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((item) => (
            <StaggerItem key={item.name}>
              <button
                type="button"
                onClick={() => router.push(`/library/sermons?speaker=${encodeURIComponent(item.name)}`)}
                className="paper-card lift flex h-full w-full flex-col rounded-2xl p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <PersonAvatar name={item.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">{item.name}</p>
                    <p className="num text-[11px] text-ink-faint">{item.count} messages on record</p>
                  </div>
                </div>
                <div className="mt-4 flex-1" />
                <div className="flex items-center justify-between border-t border-line/70 pt-3 text-[10px] text-ink-faint">
                  <span>latest {formatDate(item.lastDate)}</span>
                  <span className="flex items-center gap-1 text-terracotta">
                    <Tag tone="neutral">{item.name.split(" ").pop() ?? ""}</Tag>
                    <ChevronRight className="size-3" />
                  </span>
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
