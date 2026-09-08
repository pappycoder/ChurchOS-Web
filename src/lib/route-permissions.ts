/**
 * @file Central map of dashboard routes to the permission (or legacy role set)
 * required to view them. Mirrors the sidebar nav gates — keep both in sync.
 *
 * Matching is longest-prefix-first: a rule matches when the pathname equals
 * the prefix or lives beneath it (`prefix` or `prefix/...`). Unmapped routes
 * (e.g. /dashboard, /profile) are open to every authenticated user.
 */

export interface RoutePermissionRule {
  prefix: string;
  /** Required `resource:surface:action` permission, e.g. "members:all:read".
   * Single-page resources keep coarse `resource:action` codes. */
  permission?: string;
  /** Any-of role fallback for areas without a dedicated permission resource. */
  roles?: string[];
}

export const ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  // Members
  { prefix: "/members/import", permission: "members:import:create" },
  { prefix: "/members/new", permission: "members:new:create" },
  { prefix: "/members/families", permission: "families:read" },
  { prefix: "/members", permission: "members:all:read" },

  // Attendance
  { prefix: "/attendance/check-in", permission: "attendance:checkin:create" },
  { prefix: "/attendance/services", permission: "attendance:services:read" },
  { prefix: "/attendance/records", permission: "attendance:records:read" },
  { prefix: "/attendance/reports", permission: "attendance:reports:read" },
  { prefix: "/attendance", permission: "attendance:dashboard:read" },

  // Giving
  { prefix: "/giving/categories", permission: "giving:categories:read" },
  { prefix: "/giving/records", permission: "giving:records:read" },
  { prefix: "/giving/reports", permission: "giving:reports:read" },
  { prefix: "/giving/recurring", permission: "giving:recurring:read" },
  { prefix: "/giving", permission: "giving:dashboard:read" },

  // Events
  { prefix: "/events/check-in", permission: "events:checkin:create" },
  { prefix: "/events/new", permission: "events:create" },
  { prefix: "/events/management", permission: "events:tickets:read" },
  { prefix: "/events/list", permission: "events:list:read" },
  { prefix: "/events/registrations", permission: "events:registrations:read" },
  { prefix: "/events/[eventId]/edit", permission: "events:update" },
  { prefix: "/events/[eventId]/tiers", permission: "events:update" },
  { prefix: "/events", permission: "events:calendar:read" },

  // Sermons
  { prefix: "/sermons/new", permission: "sermons:new:create" },
  { prefix: "/sermons/series", permission: "sermons:series:read" },
  { prefix: "/sermons/speakers", permission: "sermons:speakers:read" },
  { prefix: "/sermons/[sermonId]/edit", permission: "sermons:update" },
  { prefix: "/sermons", permission: "sermons:list:read" },

  // Media
  { prefix: "/media/upload", permission: "media:upload:create" },
  { prefix: "/media/folders", permission: "media:folders:read" },
  { prefix: "/media", permission: "media:library:read" },

  // Pastoral care · Visitors
  { prefix: "/pastoral/life-events", permission: "pastoral:life-events:read" },
  { prefix: "/pastoral/risk-scores", permission: "pastoral:risk-scores:read" },
  { prefix: "/pastoral/engagement", permission: "pastoral:engagement:read" },
  { prefix: "/pastoral", permission: "pastoral:notes:read" },
  { prefix: "/visitors/new", permission: "visitors:new:create" },
  { prefix: "/visitors/follow-up", permission: "visitors:followup:update" },
  { prefix: "/visitors", permission: "visitors:list:read" },

  // Communication
  { prefix: "/communication/templates", permission: "templates:read" },
  { prefix: "/communication/broadcasts", permission: "broadcasts:read" },
  { prefix: "/communication/messages", permission: "whatsapp:read" },
  { prefix: "/communication/inbox", permission: "emails:read" },
  { prefix: "/appointments", permission: "appointments:read" },

  // Departments · Assets · Forms
  { prefix: "/departments/cell-groups", permission: "cell_groups:read" },
  { prefix: "/departments", permission: "departments:read" },
  { prefix: "/assets/categories", permission: "assets:categories:read" },
  { prefix: "/assets/maintenance", permission: "assets:maintenance:read" },
  { prefix: "/assets/loans", permission: "assets:loans:read" },
  { prefix: "/assets", permission: "assets:list:read" },
  { prefix: "/forms/new", permission: "forms:list:create" },
  { prefix: "/forms/[formId]/edit", permission: "forms:list:update" },
  { prefix: "/forms/[formId]/fill", permission: "forms:list:read" },
  { prefix: "/forms/submissions", permission: "forms:submissions:read" },
  { prefix: "/forms", permission: "forms:list:read" },

  // Reports — single generator page guarded by the reports:read permission
  { prefix: "/reports", permission: "reports:read" },

  // Administration
  { prefix: "/admin/users", permission: "users:read" },
  { prefix: "/admin/roles", roles: ["church_admin", "super_admin"] },
  { prefix: "/admin/settings", permission: "church_settings:update" },
  { prefix: "/admin/branches", permission: "branches:read" },

  // Analytics — role ceilings mirror the backend @RequireRoles (no dedicated
  // permission resource). Longest-prefix wins, so per-page rules override the base.
  { prefix: "/analytics/giving", roles: ["church_admin", "senior_pastor", "branch_pastor", "treasurer"] },
  { prefix: "/analytics/attendance", roles: ["church_admin", "senior_pastor", "branch_pastor"] },
  { prefix: "/analytics/members", roles: ["church_admin", "senior_pastor", "branch_pastor"] },
  { prefix: "/analytics", roles: ["church_admin", "senior_pastor", "branch_pastor"] },
];

/** Longest-prefix match; returns null for open routes. */
export function matchRoutePermission(pathname: string): RoutePermissionRule | null {
  const sorted = [...ROUTE_PERMISSIONS].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const rule of sorted) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule;
    }
  }
  return null;
}

/** True when the user passes the given rule (or when there is no rule). */
export function checkRule(
  rule: RoutePermissionRule | null,
  can: (permissionName: string) => boolean,
  hasRole: (...roleNames: string[]) => boolean
): boolean {
  if (!rule) return true;
  if (rule.permission) return can(rule.permission);
  if (rule.roles?.length) return hasRole(...rule.roles);
  return true;
}
