import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePermissions, type PermissionChecker } from "./use-permissions";

const state = vi.hoisted(() => ({
  data: undefined as { status: string; permissions: string[] } | undefined,
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
  beforeEach(() => { state.data = { status: "active", permissions: ["events:update"] }; state.isLoading = false; state.isError = false; });

  it("grants only the effective permissions returned by the API", () => {
    const checker = check();
    expect(checker.ready).toBe(true);
    expect(checker.can("events", "update")).toBe(true);
    expect(checker.can("events", "delete")).toBe(false);
    expect(checker.canAny("profiles:update", "events:update")).toBe(true);
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
