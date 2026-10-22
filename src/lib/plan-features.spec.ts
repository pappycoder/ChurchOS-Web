import { describe, it, expect } from "vitest";
import { featureForPath, featureForPermission, planAllowsPath, planAllowsPermission } from "./plan-features";
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

describe('Tier-specific page boundaries', () => {
  it.each([
    ['/departments', 'groups'], ['/departments/cell-groups', 'groups'],
    ['/events/management', 'tickets'], ['/events/check-in', 'tickets'], ['/events/id/tiers', 'tickets'],
    ['/events/registrations', 'events'], ['/admin/integrations', 'giving'],
    ['/communication/broadcasts', 'email'], ['/communication/templates', 'email'],
    ['/sermons', 'media'], ['/media/upload', 'media'], ['/admin/settings/webhooks', 'webhooks'],
  ])('maps %s to %s', (path, feature) => expect(featureForPath(path)).toBe(feature));
});

it('includes giving and financial reports in Essentials alongside member and attendance reports', () => {
  for (const path of ['/giving/reports', '/reports', '/reports/financial']) expect(planAllowsPath(['giving'], path)).toBe(true);
  for (const permission of ['giving:reports:read', 'reports:view', 'reports:financial:read']) expect(planAllowsPermission(['giving'], permission)).toBe(true);
  for (const permission of ['reports:attendance:read', 'reports:members:read']) expect(planAllowsPermission(['giving','reports'], permission)).toBe(true);
  expect(planAllowsPath(['giving'], '/analytics/giving')).toBe(false);
});
