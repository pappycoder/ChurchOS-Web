import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePermissions, type PermissionChecker } from "./use-permissions";

const state = vi.hoisted(() => ({
  data: undefined as { status: string; permissions: string[]; planFeatures?: string[] } | undefined,
  isLoading: false,
  isError: false,
}));
vi.mock("@/hooks/use-profile", () => ({ useCurrentProfile: () => state }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({}) }));

function check() {
  let checker: PermissionChecker | undefined;
  function Consumer() { checker = usePermissions(); return null; }
  renderToString(React.createElement(Consumer));
  return checker!;
}

describe("frontend permission enforcement", () => {
  beforeEach(() => { state.data = { status: "active", permissions: ["events:update"], planFeatures: ["events"] }; state.isLoading = false; state.isError = false; });

  it("grants only the effective permissions returned by the API", () => {
    const checker = check();
    expect(checker.ready).toBe(true);
    expect(checker.can("events", "update")).toBe(true);
    expect(checker.can("events", "delete")).toBe(false);
    expect(checker.canAny("profiles:update", "events:update")).toBe(true);
  });

  it.each([undefined, []])("blocks all paid grants when features are %s", (features) => {
    state.data = { status: "active", planFeatures: features, permissions: ["events:view", "events:read", "events:update", "events:delete", "members:all:read"] };
    const checker = check();
    expect(checker.canAny("events:view", "events:read", "events:update", "events:delete")).toBe(false);
    expect(checker.canAny("members:all:read")).toBe(true);
  });

  it("separates Community events from Network ticket and check-in permissions", () => {
    state.data = { status: "active", planFeatures: ["events"], permissions: ["events:list:read", "events:tickets:read", "events:checkin:create"] };
    const checker = check();
    expect(checker.canAny("events:list:read")).toBe(true);
    expect(checker.canAny("events:tickets:read", "events:checkin:create")).toBe(false);
  });

  it("includes giving and payment setup on Essentials without unlocking groups, communication or analytics", () => {
    state.data={status:"active",planFeatures:["giving"],permissions:["giving:records:read","giving:records:create","giving:categories:create","integrations:read","integrations:update","cell_groups:giving:read","broadcasts:read","analytics:giving:read"]};
    const checker=check();
    expect(checker.canAny("giving:records:read")).toBe(true);
    expect(checker.canAny("giving:records:create")).toBe(true);
    expect(checker.canAny("integrations:update")).toBe(true);
    expect(checker.canAny("cell_groups:giving:read","broadcasts:read","analytics:giving:read")).toBe(false);
  });

  it.each(["loading", "error", "inactive", "missing"])("fails closed for %s, including cached grants", (condition) => {
    if (condition === "loading") state.isLoading = true;
    if (condition === "error") state.isError = true;
    if (condition === "inactive") state.data!.status = "inactive";
    if (condition === "missing") state.data = undefined;
    const checker = check();
    expect(checker.ready).toBe(false);
    expect(checker.can("events", "update")).toBe(false);
    expect(checker.canAny("events:update")).toBe(false);
  });
});
