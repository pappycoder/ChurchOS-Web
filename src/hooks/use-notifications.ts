"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export type NotificationType =
  | "system"
  | "attendance"
  | "giving"
  | "event"
  | "pastoral"
  | "broadcast";

export interface Notification {
  id: string;
  churchId: string;
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsListResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
}

export interface NotificationsListParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  read?: "all" | "unread";
  startDate?: string;
  endDate?: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  system: "System",
  attendance: "Attendance",
  giving: "Giving",
  event: "Event",
  pastoral: "Pastoral",
  broadcast: "Broadcast",
};

// ─── Helpers ─────────────────────────────────────────────

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

// ─── Queries ─────────────────────────────────────────────

export function useNotificationsList(params: NotificationsListParams = {}) {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.type) query.set("type", params.type);
  if (params.read === "unread") query.set("read", params.read);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  const qs = query.toString();
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () =>
      api.get<NotificationsListResponse>(`/notifications${qs ? `?${qs}` : ""}`),
  });
}

export function useNotification(notificationId: string | null) {
  return useQuery({
    queryKey: ["notifications", "detail", notificationId],
    queryFn: () => api.get<Notification>(`/notifications/${notificationId}`),
    enabled: !!notificationId,
  });
}

export function useNotificationsUnread() {
  return useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 60_000,
  });
}

// ─── Mutations ───────────────────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.patch<Notification>(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.patch<{ updated: number }>("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useBulkMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.patch<{ updated: number }>("/notifications/bulk-read", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useBulkDeleteNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.post<{ deleted: number }>("/notifications/bulk-delete", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.delete<{ success: boolean }>(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}
