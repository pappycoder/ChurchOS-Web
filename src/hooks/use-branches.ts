"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Branch {
  branchId: string;
  churchId: string;
  name: string;
  isHeadquarters: boolean;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /branches (service-level `{ data, total }`). */
export interface BranchListResponse {
  data: Branch[];
  total: number;
}

export interface ListBranchesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "city" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface CreateBranchInput {
  name: string;
  isHeadquarters?: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export type UpdateBranchInput = Partial<CreateBranchInput>;

function buildListPath(params: ListBranchesParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  const queryString = searchParams.toString();
  return `/branches${queryString ? `?${queryString}` : ""}`;
}

export function useBranchesList(params: ListBranchesParams = {}) {
  return useQuery({
    queryKey: ["branches-list", params],
    queryFn: () => api.get<BranchListResponse>(buildListPath(params)),
  });
}

export function useBranch(branchId: string) {
  return useQuery({
    queryKey: ["branch", branchId],
    queryFn: () => api.get<Branch>(`/branches/${branchId}`),
    enabled: !!branchId,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBranchInput) => api.post<Branch>("/branches", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches-list"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useUpdateBranch(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBranchInput) =>
      api.patch<Branch>(`/branches/${branchId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branches-list"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) =>
      api.delete<{ success: boolean }>(`/branches/${branchId}`),
    onSuccess: (_data, branchId) => {
      queryClient.removeQueries({ queryKey: ["branch", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branches-list"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
