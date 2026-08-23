"use client";

/**
 * @file Hooks for church-level settings — church profile, branding and
 * key-value preferences via GET/PATCH /church and /church/config.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ChurchProfile {
  churchId: string;
  name: string;
  denomination?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  branchCount: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateChurchInput {
  name?: string;
  denomination?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

export type ChurchConfig = Record<string, unknown>;

export function useChurch() {
  return useQuery({
    queryKey: ["church"],
    queryFn: () => api.get<ChurchProfile>("/church"),
    staleTime: 60 * 1000,
  });
}

export function useUpdateChurch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateChurchInput) => api.patch<ChurchProfile>("/church", input),
    onSuccess: (updated) => {
      queryClient.setQueryData(["church"], updated);
    },
  });
}

export function useChurchConfig() {
  return useQuery({
    queryKey: ["church-config"],
    queryFn: () => api.get<{ config: ChurchConfig }>("/church/config"),
    staleTime: 60 * 1000,
  });
}

export function useUpdateChurchConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: ChurchConfig) => api.patch<unknown>("/church/config", { config }),
    onSuccess: (_data, config) => {
      queryClient.setQueryData(["church-config"], (prev: { config: ChurchConfig } | undefined) =>
        prev ? { config: { ...prev.config, ...config } } : { config },
      );
    },
  });
}

/**
 * Updates the unified church email — the acting admin's sign-in credential,
 * their profile record, and the church contact email change together.
 * Refreshes both the church cache and the current-profile cache (header identity).
 */
export function useUpdateChurchEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api.patch<ChurchProfile>("/church/email", { email }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["church"], updated);
      void queryClient.invalidateQueries({ queryKey: ["current-profile"] });
    },
  });
}

/** Uploads a logo image and returns its optimized URL. */
export async function uploadChurchLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "churches");
  const res = await api.post<{ url: string }>("/media/upload/image", formData);
  return res.url;
}
