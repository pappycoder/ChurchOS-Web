import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRolesSummary, useRolePermissions, useAllPermissions } from "./use-roles";
import { useAttendanceServices, useAttendanceRecords, useAttendanceSummary, useAttendanceTrends } from "./use-attendance";
import { useGivingCategories, useGivingSummary, useGivingTransactions } from "./use-giving";
import { useAssetCategories } from "./use-assets";
import { useMediaFolders } from "./use-media";
import { useFormSubmissions } from "./use-forms";
import { useCurrentProfile } from "./use-profile";
import { useEventRegistrations, useEventAttendance } from "./use-events";

const state = vi.hoisted(() => ({ grants: new Set<string>(), query: vi.fn((options: { enabled?: boolean; refetchOnWindowFocus?: boolean; refetchOnReconnect?: boolean }) => options) }));
vi.mock("@tanstack/react-query", () => ({ useQuery: state.query, useMutation: vi.fn(), useQueryClient: vi.fn() }));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ can: (resource: string, action: string) => state.grants.has(`${resource}:${action}`) }) }));
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));

describe("permission-gated queries", () => {
  beforeEach(() => { state.grants.clear(); state.query.mockClear(); });

  it("does not fetch role administration data for unauthorized label consumers", () => {
    useRolesSummary(); useRolePermissions("secretary"); useAllPermissions();
    expect(state.query.mock.calls.map(([options]) => options.enabled)).toEqual([false, false, false]);
    state.query.mockClear(); state.grants.add("roles:read");
    useRolesSummary(); useRolePermissions("secretary"); useAllPermissions();
    expect(state.query.mock.calls.map(([options]) => options.enabled)).toEqual([true, true, true]);
  });

  it("fetches event registrations and attendance independently by permission", () => {
    state.grants.add("events:registrations:read");
    useEventRegistrations("event"); useEventAttendance("event");
    expect(state.query.mock.calls.map(([options]) => options.enabled)).toEqual([true, false]);
    state.query.mockClear(); state.grants.add("events:checkin:read");
    useEventAttendance("event"); useEventRegistrations("");
    expect(state.query.mock.calls.map(([options]) => options.enabled)).toEqual([true, false]);
  });

  it("refreshes authorization state on focus and reconnect", () => {
    useCurrentProfile();
    expect(state.query.mock.calls[0][0]).toMatchObject({ refetchOnWindowFocus: true, refetchOnReconnect: true });
  });
});

// Read-only roles must load reference data without a create/update/delete grant.

describe("read-only workflow queries", () => {
  beforeEach(() => { state.grants.clear(); state.query.mockClear(); });

  it("loads authorized filter data without write grants", () => {
    for (const grant of ["attendance:services:read", "giving:categories:read", "assets:categories:read", "media:folders:read", "forms:submissions:read"]) state.grants.add(grant);
    useAttendanceServices(); useGivingCategories(); useAssetCategories(); useMediaFolders(); useFormSubmissions("form");
    expect(state.query.mock.calls.map(([options]) => options.enabled)).toEqual([true, true, true, true, true]);
  });

  it("does not request unauthorized optional filter datasets", () => {
    useAttendanceServices(); useGivingCategories(); useAssetCategories(); useMediaFolders(); useFormSubmissions("form");
    expect(state.query.mock.calls.every(([options]) => options.enabled === false)).toBe(true);
  });

  it("loads aggregate giving for dashboard-only roles without requesting transactions", () => {
    state.grants.add("giving:dashboard:read");
    useGivingSummary(); useGivingTransactions();
    expect(state.query.mock.calls.map(([options]) => options.enabled)).toEqual([true, false]);
  });

  it("loads attendance totals without requiring records, reports or check-in writes", () => {
    state.grants.add("attendance:dashboard:read");
    useAttendanceSummary(); useAttendanceRecords(); useAttendanceTrends();
    expect(state.query.mock.calls.map(([options]) => options.enabled)).toEqual([true, false, false]);
  });
});
