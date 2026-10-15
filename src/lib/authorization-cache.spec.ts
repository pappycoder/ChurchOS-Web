import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import { authorizationScopeKey, resetAuthorizationQueries } from "./authorization-cache";

describe("authorization cache isolation", () => {
  const profile = { profileId: "person", churchId: "church", branchId: "a", isAdminHq: true, permissions: ["events:update", "members:all:read"] };
  it("changes scope for account, branch, HQ, linked member and permission changes", () => {
    const key = authorizationScopeKey(profile);
    for (const changes of [{ profileId: "other" }, { churchId: "other" }, { branchId: "b" }, { isAdminHq: false }, { memberId: "member" }, { permissions: ["events:calendar:read"] }])
      expect(authorizationScopeKey({ ...profile, ...changes })).not.toBe(key);
    expect(authorizationScopeKey({ ...profile, permissions: [...profile.permissions].reverse() })).toBe(key);
  });

  it("clears previous workspace data while preserving the verified profile", async () => {
    const client = new QueryClient();
    client.setQueryData(["current-profile"], profile);
    client.setQueryData(["members-list", {}], [{ name: "Previous scope" }]);
    client.setQueryData(["analytics", "giving"], { total: 99 });
    await resetAuthorizationQueries(client);
    expect(client.getQueryData(["current-profile"])).toEqual(profile);
    expect(client.getQueryData(["members-list", {}])).toBeUndefined();
    expect(client.getQueryData(["analytics", "giving"])).toBeUndefined();
    client.clear();
  });

  it("aborts an old scope request before its result can repopulate the cache", async () => {
    const client = new QueryClient();
    let aborted = false;
    const pending = client.fetchQuery({ queryKey: ["members-list"], queryFn: ({ signal }) => new Promise((resolve) => {
      signal.addEventListener("abort", () => { aborted = true; resolve(["old scope"]); });
    }) }).catch(() => undefined);
    await resetAuthorizationQueries(client);
    await pending;
    expect(aborted).toBe(true);
    expect(client.getQueryData(["members-list"])).toBeUndefined();
    client.clear();
  });
});
