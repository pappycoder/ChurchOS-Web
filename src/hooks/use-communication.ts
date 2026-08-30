"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export type MessageDirection = "inbound" | "outbound";
export type MessageChannel = "whatsapp" | "sms" | "email";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export interface Message {
  messageId: string;
  churchId: string;
  memberId?: string;
  phone: string;
  direction: MessageDirection;
  channel: MessageChannel;
  content?: string;
  mediaUrl?: string;
  status: MessageStatus;
  createdAt: string;
}

export interface MessagesListResponse {
  data: Message[];
  total: number;
}

export interface ListMessagesParams {
  limit?: number;
  phone?: string;
  direction?: MessageDirection;
}

export interface SendMessageInput {
  to: string;
  type?: "text" | "image" | "audio" | "video" | "document" | "template";
  text?: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: (string | number)[];
}

export interface CommunicationChannelStats {
  channel: MessageChannel;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  total: number;
}

export interface CommunicationBroadcastSummary {
  total: number;
  sent: number;
  failed: number;
  totalRecipients: number;
}

export interface CommunicationAnalytics {
  channels: CommunicationChannelStats[];
  broadcasts: CommunicationBroadcastSummary;
}

export const MESSAGE_DIRECTION_LABELS: Record<MessageDirection, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
};

export const MESSAGE_DIRECTION_TEXT: Record<MessageDirection, string> = {
  inbound: "text-sky-600",
  outbound: "text-violet-600",
};

export const MESSAGE_CHANNEL_LABELS: Record<MessageChannel, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
};

export const MESSAGE_CHANNELS: MessageChannel[] = ["whatsapp", "sms", "email"];

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
};

export const MESSAGE_STATUS_TEXT: Record<MessageStatus, string> = {
  sent: "text-blue-600",
  delivered: "text-emerald-600",
  read: "text-violet-600",
  failed: "text-red-600",
};

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

function invalidateMessageCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["messages-list"] });
  qc.invalidateQueries({ queryKey: ["communication-analytics"] });
}

// ─── Queries ─────────────────────────────────────────────

export function useMessagesList(params: ListMessagesParams = {}) {
  return useQuery({
    queryKey: ["messages-list", params],
    queryFn: () =>
      api.get<MessagesListResponse>(`/whatsapp/messages${buildQuery({ ...params })}`),
  });
}

export function useCommunicationAnalytics() {
  return useQuery({
    queryKey: ["communication-analytics"],
    queryFn: () => api.get<CommunicationAnalytics>("/analytics/communication"),
  });
}

// ─── Mutations ───────────────────────────────────────────

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      api.post<Message>("/whatsapp/send", input),
    onSuccess: () => invalidateMessageCaches(qc),
  });
}

export function useSendTemplateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      api.post<Message>("/whatsapp/send-template", input),
    onSuccess: () => invalidateMessageCaches(qc),
  });
}
