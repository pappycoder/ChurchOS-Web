"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type MemberStatus = "active" | "inactive" | "suspended" | "transferred";

export interface Member {
  memberId: string;
  churchId: string;
  branchId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  status: MemberStatus;
  memberSince: string;
  photoUrl?: string;
  customFields?: Record<string, unknown>;
  notes?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /members (`{ data, meta }`). */
export interface MemberListResponse {
  data: Member[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MemberStatus | "all";
  branchId?: string;
  archived?: boolean;
  sortBy?: "first_name" | "last_name" | "created_at" | "member_since" | "status";
  sortOrder?: "asc" | "desc";
}

export interface CreateMemberInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  branchId?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export type UpdateMemberInput = Partial<CreateMemberInput> & {
  status?: MemberStatus;
};

export interface MemberGivingRecord {
  id: string;
  amount: number;
  currency: string;
  categoryId: string;
  status: string;
  createdAt: string;
}

export interface MemberAttendanceRecord {
  id: string;
  checkInAt: string;
  serviceName: string;
  source: string;
  createdAt: string;
}

function buildListPath(params: ListMembersParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.branchId) searchParams.set("branchId", params.branchId);
  if (params.archived) searchParams.set("archived", "true");
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  const queryString = searchParams.toString();
  return `/members${queryString ? `?${queryString}` : ""}`;
}

function invalidateMemberCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  memberId?: string
) {
  queryClient.invalidateQueries({ queryKey: ["members-list"] });
  queryClient.invalidateQueries({ queryKey: ["member"] });
  if (memberId) queryClient.removeQueries({ queryKey: ["member", memberId] });
}

export function useMembersList(params: ListMembersParams = {}) {
  return useQuery({
    queryKey: ["members-list", params],
    queryFn: () => api.get<MemberListResponse>(buildListPath(params)),
  });
}

export function useMember(memberId: string) {
  return useQuery({
    queryKey: ["member", memberId],
    queryFn: () => api.get<Member>(`/members/${memberId}`),
    enabled: !!memberId,
  });
}

export function useSearchMembers(searchTerm: string, limit = 20) {
  return useQuery({
    queryKey: ["members-search", searchTerm, limit],
    queryFn: () =>
      api.get<{ data: Member[] }>(
        `/members/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`
      ),
    enabled: searchTerm.trim().length >= 2,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMemberInput) => api.post<Member>("/members", input),
    onSuccess: () => invalidateMemberCaches(queryClient),
  });
}

export function useUpdateMember(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMemberInput) =>
      api.patch<Member>(`/members/${memberId}`, input),
    onSuccess: () => invalidateMemberCaches(queryClient, memberId),
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete<{ success: boolean }>(`/members/${memberId}`),
    onSuccess: (_data, memberId) => invalidateMemberCaches(queryClient, memberId),
  });
}

export function useRestoreMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.post<Member>(`/members/${memberId}/restore`, {}),
    onSuccess: () => invalidateMemberCaches(queryClient),
  });
}

export function useArchiveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.post<Member>(`/members/${memberId}/archive`, {}),
    onSuccess: () => invalidateMemberCaches(queryClient),
  });
}

export function useRestoreArchiveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.post<Member>(`/members/${memberId}/restore-archive`, {}),
    onSuccess: () => invalidateMemberCaches(queryClient),
  });
}

export function useMemberGivingHistory(memberId: string) {
  return useQuery({
    queryKey: ["member-giving", memberId],
    queryFn: () => api.get<{ data: MemberGivingRecord[] }>(`/members/${memberId}/giving`),
    enabled: !!memberId,
  });
}

export function useMemberAttendanceHistory(memberId: string) {
  return useQuery({
    queryKey: ["member-attendance", memberId],
    queryFn: () =>
      api.get<{ data: MemberAttendanceRecord[] }>(`/members/${memberId}/attendance`),
    enabled: !!memberId,
  });
}

export function useAddMemberNote(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) =>
      api.post<{ success: boolean }>(`/members/${memberId}/notes`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
    },
  });
}
