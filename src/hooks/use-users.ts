"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UserProfile {
  profileId: string;
  userId: string;
  churchId: string;
  branchId?: string;
  role: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  church?: {
    churchId: string;
    name: string;
    denomination?: string;
    logoUrl?: string;
  };
  branch?: {
    branchId: string;
    name: string;
    isHeadquarters: boolean;
  };
}

export interface UserListResponse {
  data: UserProfile[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  branchId?: string;
  status?: "active" | "inactive";
  sortBy?: "first_name" | "last_name" | "role" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  branchId?: string;
}

export interface UpdateRoleInput {
  role: string;
}

export const VALID_ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "senior_pastor", label: "Senior Pastor" },
  { value: "church_admin", label: "Church Admin" },
  { value: "branch_pastor", label: "Branch Pastor" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "department_head", label: "Department Head" },
  { value: "member", label: "Member" },
] as const;

export function getRoleLabel(role: string): string {
  return VALID_ROLES.find((r) => r.value === role)?.label ?? role;
}

export function useUsers(params: ListUsersParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.role) searchParams.set("role", params.role);
  if (params.branchId) searchParams.set("branchId", params.branchId);
  if (params.status) searchParams.set("status", params.status);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const queryString = searchParams.toString();
  const path = `/profiles${queryString ? `?${queryString}` : ""}`;

  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => api.get<UserListResponse>(path),
  });
}

export function useUser(profileId: string) {
  return useQuery({
    queryKey: ["admin-user", profileId],
    queryFn: () => api.get<UserProfile>(`/profiles/${profileId}`),
    enabled: !!profileId,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteUserInput) =>
      api.post<UserProfile>("/profiles/invite", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, role }: { profileId: string } & UpdateRoleInput) =>
      api.patch<UserProfile>(`/profiles/${profileId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) =>
      api.delete<{ success: boolean }>(`/profiles/${profileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) =>
      api.post<UserProfile>(`/profiles/${profileId}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (profileId: string) =>
      api.post<{ success: boolean }>(`/profiles/${profileId}/reset-password`),
  });
}

export function useForceSignout() {
  return useMutation({
    mutationFn: (profileId: string) =>
      api.post<{ success: boolean }>(`/profiles/${profileId}/force-signout`),
  });
}
