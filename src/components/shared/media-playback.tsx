"use client";

import { useState } from "react";
import { mediaPlaybackUrl, videoEmbedUrl } from "@/lib/media-playback";

export function MediaPlayback({ src, kind, title }: { src: string; kind: "audio" | "video"; title: string }) {
  const url = mediaPlaybackUrl(src);
  const embed = kind === "video" ? videoEmbedUrl(src) : undefined;
  const [failedSource, setFailedSource] = useState<string>();
  if (!url) return <p role="alert" className="text-sm text-destructive">The recording link is invalid. Edit the sermon to update it.</p>;
  return (
    <div className="min-w-0 space-y-3">
      {embed ? (
        <iframe src={embed} title={title} className="aspect-video w-full rounded-md" allow="fullscreen; picture-in-picture" allowFullScreen />
      ) : kind === "audio" ? (
        <audio key={url} src={url} controls preload="metadata" aria-label={title} className="w-full" onError={() => setFailedSource(url)} />
      ) : (
        <video key={url} src={url} controls playsInline preload="metadata" aria-label={title} className="aspect-video w-full rounded-md bg-black" onError={() => setFailedSource(url)} />
      )}
      {failedSource === url && (
        <p role="status" className="text-sm text-muted-foreground">This recording could not play here. Open the original to view it, or check that the file is still available.</p>
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline underline-offset-4">
        Open {kind === "audio" ? "audio" : "video"} recording
      </a>
    </div>
  );
}
