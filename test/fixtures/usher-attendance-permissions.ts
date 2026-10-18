/**
 * Grants exercised by usher attendance browser scenarios. This is a scoped
 * browser-session fixture, not a copy of the complete backend role template.
 * Backend role tests verify that the real usher role receives these grants.
 * Keep this fixture local so the web repository builds independently.
 */
export const USHER_ATTENDANCE_PERMISSIONS = [
  "attendance:view",
  "attendance:services:create",
  "attendance:services:read",
  "attendance:services:update",
  "attendance:services:delete",
  "attendance:checkin:create",
  "attendance:records:read",
  "attendance:records:update",
  "attendance:dashboard:read",
  "attendance:reports:read",
  "events:view",
  "events:create",
  "events:all:read",
  "events:list:read",
  "events:registrations:read",
  "events:checkin:create",
  "events:checkin:read",
  "events:checkin:update",
  "visitors:new:create",
  "visitors:list:read",
  "branches:read",
];
