import { describe, it, expect } from "vitest";
import { featureForPath, featureForPermission } from "./plan-features";
describe("Subscription feature mapping", () => {
  it("maps paid routes while leaving directory and account access available", () => {
    expect(featureForPath("/forms")).toBe("forms");
    expect(featureForPath("/analytics/giving")).toBe("analytics");
    expect(featureForPath("/members")).toBeUndefined();
    expect(featureForPath("/profile")).toBeUndefined();
  });
  it("maps feature permissions independently of a user role", () => {
    expect(featureForPermission("giving:records:create")).toBe("giving");
    expect(featureForPermission("cell_groups:own:update")).toBe("groups");
    expect(featureForPermission("billing:update")).toBeUndefined();
  });
});
