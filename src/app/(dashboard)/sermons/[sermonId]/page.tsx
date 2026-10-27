"use client";
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
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
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
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function SermonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sermonId = params.sermonId as string;
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
      <div className="space-y-4">
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
          <Button variant="outline" onClick={() => { if (confirmDiscardChanges()) router.push("/sermons"); }}>
            Back to Sermons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            <Button variant="outline" size="sm" onClick={() => { if (confirmDiscardChanges()) router.back(); }}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmark}
              disabled={toggleBookmark.isPending}
             loading={toggleBookmark.isPending}>
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 mr-1" />
              ) : (
                <Bookmark className="h-4 w-4 mr-1" />
              )}
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
            {sermon.archivedAt ? (
              <>
                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArchiveTarget({ kind: "restore", sermon })}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setArchiveTarget({ kind: "purge", sermon })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Forever
                  </Button>
                )}
              </>
            ) : (
              <>
                {canUpdate && (
                  <Button size="sm" onClick={() => { if (confirmDiscardChanges()) router.push(`/sermons/${sermonId}/edit`); }}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArchiveTarget({ kind: "archive", sermon })}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {sermon.audioUrl && (
        <Card>
          <CardHeader><CardTitle role="heading" aria-level={2}>Audio Recording</CardTitle></CardHeader>
          <CardContent>
            <MediaPlayback src={sermon.audioUrl} kind="audio" title={`${sermon.title} — audio`} />
          </CardContent>
        </Card>
      )}
      {sermon.videoUrl && (
        <Card>
          <CardHeader><CardTitle role="heading" aria-level={2}>Video Recording</CardTitle></CardHeader>
          <CardContent>
            <MediaPlayback src={sermon.videoUrl} kind="video" title={`${sermon.title} — video`} />
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <BranchDetail record={sermon} />
          <DataRow
            label="Speaker"
            value={sermon.speaker}
          />
          <DataRow
            label="Date"
            value={format(new Date(sermon.sermonDate), "MMMM d, yyyy")}
          />
          <DataRow label="Scripture" value={sermon.scriptureReference} />
          <DataRow label="Series" value={sermon.seriesName} />
          <DataRow
            label="Duration"
            value={sermon.durationSeconds ? formatDuration(sermon.durationSeconds) : undefined}
          />
          {sermon.tags.length > 0 && (
            <div className="flex items-start gap-2 py-1.5">
              <span className="text-sm text-muted-foreground w-28 shrink-0">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {sermon.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {sermon.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {sermon.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
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
