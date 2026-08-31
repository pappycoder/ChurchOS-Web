"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const APPOINTMENT_STATUS_TEXT: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export interface Appointment {
  id: string;
  title: string;
  scheduledAt: string;
  /** With party — pastor Profile ID. */
  pastorId: string;
  pastorName?: string;
  pastorRole?: string;
  /** Who party — person Profile ID (also the booker's when Who is a visitor). */
  personId: string;
  personName?: string;
  whoKind?: "profile" | "visitor";
  visitorId?: string;
  visitorName?: string;
  location?: string;
  notes?: string;
  status: string;
  createdAt: string;
  archivedAt?: string;
}

export interface AppointmentListResponse {
  data: Appointment[];
  total: number;
  summary: Record<string, number>;
}

export type AppointmentContactKind = "with" | "who";

export interface AppointmentContact {
  id: string;
  name: string;
  role: string;
  /** Which picker this contact is for. A "who" contact with role "visitor" is a visitor. */
  kind: AppointmentContactKind;
  isPastor: boolean;
  branchId?: string;
  branchName?: string;
  avatarUrl?: string;
}

export interface AppointmentContactsResponse {
  data: AppointmentContact[];
  total: number;
}

export type AppointmentWhoKind = "profile" | "visitor";

export interface AppointmentMutationInput {
  title: string;
  scheduledAt: string;
  /** With party — pastor Profile ID. */
  withId: string;
  /** Who party kind: "profile" via `whoId`, or "visitor" via `visitorId`. */
  whoKind?: AppointmentWhoKind;
  whoId?: string;
  visitorId?: string;
  location?: string;
  notes?: string;
  status?: string;
}

export interface ListAppointmentsParams {
  page?: number;
  limit?: number;
  status?: string;
  archived?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ─── Helpers ─────────────────────────────────────────────

function buildAppointmentQuery(params: ListAppointmentsParams): string {
  const searchParams = new URLSearchParams();
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.archived) searchParams.set("archived", "true");
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function invalidateAppointments(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["appointments-list"] });
  qc.invalidateQueries({ queryKey: ["appointment-detail"] });
}

// ─── Queries ─────────────────────────────────────────────

/** List appointments in the current user's scope. */
export function useAppointments(params: ListAppointmentsParams = {}) {
  return useQuery({
    queryKey: ["appointments-list", params],
    queryFn: () =>
      api.get<AppointmentListResponse>(`/appointments${buildAppointmentQuery(params)}`),
  });
}

/** Fetch a single appointment detail. */
export function useAppointment(id: string | null) {
  return useQuery({
    queryKey: ["appointment-detail", id],
    queryFn: async () => {
      const res = await api.get<{ appointment: Appointment }>(`/appointments/${id}`);
      return res.appointment;
    },
    enabled: !!id,
  });
}

/** List participant contacts for the With/Who pickers. */
export function useAppointmentContacts(
  params: {
    kind: "with" | "who";
    search?: string;
    includeVisitors?: boolean;
  } = { kind: "with" }
) {
  const query = new URLSearchParams();
  query.set("kind", params.kind);
  if (params.search) query.set("search", params.search);
  if (params.includeVisitors) query.set("includeVisitors", "true");
  const qs = query.toString();
  return useQuery({
    queryKey: ["appointment-contacts", params],
    queryFn: () =>
      api.get<AppointmentContactsResponse>(
        `/appointments/contacts${qs ? `?${qs}` : ""}`
      ),
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────

/** Create a new appointment. */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentMutationInput) => {
      const res = await api.post<{ appointment: Appointment }>("/appointments", input);
      return res.appointment;
    },
    onSuccess: () => invalidateAppointments(queryClient),
  });
}

/** Update an appointment. */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<AppointmentMutationInput>;
    }) => {
      const res = await api.patch<{ appointment: Appointment }>(
        `/appointments/${id}`,
        input
      );
      return res.appointment;
    },
    onSuccess: () => invalidateAppointments(queryClient),
  });
}

/** Archive an appointment. */
export function useArchiveAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: boolean }>(`/appointments/${id}/archive`),
    onSuccess: () => invalidateAppointments(queryClient),
  });
}

/** Restore an archived appointment. */
export function useRestoreAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: boolean }>(`/appointments/${id}/restore`),
    onSuccess: () => invalidateAppointments(queryClient),
  });
}

/** Permanently delete an archived appointment. */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean }>(`/appointments/${id}`),
    onSuccess: () => invalidateAppointments(queryClient),
  });
}
