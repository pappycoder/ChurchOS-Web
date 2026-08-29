"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DepartmentMember {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  role: string;
  joinedAt: string;
}

export interface Department {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  parentId?: string;
  members: DepartmentMember[];
  memberCount: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CellGroup {
  id: string;
  churchId: string;
  name: string;
  leaderId?: string;
  leaderFirstName?: string;
  leaderLastName?: string;
  branchId?: string;
  branchName?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  meetingDay?: string;
  meetingTime?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NearestCellGroup extends CellGroup {
  distanceKm: number;
}

export interface CellGroupMember {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  role: string;
  joinedAt: string;
}

export interface CellGroupAttendanceRecord {
  id: string;
  memberId?: string;
  firstName: string;
  lastName: string;
  visitorId?: string;
  visitorName?: string;
  status: string;
  notes: string | null;
  meetingDate: string;
}

export interface CellGroupAttendanceSummary {
  totalMeetings: number;
  averageAttendance: number;
  memberCount: number;
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  parentId?: string;
}

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export interface CreateCellGroupInput {
  name: string;
  branchId?: string;
  leaderId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  meetingDay?: string;
  meetingTime?: string;
}

export type UpdateCellGroupInput = Partial<CreateCellGroupInput>;

export interface AddGroupMemberInput {
  memberId: string;
  role?: string;
}

export interface RecordAttendanceInput {
  memberId?: string;
  visitorId?: string;
  visitorName?: string;
  meetingDate: string;
  status?: string;
  notes?: string;
}

export const MEETING_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const GROUP_ROLES: { value: string; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "leader", label: "Leader" },
  { value: "assistant_leader", label: "Assistant Leader" },
];

export const ATTENDANCE_STATUSES: { value: string; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

function invalidateAdminCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  groupId?: string
) {
  queryClient.invalidateQueries({ queryKey: ["departments-list"] });
  queryClient.invalidateQueries({ queryKey: ["department"] });
  queryClient.invalidateQueries({ queryKey: ["cell-groups-list"] });
  queryClient.invalidateQueries({ queryKey: ["cell-group-members"] });
  queryClient.invalidateQueries({ queryKey: ["cell-group-attendance"] });
  queryClient.invalidateQueries({ queryKey: ["cell-group-summary"] });
  if (groupId) queryClient.invalidateQueries({ queryKey: ["cell-group", groupId] });
}

export function useDepartmentsList(params: { archived?: boolean } = {}) {
  const searchParams = new URLSearchParams();
  if (params.archived) searchParams.set("archived", "true");
  const queryString = searchParams.toString();
  return useQuery({
    queryKey: ["departments-list", params],
    queryFn: () => api.get<Department[]>(`/admin/departments${queryString ? `?${queryString}` : ""}`),
  });
}

export function useDepartment(departmentId: string) {
  return useQuery({
    queryKey: ["department", departmentId],
    queryFn: () => api.get<Department>(`/admin/departments/${departmentId}`),
    enabled: !!departmentId,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDepartmentInput) =>
      api.post<Department>("/admin/departments", input),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useUpdateDepartment(departmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDepartmentInput) =>
      api.patch<Department>(`/admin/departments/${departmentId}`, input),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => api.delete<void>(`/admin/departments/${departmentId}`),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useArchiveDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) =>
      api.post<Department>(`/admin/departments/${departmentId}/archive`, {}),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useRestoreArchiveDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) =>
      api.post<Department>(`/admin/departments/${departmentId}/restore`, {}),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useAddDepartmentMember(departmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddGroupMemberInput) =>
      api.post<void>(`/admin/departments/${departmentId}/members`, input),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useRemoveDepartmentMember(departmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete<void>(`/admin/departments/${departmentId}/members/${memberId}`),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useCellGroupsList(params: { archived?: boolean } = {}) {
  const searchParams = new URLSearchParams();
  if (params.archived) searchParams.set("archived", "true");
  const queryString = searchParams.toString();
  return useQuery({
    queryKey: ["cell-groups-list", params],
    queryFn: () => api.get<CellGroup[]>(`/admin/cell-groups${queryString ? `?${queryString}` : ""}`),
  });
}

export function useCellGroup(groupId: string) {
  return useQuery({
    queryKey: ["cell-group", groupId],
    queryFn: () => api.get<CellGroup>(`/admin/cell-groups/${groupId}`),
    enabled: !!groupId,
  });
}

export function useNearestCellGroups(latitude?: number, longitude?: number, limit = 5) {
  return useQuery({
    queryKey: ["cell-groups-nearest", latitude, longitude, limit],
    queryFn: () =>
      api.get<NearestCellGroup[]>(
        `/admin/cell-groups/nearest?latitude=${latitude}&longitude=${longitude}&limit=${limit}`
      ),
    enabled: typeof latitude === "number" && typeof longitude === "number",
  });
}

export function useCreateCellGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCellGroupInput) =>
      api.post<CellGroup>("/admin/cell-groups", input),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useUpdateCellGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCellGroupInput) =>
      api.patch<CellGroup>(`/admin/cell-groups/${groupId}`, input),
    onSuccess: () => invalidateAdminCaches(queryClient, groupId),
  });
}

export function useDeleteCellGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => api.delete<void>(`/admin/cell-groups/${groupId}`),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useArchiveCellGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      api.post<CellGroup>(`/admin/cell-groups/${groupId}/archive`, {}),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useRestoreArchiveCellGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      api.post<CellGroup>(`/admin/cell-groups/${groupId}/restore`, {}),
    onSuccess: () => invalidateAdminCaches(queryClient),
  });
}

export function useAddCellGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddGroupMemberInput) =>
      api.post<void>(`/admin/cell-groups/${groupId}/members`, input),
    onSuccess: () => invalidateAdminCaches(queryClient, groupId),
  });
}

export function useRemoveCellGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete<void>(`/admin/cell-groups/${groupId}/members/${memberId}`),
    onSuccess: () => invalidateAdminCaches(queryClient, groupId),
  });
}

export function useCellGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ["cell-group-members", groupId],
    queryFn: () => api.get<CellGroupMember[]>(`/admin/cell-groups/${groupId}/members`),
    enabled: !!groupId,
  });
}

export function useCellGroupAttendance(groupId: string, meetingDate?: string) {
  return useQuery({
    queryKey: ["cell-group-attendance", groupId, meetingDate ?? ""],
    queryFn: () => {
      const path = meetingDate
        ? `/admin/cell-groups/${groupId}/attendance?meetingDate=${encodeURIComponent(meetingDate)}`
        : `/admin/cell-groups/${groupId}/attendance`;
      return api.get<CellGroupAttendanceRecord[]>(path);
    },
    enabled: !!groupId,
  });
}

export function useCellGroupAttendanceSummary(groupId: string) {
  return useQuery({
    queryKey: ["cell-group-summary", groupId],
    queryFn: () => api.get<CellGroupAttendanceSummary>(`/admin/cell-groups/${groupId}/attendance/summary`),
    enabled: !!groupId,
  });
}

export function useRecordCellGroupAttendance(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordAttendanceInput) =>
      api.post<void>(`/admin/cell-groups/${groupId}/attendance`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cell-group-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["cell-group-summary"] });
      queryClient.invalidateQueries({ queryKey: ["cell-group", groupId] });
    },
  });
}