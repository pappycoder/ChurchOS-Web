"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type FollowUpStatus =
  | "new"
  | "contacted"
  | "follow_up_scheduled"
  | "interested"
  | "converted"
  | "dropped_off";

export const FOLLOW_UP_STATUSES: { value: FollowUpStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up_scheduled", label: "Scheduled" },
  { value: "interested", label: "Interested" },
  { value: "converted", label: "Converted" },
  { value: "dropped_off", label: "Dropped off" },
];

/** Shape returned by GET /visitors/:id (VisitorResponseDto). */
export interface Visitor {
  id: string;
  churchId: string;
  firstName: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  firstVisitDate: string;
  followUpStatus: FollowUpStatus;
  assignedToId?: string;
  assignedToName?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  convertedMemberId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /visitors (`{ data, meta }`). */
export interface VisitorListResponse {
  data: Visitor[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListVisitorsParams {
  page?: number;
  limit?: number;
  search?: string;
  followUpStatus?: string;
  assignedToId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateVisitorInput {
  firstName: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  firstVisitDate?: string;
  followUpStatus?: FollowUpStatus;
  assignedToId?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export type UpdateVisitorInput = Partial<CreateVisitorInput>;

export interface ConvertVisitorInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  branchId?: string;
}

function buildListPath(params: ListVisitorsParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.followUpStatus) searchParams.set("followUpStatus", params.followUpStatus);
  if (params.assignedToId) searchParams.set("assignedToId", params.assignedToId);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  const queryString = searchParams.toString();
  return `/visitors${queryString ? `?${queryString}` : ""}`;
}

function invalidateVisitorCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  visitorId?: string
) {
  queryClient.invalidateQueries({ queryKey: ["visitors-list"] });
  queryClient.invalidateQueries({ queryKey: ["visitor"] });
  if (visitorId) queryClient.removeQueries({ queryKey: ["visitor", visitorId] });
}

export function useVisitorsList(params: ListVisitorsParams = {}) {
  return useQuery({
    queryKey: ["visitors-list", params],
    queryFn: () => api.get<VisitorListResponse>(buildListPath(params)),
  });
}

export function useVisitor(visitorId: string) {
  return useQuery({
    queryKey: ["visitor", visitorId],
    queryFn: () => api.get<Visitor>(`/visitors/${visitorId}`),
    enabled: !!visitorId,
  });
}

export function useCreateVisitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVisitorInput) => api.post<Visitor>("/visitors", input),
    onSuccess: () => invalidateVisitorCaches(queryClient),
  });
}

export function useUpdateVisitor(visitorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateVisitorInput) =>
      api.patch<Visitor>(`/visitors/${visitorId}`, input),
    onSuccess: () => invalidateVisitorCaches(queryClient, visitorId),
  });
}

export function useDeleteVisitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitorId: string) =>
      api.delete<{ success: boolean }>(`/visitors/${visitorId}`),
    onSuccess: (_data, visitorId) => invalidateVisitorCaches(queryClient, visitorId),
  });
}

export function useConvertVisitor(visitorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConvertVisitorInput) =>
      api.post<{ visitor: Visitor; memberId: string }>(
        `/visitors/${visitorId}/convert`,
        input
      ),
    onSuccess: () => invalidateVisitorCaches(queryClient, visitorId),
  });
}
