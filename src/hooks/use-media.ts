"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

/** Shape returned by the media library endpoints (MediaAssetResponseDto). */
export interface MediaAsset {
  assetId: string;
  churchId: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
  permissions: "public" | "members" | "leadership";
  createdAt: string;
}

export interface MediaLibraryResponse {
  data: MediaAsset[];
  total: number;
}

export interface UploadMediaResponse {
  assetId: string;
  url: string;
  path: string;
  width?: number;
  height?: number;
  size: number;
  contentType: string;
}

export type MediaSortBy = "created_at" | "filename" | "size_bytes";
export type MediaSortOrder = "asc" | "desc";

export interface ListMediaParams {
  page?: number;
  limit?: number;
  folder?: string;
  mimeType?: string;
  permissions?: "public" | "members" | "leadership";
  search?: string;
  sortBy?: MediaSortBy;
  sortOrder?: MediaSortOrder;
}

export interface UpdateMediaPermissionsInput {
  assetId: string;
  permissions: MediaAsset["permissions"];
}

export const MEDIA_PERMISSION_LABELS: Record<MediaAsset["permissions"], string> = {
  public: "Public",
  members: "Members",
  leadership: "Leadership",
};

export const MEDIA_PERMISSION_TEXT: Record<
  MediaAsset["permissions"],
  string
> = {
  public: "text-sky-600",
  members: "text-emerald-600",
  leadership: "text-amber-600",
};

export type MediaKind = "image" | "audio" | "video" | "document";

const MIME_KIND_PREFIXES: Record<MediaKind, string> = {
  image: "image/",
  audio: "audio/",
  video: "video/",
  document: "application/",
};

export function classifyMime(mimeType: string): MediaKind {
  for (const kind of Object.keys(MIME_KIND_PREFIXES) as MediaKind[]) {
    if (mimeType.startsWith(MIME_KIND_PREFIXES[kind])) return kind;
  }
  return "document";
}

export function mimePrefixForKind(kind: MediaKind | "all"): string | undefined {
  return kind === "all" ? undefined : MIME_KIND_PREFIXES[kind];
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

// ─── Helpers ─────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function invalidateMediaCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["media-library"] });
  qc.invalidateQueries({ queryKey: ["media-folders"] });
}

function invalidateMediaAssetCaches(qc: ReturnType<typeof useQueryClient>, assetId: string) {
  qc.invalidateQueries({ queryKey: ["media-asset", assetId] });
  invalidateMediaCaches(qc);
}

// ─── Library (paginated) ─────────────────────────────────

export function useMediaLibrary(params: ListMediaParams = {}) {
  return useQuery({
    queryKey: ["media-library", params],
    queryFn: () =>
      api.get<MediaLibraryResponse>(`/media/library${buildQuery({ ...params })}`),
  });
}

// ─── Folders ─────────────────────────────────────────────

export function useMediaFolders() {
  return useQuery({
    queryKey: ["media-folders"],
    queryFn: async () => {
      const res = await api.get<{ data: string[] }>("/media/library/folders");
      return res.data;
    },
  });
}

// ─── Single asset ────────────────────────────────────────

export function useMediaAsset(assetId: string) {
  return useQuery({
    queryKey: ["media-asset", assetId],
    queryFn: () => api.get<MediaAsset>(`/media/library/${assetId}`),
    enabled: !!assetId,
  });
}

// ─── Mutations ───────────────────────────────────────────

export function useUpdateMediaPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, permissions }: UpdateMediaPermissionsInput) =>
      api.patch<MediaAsset>(`/media/library/${assetId}/permissions`, { permissions }),
    onSuccess: (_data, { assetId }) => invalidateMediaAssetCaches(qc, assetId),
  });
}

export function useDeleteMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => api.delete<void>(`/media/library/${assetId}`),
    onSuccess: () => invalidateMediaCaches(qc),
  });
}

export function useUploadMediaFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const isImage = file.type.startsWith("image/");
      return api.post<UploadMediaResponse>(
        isImage ? "/media/upload/image" : "/media/upload",
        form,
      );
    },
    onSuccess: () => invalidateMediaCaches(qc),
  });
}

export const MEDIA_UPLOAD_LIMITS = {
  imageBytes: 5 * 1024 * 1024,
  fileBytes: 50 * 1024 * 1024,
} as const;