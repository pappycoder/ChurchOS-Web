"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FamilyMemberInfo {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  isHead: boolean;
}

export interface Family {
  familyId: string;
  churchId: string;
  name: string;
  headId?: string;
  members: FamilyMemberInfo[];
  createdAt: string;
}

/** Shape returned by GET /families (`{ data, meta }`). */
export interface FamilyListResponse {
  data: Family[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListFamiliesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateFamilyInput {
  name: string;
  headId?: string;
}

export type UpdateFamilyInput = Partial<CreateFamilyInput>;

export interface AddFamilyMemberInput {
  memberId: string;
  relationship: string;
  isHead?: boolean;
}

function buildListPath(params: ListFamiliesParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  const queryString = searchParams.toString();
  return `/families${queryString ? `?${queryString}` : ""}`;
}

function invalidateFamilyCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  familyId?: string
) {
  queryClient.invalidateQueries({ queryKey: ["families-list"] });
  queryClient.invalidateQueries({ queryKey: ["family"] });
  if (familyId) queryClient.removeQueries({ queryKey: ["family", familyId] });
}

export function useFamiliesList(params: ListFamiliesParams = {}) {
  return useQuery({
    queryKey: ["families-list", params],
    queryFn: () => api.get<FamilyListResponse>(buildListPath(params)),
  });
}

export function useFamily(familyId: string) {
  return useQuery({
    queryKey: ["family", familyId],
    queryFn: () => api.get<Family>(`/families/${familyId}`),
    enabled: !!familyId,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFamilyInput) => api.post<Family>("/families", input),
    onSuccess: () => invalidateFamilyCaches(queryClient),
  });
}

export function useUpdateFamily(familyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFamilyInput) =>
      api.patch<Family>(`/families/${familyId}`, input),
    onSuccess: () => invalidateFamilyCaches(queryClient, familyId),
  });
}

export function useDeleteFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (familyId: string) =>
      api.delete<{ success: boolean }>(`/families/${familyId}`),
    onSuccess: (_data, familyId) => invalidateFamilyCaches(queryClient, familyId),
  });
}

export function useAddFamilyMember(familyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddFamilyMemberInput) =>
      api.post<Family>(`/families/${familyId}/members`, input),
    onSuccess: () => invalidateFamilyCaches(queryClient, familyId),
  });
}

export function useRemoveFamilyMember(familyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete<Family>(`/families/${familyId}/members/${memberId}`),
    onSuccess: () => invalidateFamilyCaches(queryClient, familyId),
  });
}
