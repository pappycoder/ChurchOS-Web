"use client";

import * as React from "react";
import Link from "next/link";
import { FolderClosed, FolderOpen, HardDrive } from "lucide-react";
import { PageHeader } from "@/components/paper/section";
import { StatCard } from "@/components/paper/stat";
import { EmptyState } from "@/components/paper/primitives";
import { StaggerGroup, StaggerItem } from "@/components/paper/motion/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaFolders, formatDate } from "@/hooks/use-media";
import { number } from "@/lib/paper/format";

export default function MediaFoldersPage() {
  const folders = useMediaFolders();
  const rows = folders.data ?? [];
  const totalFiles = rows.reduce((sum, f) => sum + f.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/library/media" className="flex items-center gap-1.5 hover:text-ink">
            ← Library · Media
          </Link>
        }
        title="Folders, kept tidy on purpose."
        description="Organised by what the team actually reaches for: Sundays first, archives later."
        actions={
          <Button asChild variant="outline" className="h-9 gap-1.5 rounded-full border-line bg-card text-xs">
            <Link href="/library/media">
              <FolderOpen className="size-3.5" /> Open library
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Folders" value={rows.length} tone="terracotta" icon={<FolderClosed className="size-4" />} />
        <StatCard label="Files inside" value={totalFiles} tone="moss" deltaLabel="counted" />
        <StatCard label="Most recent activity" value={rows.filter((f) => f.newestAt).length} tone="sky" deltaLabel="folders with new arrivals" />
      </div>

      {folders.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<HardDrive />}
          title="No folders yet"
          description="Folders appear the first time something is uploaded there."
        />
      ) : (
        <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((folder, index) => (
            <StaggerItem key={folder.folder}>
              <Link
                href={`/library/media?folder=${encodeURIComponent(folder.folder)}`}
                className="paper-card lift flex h-full flex-col rounded-2xl p-5"
              >
                <div
                  className="h-1.5 w-full rounded-full"
                  style={{ background: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"][index % 5] }}
                />
                <div className="mt-3 flex flex-1 items-start justify-between">
                  <div>
                    <p className="font-display text-sm font-semibold">{folder.folder}</p>
                    <p className="num mt-1 text-[11px] text-ink-soft">{number(folder.count)} files</p>
                  </div>
                  <FolderClosed className="size-4 text-ink-faint" />
                </div>
                <p className="mt-3 border-t border-line/70 pt-3 text-[10px] text-ink-faint">
                  {folder.newestAt ? `newest ${formatDate(folder.newestAt)}` : "no files yet"}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <div className="paper-card rounded-2xl p-5">
        <p className="rule-label mb-3">Storage shape</p>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {rows.slice(0, 5).map((folder, index) => (
            <span
              key={folder.folder}
              title={`${folder.folder}: ${folder.count} files`}
              style={{
                width: `${totalFiles ? Math.max(4, Math.round((folder.count / totalFiles) * 100)) : 20}%`,
                background: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"][index % 5],
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-ink-faint">
          Folders are namespacing, not permissions — each file keeps its own public/members/leadership badge.
        </p>
      </div>
    </div>
  );
}
