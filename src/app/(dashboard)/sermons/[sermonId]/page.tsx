"use client";
import { DetailManagementMenu } from "@/components/shared/detail-management-menu";
import { ErrorState } from "@/components/shared/error-state";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";
import { MediaPlayback } from "@/components/shared/media-playback";
import { BranchDetail } from "@/components/shared/branch-assignment";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Edit,
  Tag,
  CalendarDays,
  Mic2,
  BookOpen,
  FileAudio,
  FileVideo,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  SermonHeader as PageHeader,
  sermonWorkspaceClass,
  SermonMediaBadges,
  SermonSectionHeading,
} from "@/components/sermons/sermon-presentation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSermon,
  useIsBookmarked,
  useToggleBookmark,
  useDeleteSermon,
  useArchiveSermon,
  useRestoreArchiveSermon,
  type Sermon,
} from "@/hooks/use-sermons";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function DataRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-start gap-3 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words font-medium">{value}</span>
    </div>
  );
}

export default function SermonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sermonId = params.sermonId as string;
  const managementRef = React.useRef<HTMLButtonElement>(null);
  const { can } = usePermissions();
  const canUpdate = can("sermons", "update");
  const canDelete = can("sermons", "delete");

  const { data: sermon, isLoading, error } = useSermon(sermonId);
  const { data: bookmarkState } = useIsBookmarked(sermonId);
  const toggleBookmark = useToggleBookmark(sermonId);
  const deleteMutation = useDeleteSermon();
  const archiveMutation = useArchiveSermon();
  const restoreArchiveMutation = useRestoreArchiveSermon();

  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    sermon: Sermon;
  } | null>(null);

  const isBookmarked = bookmarkState?.bookmarked ?? false;

  const handleBookmark = () => {
    toggleBookmark.mutate(isBookmarked, {
      onSuccess: () => {
        toast.success(isBookmarked ? "Bookmark removed" : "Sermon bookmarked");
      },
    });
  };

  if (isLoading) {
    return (
      <div className={`${sermonWorkspaceClass} space-y-4`}>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !sermon) {
    return (
      <div>
        <PageHeader
          title="Sermon"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Sermons", href: "/sermons" },
            { label: "Unavailable" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <ErrorState title="Unable to load sermon" />
          <Button
            variant="outline"
            onClick={() => {
              if (confirmDiscardChanges()) router.push("/sermons");
            }}
          >
            Back to Sermons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sermonWorkspaceClass} space-y-4`}>
      <PageHeader
        title={sermon.title}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: sermon.title },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {sermon.archivedAt && (
              <Badge variant="destructive">
                <Archive className="mr-1 h-3 w-3" />
                Archived
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirmDiscardChanges()) router.back();
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmark}
              disabled={toggleBookmark.isPending}
              loading={toggleBookmark.isPending}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 mr-1" />
              ) : (
                <Bookmark className="h-4 w-4 mr-1" />
              )}
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
            <DetailManagementMenu
              label="Sermon management"
              triggerRef={managementRef}
              actions={[
                ...(!sermon.archivedAt && canUpdate
                  ? [
                      {
                        label: "Edit",
                        icon: Edit,
                        onSelect: () => {
                          if (confirmDiscardChanges())
                            router.push(`/sermons/${sermonId}/edit`);
                        },
                      },
                    ]
                  : []),
                ...(canUpdate
                  ? [
                      {
                        label: sermon.archivedAt ? "Restore" : "Archive",
                        icon: sermon.archivedAt ? RotateCcw : Archive,
                        onSelect: () =>
                          setArchiveTarget({
                            kind: sermon.archivedAt ? "restore" : "archive",
                            sermon,
                          }),
                      },
                    ]
                  : []),
                ...(sermon.archivedAt && canDelete
                  ? [
                      {
                        label: "Delete Forever",
                        icon: Trash2,
                        destructive: true,
                        onSelect: () =>
                          setArchiveTarget({ kind: "purge", sermon }),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        }
      />

      <section
        aria-label="Sermon summary"
        className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground"
      >
        {sermon.speaker && (
          <span className="flex items-center gap-1.5">
            <Mic2 className="size-3.5" aria-hidden="true" />
            {sermon.speaker}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {format(new Date(sermon.sermonDate), "MMMM d, yyyy")}
        </span>
        {sermon.scriptureReference && (
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5" aria-hidden="true" />
            {sermon.scriptureReference}
          </span>
        )}
        <SermonMediaBadges
          audioUrl={sermon.audioUrl}
          videoUrl={sermon.videoUrl}
        />
      </section>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <section aria-label="Sermon recordings" className="min-w-0 space-y-4">
          {sermon.audioUrl && (
            <Card>
              <CardHeader>
                <CardTitle role="heading" aria-level={2}>
                  <SermonSectionHeading icon={FileAudio}>
                    Audio Recording
                  </SermonSectionHeading>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MediaPlayback
                  src={sermon.audioUrl}
                  kind="audio"
                  title={`${sermon.title} — audio`}
                />
              </CardContent>
            </Card>
          )}
          {sermon.videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle role="heading" aria-level={2}>
                  <SermonSectionHeading icon={FileVideo}>
                    Video Recording
                  </SermonSectionHeading>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MediaPlayback
                  src={sermon.videoUrl}
                  kind="video"
                  title={`${sermon.title} — video`}
                />
              </CardContent>
            </Card>
          )}
          {!sermon.audioUrl && !sermon.videoUrl && (
            <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              No recordings attached to this sermon.
            </div>
          )}
        </section>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <SermonSectionHeading>Details</SermonSectionHeading>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <BranchDetail record={sermon} />
            <DataRow label="Series" value={sermon.seriesName} />
            <DataRow
              label="Duration"
              value={
                sermon.durationSeconds
                  ? formatDuration(sermon.durationSeconds)
                  : undefined
              }
            />
            {sermon.tags.length > 0 && (
              <div className="space-y-2 py-2">
                <span className="text-xs text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {sermon.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="gap-1 text-[11px] font-normal"
                    >
                      <Tag className="size-3" aria-hidden="true" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {sermon.description && (
              <section
                aria-label="Description"
                className="mt-3 space-y-2 border-t pt-3"
              >
                <h2 className="text-xs font-semibold">Description</h2>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                  {sermon.description}
                </p>
              </section>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        returnFocusRef={managementRef}
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="sermon"
        targetName={archiveTarget?.sermon.title}
        targetId={archiveTarget?.sermon.sermonId ?? ""}
        mutation={
          archiveTarget?.kind === "restore"
            ? restoreArchiveMutation
            : archiveTarget?.kind === "archive"
              ? archiveMutation
              : deleteMutation
        }
      />
    </div>
  );
}
