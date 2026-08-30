"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface RoleInfo {
  name: string;
  /** Human-friendly display label (custom roles) */
  label?: string;
  description?: string;
}

export interface EffectivePermission {
  name: string;
  resource: string;
  action: string;
  grantedBy: string[];
}

export interface LinkedMemberSummary {
  memberId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  status: string;
}

export interface UserProfile {
  profileId: string;
  userId: string;
  churchId: string;
  branchId?: string;
  /** All roles held by the user, ordered by rank descending (first = primary) */
  role: string[];
  /** Admin HQ flag — grants cross-branch read access within the user's permission scope. */
  isAdminHq: boolean;
  /** Assigned roles with descriptions (populated on detail responses) */
  roles?: RoleInfo[];
  /** Permissions accumulated across all assigned roles */
  effectivePermissions?: EffectivePermission[];
  lastSignInAt?: string;
  member?: LinkedMemberSummary;
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

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  branchId?: string;
  status?: "active" | "inactive";
  isAdminHq?: boolean;
}

export interface BranchOption {
  branchId: string;
  name: string;
  isHeadquarters: boolean;
}

interface BranchListResponse {
  data: BranchOption[];
  meta: { total: number; page: number; limit: number; totalPages: number };
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

export function getRoleLabels(roles: string[]): string {
  if (!roles || roles.length === 0) return "Member";
  return roles.map(getRoleLabel).join(", ");
}

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get<BranchListResponse>("/branches?limit=100");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
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

/** Admin edit of a user's basic details, branch, and status. */
export function useUpdateUser(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) =>
      api.patch<UserProfile>(`/profiles/${profileId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

/** Replaces the full set of roles on a user. Permissions accumulate across roles. */
export function useUpdateUserRoles(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roles: string[]) =>
      api.patch<UserProfile>(`/profiles/${profileId}/roles`, { roles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, role }: { profileId: string; role: string }) =>
      api.patch<UserProfile>(`/profiles/${profileId}/role`, { role }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", variables.profileId] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) =>
      api.post<{ deactivated: boolean }>(`/profiles/${profileId}/deactivate`),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", profileId] });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) =>
      api.post<UserProfile>(`/profiles/${profileId}/activate`),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", profileId] });
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
