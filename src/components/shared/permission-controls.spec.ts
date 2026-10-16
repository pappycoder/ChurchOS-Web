import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { Can } from "./can";
import { PermissionLink } from "./permission-link";

const state = vi.hoisted(() => ({ ready: true, grants: new Set<string>() }));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({
  ready: state.ready,
  can: (resource: string, action: string) => state.grants.has(`${resource}:${action}`),
  canAny: (...names: string[]) => names.some((name) => state.grants.has(name)),
}) }));

describe("shared permission controls", () => {
  beforeEach(() => { state.ready = true; state.grants.clear(); });

  it("supports exact granular permission names without dropping the action", () => {
    state.grants.add("forms:list:update");
    const result = Can({ perm: "forms:list:update", children: "edit", fallback: "denied" });
    expect(result?.props.children).toBe("edit");
    expect(Can({ perm: "forms:list:delete", children: "delete", fallback: "denied" })?.props.children).toBe("denied");
  });

  it("hides controls and internal links until permissions are verified", () => {
    state.ready = false; state.grants.add("members:all:read");
    expect(Can({ perm: "members:all:read", children: "members" })).toBeNull();
    expect(PermissionLink({ href: "/members", children: "members" })).toBeNull();
  });

  it("allows read-only destination links independently of write grants", () => {
    state.grants.add("forms:list:read");
    expect((PermissionLink({ href: "/forms/form-1?tab=details#title", children: "form" }) as ReactElement<{ href: string }>).props.href).toBe("/forms/form-1?tab=details#title");
    expect(PermissionLink({ href: "/forms/form-1/edit", children: "edit" })).toBeNull();
    expect(PermissionLink({ href: "/forms/submissions", children: "submissions" })).toBeNull();
  });

  it("keeps a profile lookup grant from opening user administration", () => {
    state.grants.add("profiles:read");
    expect(PermissionLink({ href: "/admin/users", children: "users" })).toBeNull();
    state.grants.add("users:read");
    expect(PermissionLink({ href: "/admin/users", children: "users" })).not.toBeNull();
  });

  it("fails closed for unknown dashboard destinations and permits external links", () => {
    expect(PermissionLink({ href: "/missing-page", children: "missing" })).toBeNull();
    expect(PermissionLink({ href: "https://example.com", children: "external" })).not.toBeNull();
  });
});
