"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import type { PaginatedResponse } from "@/hooks/use-attendance";

// ─── Types ───────────────────────────────────────────────

/** Shape returned by GET /giving/categories (CategoryResponseDto). */
export interface GivingCategory {
  categoryId: string;
  churchId: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isRecurring?: boolean;
  isActive: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCategoriesParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  archived?: boolean;
}

export interface CreateGivingCategoryInput {
  name: string;
  description?: string;
  displayOrder?: number;
  isRecurring?: boolean;
}

export type UpdateGivingCategoryInput = Partial<CreateGivingCategoryInput>;

/** Shape returned by GET /giving/transactions (TransactionResponseDto). */
export interface GivingTransaction {
  transactionId: string;
  churchId: string;
  memberId?: string;
  memberName?: string;
  serviceId?: string;
  serviceName?: string;
  eventId?: string;
  branchId?: string;
  eventName?: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  currency: string;
  type: "digital" | "cash" | "bank_transfer";
  status: "pending" | "success" | "failed" | "reversed";
  paymentReference?: string;
  paymentGateway: string;
  paymentMethod?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListGivingTransactionsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  memberId?: string;
  serviceId?: string;
  eventId?: string;
  branchId?: string;
  status?: string;
  type?: string;
  gateway?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "amount" | "created_at";
  sortOrder?: "asc" | "desc";
}

/** Daily total point from GET /giving/transactions/summary (GivingTrendPointDto). */
export interface GivingTrendPoint {
  date: string;
  total: number;
}

/** Shape returned by GET /giving/transactions/summary (TransactionSummaryResponseDto). */
export interface GivingSummary {
  monthTotal: number;
  allTimeTotal: number;
  count: number;
  trend: GivingTrendPoint[];
}

export interface RecordCashGivingInput {
  categoryId: string;
  amount: number;
  type: "cash" | "bank_transfer";
  memberId?: string;
  serviceId?: string;
  eventId?: string;
  branchId?: string;
  notes?: string;
  currency?: string;
}

/** Shape returned by GET /giving/recurring (RecurringGivingResponseDto). */
export interface RecurringGiving {
  id: string;
  churchId: string;
  memberId: string;
  memberName?: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  currency: string;
  frequency: string;
  isActive: boolean;
  nextChargeDate?: string;
  lastChargeDate?: string;
  failedAttemptCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function invalidateGivingCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["giving-categories"] });
  queryClient.invalidateQueries({ queryKey: ["giving-transactions"] });
  queryClient.invalidateQueries({ queryKey: ["giving-recurring"] });
  queryClient.invalidateQueries({ queryKey: ["giving-summary"] });
}

// ─── Categories ──────────────────────────────────────────

export function useGivingCategories(
  params: ListCategoriesParams = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ["giving-categories", params],
    queryFn: () =>
      api.get<PaginatedResponse<GivingCategory>>(
        `/giving/categories${buildQuery({ ...params })}`
      ),
    enabled: options.enabled ?? true,
  });
}

export function useCreateGivingCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGivingCategoryInput) =>
      api.post<GivingCategory>("/giving/categories", input),
    onSuccess: () => invalidateGivingCaches(queryClient),
  });
}

export function useUpdateGivingCategory(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGivingCategoryInput) =>
      api.patch<GivingCategory>(`/giving/categories/${categoryId}`, input),
    onSuccess: () => invalidateGivingCaches(queryClient),
  });
}

export function useDeleteGivingCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      api.delete<{ success: boolean }>(`/giving/categories/${categoryId}`),
    onSuccess: () => invalidateGivingCaches(queryClient),
  });
}

export function useArchiveGivingCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      api.post<GivingCategory>(`/giving/categories/${categoryId}/archive`, {}),
    onSuccess: () => invalidateGivingCaches(queryClient),
  });
}

export function useRestoreArchiveGivingCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      api.post<GivingCategory>(`/giving/categories/${categoryId}/restore`, {}),
    onSuccess: () => invalidateGivingCaches(queryClient),
  });
}

// ─── Transactions ────────────────────────────────────────

export function useGivingTransactions(params: ListGivingTransactionsParams = {}) {
  return useQuery({
    queryKey: ["giving-transactions", params],
    queryFn: () =>
      api.get<PaginatedResponse<GivingTransaction>>(
        `/giving/transactions${buildQuery({ ...params })}`
      ),
  });
}

export function useGivingSummary(params: Pick<ListGivingTransactionsParams, "branchId"> = {}) {
  return useQuery({
    queryKey: ["giving-summary", params],
    queryFn: () =>
      api.get<GivingSummary>(`/giving/transactions/summary${buildQuery(params)}`),
    staleTime: 60_000,
  });
}

/**
 * Fetches EVERY successful gift matching the given filters by walking pages
 * at the endpoint cap (max 5,000). Used by derived report views (giving
 * reports, service giving breakdown) that need exact totals/per-category
 * sums that a single page can't provide. Shares the giving-transactions
 * invalidate prefix so new gifts refresh these views too.
 */
export function useGivingTransactionsAll(params: ListGivingTransactionsParams = {}) {
  return useQuery({
    queryKey: ["giving-transactions-all", params],
    queryFn: () =>
      fetchAllPages<GivingTransaction>((page) =>
        api.get<PaginatedResponse<GivingTransaction>>(
          listUrl("/giving/transactions", {
            status: "success",
            ...params,
            page,
            limit: 200,
          })
        )
      ),
  });
}

export function useRecordCashGiving() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordCashGivingInput) =>
      api.post<GivingTransaction>("/giving/cash", input),
    onSuccess: () => invalidateGivingCaches(queryClient),
  });
}

export function useSendReceipt(transactionId: string) {
  return useMutation({
    mutationFn: (channel: "whatsapp" | "email") =>
      api.post<{ success: boolean; message: string }>(
        `/giving/transactions/${transactionId}/send-receipt`,
        { channel }
      ),
  });
}

// ─── Recurring giving ────────────────────────────────────

export function useRecurringGiving(params: { page?: number; limit?: number; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: ["giving-recurring", params],
    queryFn: () =>
      api.get<PaginatedResponse<RecurringGiving>>(
        `/giving/recurring${buildQuery({ ...params })}`
      ),
  });
}

function useRecurringAction(path: (id: string) => string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<RecurringGiving>(path(id), {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["giving-recurring"] }),
  });
}

export function usePauseRecurringGiving() {
  return useRecurringAction((id) => `/giving/recurring/${id}/pause`);
}

export function useResumeRecurringGiving() {
  return useRecurringAction((id) => `/giving/recurring/${id}/resume`);
}

export function useCancelRecurringGiving() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<RecurringGiving>(`/giving/recurring/${id}/cancel`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["giving-recurring"] }),
  });
}
