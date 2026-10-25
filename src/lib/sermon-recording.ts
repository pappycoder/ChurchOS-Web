import { MEDIA_UPLOAD_LIMITS } from "@/hooks/use-media";
import { mediaPlaybackUrl } from "@/lib/media-playback";

export type RecordingKind = "audio" | "video";
export interface SermonRecordingDraft {
  url: string;
  file: File | null;
  mode: "upload" | "url";
}

export function sermonRecordingDraft(
  url?: string | null,
): SermonRecordingDraft {
  return { url: url ?? "", file: null, mode: "upload" };
}

export function sermonRecordingError(
  draft: SermonRecordingDraft,
  kind: RecordingKind,
): string | undefined {
  if (draft.file) {
    if (!draft.file.type.startsWith(`${kind}/`))
      return `Choose an ${kind} file.`;
    if (draft.file.size > MEDIA_UPLOAD_LIMITS.fileBytes)
      return "Choose a file no larger than 50 MB.";
    return undefined;
  }
  const url = draft.url.trim();
  if (url && (!/^https?:\/\//i.test(url) || !mediaPlaybackUrl(url)))
    return "Enter a valid http or https recording link.";
  return undefined;
}
