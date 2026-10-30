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
    ['/events/management', 'tickets'], ['/events/check-in', 'events'], ['/events/id/tiers', 'tickets'],
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

 it('includes Community registration and check-in without enabling ticket management or Essentials events', () => {
   const community = ['giving', 'reports', 'events'];
   for (const action of ['read', 'create', 'update']) {
     expect(planAllowsPermission(community, `events:registrations:${action}`)).toBe(true);
     expect(planAllowsPermission(['giving', 'reports'], `events:registrations:${action}`)).toBe(false);
     expect(planAllowsPermission(community, `events:checkin:${action}`)).toBe(true);
     expect(planAllowsPermission(['giving', 'reports'], `events:checkin:${action}`)).toBe(false);
     expect(planAllowsPermission(community, `events:tickets:${action}`)).toBe(false);
   }
   expect(planAllowsPath(community, '/events/check-in?eventId=event')).toBe(true);
   expect(planAllowsPath(['giving', 'reports'], '/events/check-in')).toBe(false);
 });

it('maps Paper (Abide IA) routes to the same feature boundaries as legacy paths', () => {
  expect(featureForPath('/insights')).toBe('analytics');
  expect(featureForPath('/insights/reports')).toBe('reports');
  expect(featureForPath('/operations/assets')).toBe('assets');
  expect(featureForPath('/gatherings/events/tiers')).toBe('tickets');
  expect(featureForPath('/gatherings/events/tickets')).toBe('tickets');
  expect(featureForPath('/gatherings/events/registrations')).toBe('events');
  expect(featureForPath('/gatherings/events')).toBe('events');
  expect(featureForPath('/gatherings/groups')).toBe('groups');
  expect(featureForPath('/connect/broadcasts')).toBe('email');
  expect(featureForPath('/connect/appointments')).toBe('pastoral');
  expect(featureForPath('/library/forms')).toBe('forms');
  expect(featureForPath('/library/sermons')).toBe('media');
  expect(featureForPath('/people/pastoral')).toBe('pastoral');
  expect(featureForPath('/admin/channels')).toBe('giving');
  expect(planAllowsPath(['giving', 'reports'], '/insights/reports')).toBe(true);
  expect(planAllowsPath(['giving'], '/operations/assets')).toBe(false);
});
