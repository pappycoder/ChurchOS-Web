import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useGivingDashboardCharts,
  useMemberDashboard,
} from "./use-dashboard-charts";
import { useAttendanceSummary, useAttendanceTrends } from "./use-attendance";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  get: vi.fn(),
  can: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.query }));
vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ can: mocks.can }),
}));
vi.mock("@/lib/api", () => ({ api: { get: mocks.get } }));

describe("module dashboard queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.can.mockReturnValue(true);
  });

  it("uses member access and separates branches while sharing member mutation invalidation", async () => {
    useMemberDashboard({ branchId: "branch-a" });
    useMemberDashboard({ branchId: "branch-b" });
    const [first, second] = mocks.query.mock.calls.map(([options]) => options);
    expect(first.queryKey).not.toEqual(second.queryKey);
    expect(first.queryKey.slice(0, 1)).toEqual(["members-list"]);
    await second.queryFn({ signal: undefined });
    expect(mocks.get).toHaveBeenCalledWith(
      "/members/dashboard?branchId=branch-b",
      { signal: undefined },
    );
    expect(mocks.can).toHaveBeenCalledWith("members:all", "read");
  });

  it("sends giving chart filters and shares giving summary invalidation", async () => {
    useGivingDashboardCharts({
      currency: "USD",
      branchId: "branch-a",
      startDate: "2026-10-01",
    });
    const options = mocks.query.mock.calls[0][0];
    expect(options.queryKey.slice(0, 1)).toEqual(["giving-summary"]);
    const signal = new AbortController().signal;
    await options.queryFn({ signal });
    expect(mocks.get).toHaveBeenCalledWith(
      "/giving/dashboard/charts?currency=USD&branchId=branch-a&startDate=2026-10-01",
      { signal },
    );
    expect(mocks.can).toHaveBeenCalledWith("giving:dashboard", "read");
  });

  it("does not require an Analytics grant", () => {
    mocks.can.mockImplementation(
      (resource: string) => !resource.startsWith("analytics"),
    );
    useMemberDashboard();
    useGivingDashboardCharts();
    useAttendanceSummary();
    useAttendanceTrends();
    expect(mocks.query.mock.calls.every(([options]) => options.enabled)).toBe(
      true,
    );
  });

  it("fails closed without each module grant", () => {
    mocks.can.mockReturnValue(false);
    useMemberDashboard();
    useGivingDashboardCharts();
    useAttendanceSummary();
    useAttendanceTrends();
    expect(mocks.query.mock.calls.every(([options]) => !options.enabled)).toBe(
      true,
    );
  });

  it("does not fetch invalid ranges or before profile readiness", () => {
    useMemberDashboard({}, { enabled: false });
    useGivingDashboardCharts({}, { enabled: false });
    useAttendanceSummary({}, { enabled: false });
    useAttendanceTrends({}, { enabled: false });
    expect(mocks.query.mock.calls.every(([options]) => !options.enabled)).toBe(
      true,
    );
  });
});
