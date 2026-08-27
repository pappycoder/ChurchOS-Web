"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export interface MonthlyTrend {
  month: string;
  total: number;
}

export interface CategoryBreakdown {
  name: string;
  total: number;
  count: number;
}

export interface FinancialReport {
  startDate: string;
  endDate: string;
  grandTotal: number;
  transactionCount: number;
  averageAmount: number;
  byCategory: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
}

export interface ServiceAttendance {
  name: string;
  total: number;
  serviceCount: number;
  average: number;
}

export interface AttendanceReport {
  startDate: string;
  endDate: string;
  totalAttendance: number;
  serviceCount: number;
  averagePerService: number;
  byService: ServiceAttendance[];
  monthlyTrend: MonthlyTrend[];
}

export interface MemberStatus {
  status: string;
  count: number;
}

export interface MemberGender {
  gender: string;
  count: number;
}

export interface MemberReport {
  startDate: string;
  endDate: string;
  totalMembers: number;
  newMembersInPeriod: number;
  activeMembers: number;
  byStatus: MemberStatus[];
  byGender: MemberGender[];
  monthlyGrowth: MonthlyTrend[];
}

export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export interface ReportExportSheet {
  name: string;
  rows: Record<string, unknown>[];
}

// ─── Helpers ─────────────────────────────────────────────

function buildQuery(params: ReportQueryParams): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleString("en-NG", { month: "short" });
}

// ─── Queries ─────────────────────────────────────────────

export function useFinancialReport(params: ReportQueryParams = {}) {
  return useQuery({
    queryKey: ["reports", "financial", params],
    queryFn: () => api.get<FinancialReport>(`/reports/financial${buildQuery(params)}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceReport(params: ReportQueryParams = {}) {
  return useQuery({
    queryKey: ["reports", "attendance", params],
    queryFn: () => api.get<AttendanceReport>(`/reports/attendance${buildQuery(params)}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMemberReport(params: ReportQueryParams = {}) {
  return useQuery({
    queryKey: ["reports", "members", params],
    queryFn: () => api.get<MemberReport>(`/reports/members${buildQuery(params)}`),
    staleTime: 10 * 60 * 1000,
  });
}