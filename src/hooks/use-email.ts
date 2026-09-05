"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export type EmailBox = "inbox" | "sent";

export interface EmailItem {
  id: string;
  subject: string;
  preview: string;
  senderId: string;
  senderName?: string;
  senderAvatarUrl?: string;
  recipientId: string;
  recipientName: string;
  readAt?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface EmailDetail {
  id: string;
  subject: string;
  body: string;
  senderId: string;
  senderName?: string;
  senderAvatarUrl?: string;
  recipientIds: string[];
  readAt?: string;
  deletedAt?: string;
  replyToId?: string;
  createdAt: string;
}

export interface EmailListResponse {
  data: EmailItem[];
  total: number;
  unreadCount: number;
}

export interface EmailContact {
  id: string;
  name: string;
  role: string;
  email?: string;
  branchId?: string;
  branchName?: string;
  avatarUrl?: string;
}

export interface EmailContactsResponse {
  data: EmailContact[];
  total: number;
}

export interface SendEmailInput {
  recipientIds: string[];
  subject: string;
  body: string;
  replyToId?: string;
}

export interface ListEmailsParams {
  page?: number;
  limit?: number;
  box?: EmailBox;
  includeTrashed?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────

function buildEmailQuery(params: ListEmailsParams): string {
  const searchParams = new URLSearchParams();
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.box) searchParams.set("box", params.box);
  if (params.includeTrashed) searchParams.set("includeTrashed", "true");
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function invalidateEmails(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["email-list"] });
  qc.invalidateQueries({ queryKey: ["email-detail"] });
  qc.invalidateQueries({ queryKey: ["email-unread"] });
}

// ─── Queries ─────────────────────────────────────────────

/** List emails for the current mailbox view. */
export function useEmails(params: ListEmailsParams = {}) {
  return useQuery({
    queryKey: ["email-list", params],
    queryFn: () =>
      api.get<EmailListResponse>(`/email${buildEmailQuery(params)}`),
  });
}

/** Fetch a single email detail. */
export function useEmailDetail(messageId: string | null) {
  return useQuery({
    queryKey: ["email-detail", messageId],
    queryFn: () => api.get<EmailDetail>(`/email/${messageId}`),
    enabled: !!messageId,
  });
}

/** Poll the unread inbox count (drives the header badge + sidebar item). */
export function useEmailUnread() {
  return useQuery({
    queryKey: ["email-unread"],
    queryFn: () => api.get<{ count: number }>("/email/unread-count"),
    refetchInterval: 60_000,
  });
}

/** List selectable recipient contacts for the compose picker. */
export function useEmailContacts(
  params: { search?: string; branchId?: string; role?: string } = {}
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.branchId) query.set("branchId", params.branchId);
  if (params.role) query.set("role", params.role);
  const qs = query.toString();
  return useQuery({
    queryKey: ["email-contacts", params],
    queryFn: () =>
      api.get<EmailContactsResponse>(`/email/contacts${qs ? `?${qs}` : ""}`),
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────

/** Send a new internal email. */
export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendEmailInput) => api.post<EmailDetail>("/email", input),
    onSuccess: () => invalidateEmails(queryClient),
  });
}

/** Mark a received email as read. */
export function useMarkEmailRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api.post<{ success: boolean }>(`/email/${messageId}/read`),
    onSuccess: () => {
      invalidateEmails(queryClient);
    },
  });
}

/** Mark a received email as unread. */
export function useMarkEmailUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api.post<{ success: boolean }>(`/email/${messageId}/unread`),
    onSuccess: () => invalidateEmails(queryClient),
  });
}

/** Trash (soft-delete) a message. */
export function useTrashEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete<{ success: boolean }>(`/email/${messageId}`),
    onSuccess: () => invalidateEmails(queryClient),
  });
}

/** Restore a trashed message. */
export function useRestoreEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api.post<{ success: boolean }>(`/email/${messageId}/restore`),
    onSuccess: () => invalidateEmails(queryClient),
  });
}

/** Permanently delete a trashed message. */
export function useDeleteEmailForever() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete<{ success: boolean }>(`/email/${messageId}/permanent`),
    onSuccess: () => invalidateEmails(queryClient),
  });
}
