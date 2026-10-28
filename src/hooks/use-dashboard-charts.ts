"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import type { DatePointEntry } from "@/hooks/use-analytics";

export interface MemberDashboard {
  total: number;
  byStatus: Record<string, number>;
  byAgeGroup: Record<string, number>;
  growth: DatePointEntry[];
}

export interface GivingDashboardCharts {
  currency: string;
  total: number;
  count: number;
  trend: { date: string; total: number }[];
  byCategory: {
    categoryId: string | null;
    categoryName: string;
    total: number;
    count: number;
  }[];
}

export interface DashboardRange {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
}

function queryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value) search.set(key, value);
  return search.size ? `?${search}` : "";
}

export function useMemberDashboard(
  params: { branchId?: string } = {},
  options: { enabled?: boolean } = {},
) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["members-list", "dashboard", params],
    enabled: can("members:all", "read") && (options.enabled ?? true),
    queryFn: ({ signal }) =>
      api.get<MemberDashboard>(`/members/dashboard${queryString(params)}`, {
        signal,
      }),
    staleTime: 60_000,
  });
}

export function useGivingDashboardCharts(
  params: DashboardRange = {},
  options: { enabled?: boolean } = {},
) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["giving-summary", "charts", params],
    enabled: can("giving:dashboard", "read") && (options.enabled ?? true),
    queryFn: ({ signal }) =>
      api.get<GivingDashboardCharts>(
        `/giving/dashboard/charts${queryString({ ...params })}`,
        { signal },
      ),
    staleTime: 60_000,
  });
}
