"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export type ServiceCategory = "adult" | "children";

export const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: "adult", label: "Adult" },
  { value: "children", label: "Children" },
];

/** Shape returned by GET /services (ServiceResponseDto). */
export interface ChurchService {
  serviceId: string;
  churchId: string;
  branchId?: string;
  name: string;
  category?: ServiceCategory;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  /** All-time check-in count (populated by list/detail endpoints). */
  attendanceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListServicesParams {
  page?: number;
  limit?: number;
  category?: string;
  isActive?: boolean;
  dayOfWeek?: number;
}

/** Shape returned by GET /attendance (AttendanceResponseDto). */
export interface AttendanceRecord {
  attendanceId: string;
  churchId: string;
  serviceId: string;
  memberId?: string;
  visitorId?: string;
  visitorName?: string;
  category?: ServiceCategory;
  checkInAt: string;
  source: string;
  createdAt: string;
  memberName?: string;
  serviceName?: string;
}

export interface ListAttendanceParams {
  page?: number;
  limit?: number;
  serviceId?: string;
  memberId?: string;
  visitorId?: string;
  category?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "checkinAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AttendanceSummary {
  totalCheckIns: number;
  memberCheckIns: number;
  visitorCheckIns: number;
  bySource: Record<string, number>;
  byCategory: Record<string, number>;
  byGender: Record<string, number>;
}

export interface AttendanceTrendPoint {
  date: string;
  total: number;
  members: number;
  visitors: number;
}

export interface BulkAttendanceResult {
  recorded: number;
  skipped: number;
  errors: Array<{ index: number; message: string }>;
}

export interface CreateServiceInput {
  name: string;
  branchId?: string;
  category?: ServiceCategory;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface UpdateServiceInput
  extends Partial<Omit<CreateServiceInput, "dayOfWeek" | "startTime" | "endTime">> {
  /** Explicit `null` clears the stored value; `undefined` leaves it unchanged. */
  dayOfWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface RecordAttendanceInput {
  serviceId: string;
  memberId?: string;
  visitorId?: string;
  visitorName?: string;
  category?: ServiceCategory;
  source?: string;
}

export interface RecordBulkAttendanceInput {
  serviceId: string;
  records: Array<{
    memberId?: string;
    visitorId?: string;
    visitorName?: string;
  }>;
  category?: ServiceCategory;
  source?: string;
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

function invalidateAttendanceCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
  queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
  queryClient.invalidateQueries({ queryKey: ["attendance-trends"] });
  queryClient.invalidateQueries({ queryKey: ["service-attendance"] });
}

// ─── Services ────────────────────────────────────────────

export function useAttendanceServices(params: ListServicesParams = {}) {
  return useQuery({
    queryKey: ["attendance-services", params],
    queryFn: () =>
      api.get<PaginatedResponse<ChurchService>>(`/services${buildQuery({ ...params })}`),
  });
}

export function useService(serviceId: string) {
  return useQuery({
    queryKey: ["attendance-service", serviceId],
    queryFn: () => api.get<ChurchService>(`/services/${serviceId}`),
    enabled: !!serviceId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) =>
      api.post<ChurchService>("/services", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-services"] });
      invalidateAttendanceCaches(queryClient);
    },
  });
}

export function useUpdateService(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateServiceInput) =>
      api.patch<ChurchService>(`/services/${serviceId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-services"] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.delete<{ success: boolean }>(`/services/${serviceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-services"] });
    },
  });
}

// ─── Attendance records ──────────────────────────────────

export function useAttendanceRecords(params: ListAttendanceParams = {}) {
  return useQuery({
    queryKey: ["attendance-records", params],
    queryFn: () =>
      api.get<PaginatedResponse<AttendanceRecord>>(`/attendance${buildQuery({ ...params })}`),
  });
}

export function useRecordAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordAttendanceInput) =>
      api.post<AttendanceRecord>("/attendance", input),
    onSuccess: () => invalidateAttendanceCaches(queryClient),
  });
}

export function useRecordBulkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordBulkAttendanceInput) =>
      api.post<BulkAttendanceResult>("/attendance/bulk", input),
    onSuccess: () => invalidateAttendanceCaches(queryClient),
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attendanceId: string) =>
      api.delete<{ success: boolean }>(`/attendance/${attendanceId}`),
    onSuccess: () => invalidateAttendanceCaches(queryClient),
  });
}

// ─── Analytics ───────────────────────────────────────────

export function useAttendanceSummary(params: { startDate?: string; endDate?: string } = {}) {
  return useQuery({
    queryKey: ["attendance-summary", params],
    queryFn: () =>
      api.get<AttendanceSummary>(`/attendance/summary${buildQuery({ ...params })}`),
  });
}

export function useAttendanceTrends(
  params: { days?: number; startDate?: string; endDate?: string } = {}
) {
  return useQuery({
    queryKey: ["attendance-trends", params],
    queryFn: () =>
      api.get<AttendanceTrendPoint[]>(`/attendance/trends${buildQuery({ ...params })}`),
  });
}

export function useServiceAttendance(serviceId: string) {
  return useQuery({
    queryKey: ["service-attendance", serviceId],
    queryFn: () =>
      api.get<{ data: AttendanceRecord[]; total: number }>(
        `/attendance/by-service/${serviceId}`
      ),
    enabled: !!serviceId,
  });
}
