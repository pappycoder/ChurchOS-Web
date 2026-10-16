import { describe, it, expect } from "vitest";
import { filterPermissionNavigation } from "./permission-navigation";

describe("permission-driven navigation", () => {
  const menu = [
    { title: "Events", permission: "events:calendar:read", children: [
      { title: "Calendar", permission: "events:calendar:read" },
      { title: "All Events", permission: "events:all:read" },
    ] },
    { title: "Members", permission: "members:all:read" },
    { title: "Empty group", children: [{ title: "Private", permission: "private:read" }] },
  ];

  it("retains the filtered child list and removes empty groups", () => {
    const filtered = filterPermissionNavigation(menu, (name) => name === "events:calendar:read");
    expect(filtered.map((item) => item.title)).toEqual(["Events"]);
    expect(filtered[0].children?.map((item) => item.title)).toEqual(["Calendar"]);
    expect(menu[0].children).toHaveLength(2);
  });

  it("keeps a permitted child reachable without an unrelated parent grant", () => {
    const filtered = filterPermissionNavigation(menu, (name) => name === "events:all:read");
    expect(filtered.map((item) => item.title)).toEqual(["Events"]);
    expect(filtered[0].children?.map((item) => item.title)).toEqual(["All Events"]);
  });

  it("does not suppress broader grants when the user also has own-record access", () => {
    const grants = new Set(["members:own:read", "members:all:read", "events:calendar:read", "events:all:read"]);
    const filtered = filterPermissionNavigation(menu, (name) => grants.has(name));
    expect(filtered.map((item) => item.title)).toEqual(["Events", "Members"]);
    expect(filtered[0].children).toHaveLength(2);
  });
});

describe("compound navigation requirements", () => {
  it("requires the API read capability as well as the administration entry grant", () => {
    const entries = [{ title: "Users", permission: "users:read", allOf: ["profiles:read"] }];
    expect(filterPermissionNavigation(entries, (name) => name === "users:read")).toEqual([]);
    expect(filterPermissionNavigation(entries, (name) => name === "profiles:read")).toEqual([]);
    expect(filterPermissionNavigation(entries, () => true)).toEqual(entries);
  });
  it("opens reports with an individual report-read grant", () => {
    const entries = [{ title: "Reports", permission: "reports:view", anyOf: ["reports:financial:read"] }];
    expect(filterPermissionNavigation(entries, (name) => name === "reports:financial:read")).toEqual(entries);
    expect(filterPermissionNavigation(entries, () => false)).toEqual([]);
  });
});
