"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Edit,
  Play,
  Pause,
  Tag,
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
} from "@/hooks/use-sermons";
import { usePermissions } from "@/hooks/use-permissions";

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/**
 * Extracts a YouTube embed URL from a watch/shorts/youtu.be link, or null.
 */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      if (u.hostname === "youtu.be") {
        const id = u.pathname.slice(1);
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname === "/watch" || u.pathname.startsWith("/watch/")) {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith("/embed/")) {
        return u.href;
      }
    }
    return null;
  } catch {
    return null;
  }
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

  const { data: sermon, isLoading, error } = useSermon(sermonId);
  const { data: bookmarkState } = useIsBookmarked(sermonId);
  const toggleBookmark = useToggleBookmark(sermonId);

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const isBookmarked = bookmarkState?.bookmarked ?? false;

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("ended", onEnd);
    };
  }, [sermon?.audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

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
            { label: "Not Found" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Sermon not found.</p>
          <Button variant="outline" onClick={() => router.push("/sermons")}>
            Back to Sermons
          </Button>
        </div>
      </div>
    );
  }

  const fmtTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmark}
              disabled={toggleBookmark.isPending}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 mr-1" />
              ) : (
                <Bookmark className="h-4 w-4 mr-1" />
              )}
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
            {canUpdate && (
              <Button size="sm" onClick={() => router.push(`/sermons/${sermonId}/edit`)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      {/* Audio Player */}
      {sermon.audioUrl && (
        <Card>
          <CardContent className="py-4">
            <audio ref={audioRef} src={sermon.audioUrl} preload="metadata" />
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                onClick={togglePlay}
              >
                {playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={seek}
                  className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{fmtTime(currentTime)}</span>
                  <span>{duration ? fmtTime(duration) : "--:--"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Player */}
      {sermon.videoUrl && (
        <Card>
          <CardContent className="py-4">
            {getYouTubeEmbedUrl(sermon.videoUrl) ? (
              <div className="aspect-video overflow-hidden rounded-md">
                <iframe
                  src={getYouTubeEmbedUrl(sermon.videoUrl)!}
                  title={sermon.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={sermon.videoUrl}
                controls
                className="aspect-video w-full rounded-md bg-black"
                preload="metadata"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
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
    </div>
  );
}
