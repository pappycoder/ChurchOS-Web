"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Minimal event shape used by link-to-event pickers. */
export interface EventSummary {
  eventId: string;
  churchId: string;
  title: string;
  startDate: string;
}

export function useEventsList(params: { limit?: number } = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["events-list", params],
    queryFn: () =>
      api.get<{ data: EventSummary[]; total: number }>(`/events${qs ? `?${qs}` : ""}`),
  });
}
