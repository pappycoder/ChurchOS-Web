"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

/** Shape returned by GET /sermons/:id (SermonResponseDto). */
export interface Sermon {
  sermonId: string;
  churchId: string;
  title: string;
  speaker?: string;
  sermonDate: string;
  scriptureReference?: string;
  seriesName?: string;
  tags: string[];
  audioUrl?: string;
  videoUrl?: string;
  durationSeconds?: number;
  description?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SermonsListResponse {
  data: Sermon[];
  total: number;
}

export interface AggregatedItem {
  name: string;
  count: number;
  lastDate: string;
}

export interface ListSermonsParams {
  page?: number;
  limit?: number;
  search?: string;
  speaker?: string;
  series?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
  archived?: boolean;
  sortBy?: "sermonDate" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
}

export interface CreateSermonInput {
  title: string;
  speaker?: string;
  sermonDate: string;
  scriptureReference?: string;
  seriesName?: string;
  tags?: string[];
  audioUrl?: string;
  videoUrl?: string;
  durationSeconds?: number;
  description?: string;
}

export type UpdateSermonInput = Partial<CreateSermonInput>;

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

function invalidateSermonCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["sermons-list"] });
  qc.invalidateQueries({ queryKey: ["sermons-series"] });
  qc.invalidateQueries({ queryKey: ["sermons-speakers"] });
  qc.invalidateQueries({ queryKey: ["sermons-bookmarks"] });
}

// ─── Sermons list (paginated) ─────────────────────────────

export function useSermonsList(params: ListSermonsParams = {}) {
  return useQuery({
    queryKey: ["sermons-list", params],
    queryFn: () =>
      api.get<SermonsListResponse>(`/sermons${buildQuery({ ...params })}`),
  });
}

// ─── Single sermon ────────────────────────────────────────

export function useSermon(sermonId: string) {
  return useQuery({
    queryKey: ["sermons-detail", sermonId],
    queryFn: () => api.get<Sermon>(`/sermons/${sermonId}`),
    enabled: !!sermonId,
  });
}

// ─── Aggregated series ────────────────────────────────────

export function useSermonsSeries() {
  return useQuery({
    queryKey: ["sermons-series"],
    queryFn: () => api.get<AggregatedItem[]>("/sermons/series"),
  });
}

// ─── Aggregated speakers ──────────────────────────────────

export function useSermonsSpeakers() {
  return useQuery({
    queryKey: ["sermons-speakers"],
    queryFn: () => api.get<AggregatedItem[]>("/sermons/speakers"),
  });
}

// ─── Bookmarks ────────────────────────────────────────────

export function useSermonBookmarks() {
  return useQuery({
    queryKey: ["sermons-bookmarks"],
    queryFn: () => api.get<Sermon[]>("/sermons/bookmarks/me"),
  });
}

export function useIsBookmarked(sermonId: string) {
  return useQuery({
    queryKey: ["sermons-bookmark", sermonId],
    queryFn: () => api.get<{ bookmarked: boolean }>(`/sermons/${sermonId}/bookmark`),
    enabled: !!sermonId,
  });
}

export function useToggleBookmark(sermonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookmarked: boolean) =>
      bookmarked
        ? api.delete<{ bookmarked: boolean }>(`/sermons/${sermonId}/bookmark`)
        : api.post<{ bookmarked: boolean }>(`/sermons/${sermonId}/bookmark`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sermons-bookmark", sermonId] });
      qc.invalidateQueries({ queryKey: ["sermons-bookmarks"] });
    },
  });
}

// ─── CRUD mutations ──────────────────────────────────────

export function useCreateSermon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSermonInput) =>
      api.post<Sermon>("/sermons", input),
    onSuccess: () => invalidateSermonCaches(qc),
  });
}

export function useUpdateSermon(sermonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSermonInput) =>
      api.patch<Sermon>(`/sermons/${sermonId}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sermons-detail", sermonId] });
      invalidateSermonCaches(qc);
    },
  });
}

export function useDeleteSermon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sermonId: string) =>
      api.delete<void>(`/sermons/${sermonId}`),
    onSuccess: () => invalidateSermonCaches(qc),
  });
}

export function useArchiveSermon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sermonId: string) =>
      api.post<Sermon>(`/sermons/${sermonId}/archive`, {}),
    onSuccess: () => {
      invalidateSermonCaches(qc);
      qc.invalidateQueries({ queryKey: ["sermons-detail"] });
    },
  });
}

export function useRestoreArchiveSermon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sermonId: string) =>
      api.post<Sermon>(`/sermons/${sermonId}/restore`, {}),
    onSuccess: () => {
      invalidateSermonCaches(qc);
      qc.invalidateQueries({ queryKey: ["sermons-detail"] });
    },
  });
}
