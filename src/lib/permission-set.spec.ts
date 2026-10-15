import { describe, it, expect } from "vitest";
import { getPermissionSet } from "./permission-set";

describe("shared permission indexes", () => {
  it("shares one index across consumers of the same permission array", () => {
    const permissions = ["members:all:read", "members:all:read", "events:update"];
    const index = getPermissionSet(permissions);
    expect(getPermissionSet(permissions)).toBe(index);
    expect(index.size).toBe(2);
    expect(index.has("events:update")).toBe(true);
    expect(index.has("profiles:update")).toBe(false);
  });

  it("does not carry grants between different profiles or permission revisions", () => {
    const first = getPermissionSet(["events:update"]);
    const changed = getPermissionSet(["events:calendar:read"]);
    expect(changed).not.toBe(first);
    expect(changed.has("events:update")).toBe(false);
    expect(getPermissionSet()).toBe(getPermissionSet([]));
    expect(getPermissionSet().size).toBe(0);
  });
});
