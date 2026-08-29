"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────
// Mirror the backend `analytics-response.dto.ts` shapes exactly.

export interface CategoryBreakdownEntry {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
}

export interface BranchBreakdownEntry {
  branchId?: string;
  branchName: string;
  total: number;
  count: number;
}

export interface TypeBreakdownEntry {
  type: string;
  total: number;
  count: number;
}

export interface TopDonorEntry {
  memberId: string;
  memberName: string;
  total: number;
  count: number;
}

export interface DatePointEntry {
  date: string;
  total: number;
  members: number;
  visitors: number;
}

export interface ServiceBreakdownEntry {
  serviceId: string;
  serviceName: string;
  total: number;
  members: number;
  visitors: number;
}

export interface DashboardOverview {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  totalBranches: number;
  totalAttendance: number;
  totalGiving: number;
  atRiskCount: number;
  upcomingEvents: number;
  pendingSubmissions: number;
  engagementDistribution: Record<string, number>;
}

export interface GivingAnalytics {
  total: number;
  count: number;
  average: number;
  byCategory: CategoryBreakdownEntry[];
  byBranch: BranchBreakdownEntry[];
  byType: TypeBreakdownEntry[];
  byStatus: Record<string, number>;
  topDonors: TopDonorEntry[];
  recurring: {
    active: number;
    totalMonthlyAmount: number;
    totalScheduled: number;
  };
  trend: DatePointEntry[];
}

export interface AttendanceAnalytics {
  total: number;
  members: number;
  visitors: number;
  bySource: Record<string, number>;
  byBranch: BranchBreakdownEntry[];
  byService: ServiceBreakdownEntry[];
  firstTimeVisitors: number;
  returningVisitors: number;
  trend: DatePointEntry[];
}

export interface MemberAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byGender: Record<string, number>;
  byAgeGroup: Record<string, number>;
  growth: DatePointEntry[];
}

export interface AnalyticsDateRangeParams {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  groupBy?: "day" | "week" | "month";
}

// ─── Helpers ─────────────────────────────────────────────

function buildQuery(params: AnalyticsDateRangeParams): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function periodLabel(date: string): string {
  // date arrives as YYYY-MM-DD (day) / YYYY-Wxx or YYYY-MM (month). Default
  // to displaying it as-is but shorten ISO month parts.
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [y, m] = date.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-NG", {
      month: "short",
    });
  }
  return date;
}

// ─── Queries ─────────────────────────────────────────────

export function useAnalyticsDashboard(params: AnalyticsDateRangeParams = {}) {
  return useQuery({
    queryKey: ["analytics", "dashboard", params],
    queryFn: () => api.get<DashboardOverview>(`/analytics/dashboard${buildQuery(params)}`),
    staleTime: 3 * 60 * 1000,
  });
}

export function useAnalyticsGiving(params: AnalyticsDateRangeParams = {}) {
  return useQuery({
    queryKey: ["analytics", "giving", params],
    queryFn: () => api.get<GivingAnalytics>(`/analytics/giving${buildQuery(params)}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsAttendance(params: AnalyticsDateRangeParams = {}) {
  return useQuery({
    queryKey: ["analytics", "attendance", params],
    queryFn: () => api.get<AttendanceAnalytics>(`/analytics/attendance${buildQuery(params)}`),
    staleTime: 3 * 60 * 1000,
  });
}

export function useAnalyticsMembers() {
  return useQuery({
    queryKey: ["analytics", "members"],
    queryFn: () => api.get<MemberAnalytics>(`/analytics/members`),
    staleTime: 10 * 60 * 1000,
  });
}

export function formatNaira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}
