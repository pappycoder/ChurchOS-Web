"use client";

/**
 * @file Hooks for the current user's own profile — view, edit, avatar and
 * password management via /profiles/me and /auth/password.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CurrentProfile {
  profileId: string;
  userId: string;
  churchId: string;
  branchId?: string;
  /** All roles held by the user, ordered by rank descending (first = primary) */
  role: string[];
  /** Flat permission names (resource:action) granted across all roles */
  permissions?: string[];
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  status: string;
  createdAt: string;
  updatedAt?: string;
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

/** Fields the self-service PATCH endpoint accepts (email is admin-managed). */
export interface UpdateCurrentProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/** Shared fetcher so the login flow can prime the same cache entry. */
export function fetchCurrentProfile(): Promise<CurrentProfile> {
  return api.get<CurrentProfile>("/profiles/me");
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: ["current-profile"],
    queryFn: fetchCurrentProfile,
    staleTime: 60 * 1000,
    // Live-session permission updates: role changes made by admins are
    // picked up the next time the user returns to the tab.
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useUpdateCurrentProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCurrentProfileInput) =>
      api.patch<CurrentProfile>("/profiles/me", input),
    onSuccess: (updated) => {
      queryClient.setQueryData(["current-profile"], updated);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post<CurrentProfile>("/profiles/me/photo", formData);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["current-profile"], updated);
    },
  });
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api.put<unknown>("/auth/password", input),
  });
}
