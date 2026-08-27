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
  /** Required `resource:action` permission, e.g. "members:read". */
  permission?: string;
  /** Any-of role fallback for areas without a dedicated permission resource. */
  roles?: string[];
}

export const ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  // Role-specific dashboards (legacy role gating, no dedicated resource)
  { prefix: "/dashboard/admin", roles: ["super_admin", "church_admin"] },
  { prefix: "/dashboard/pastor", roles: ["senior_pastor", "branch_pastor"] },
  { prefix: "/dashboard/secretary", roles: ["secretary"] },
  { prefix: "/dashboard/treasurer", roles: ["treasurer"] },
  { prefix: "/dashboard/department", roles: ["department_head"] },

  // Members
  { prefix: "/members/import", permission: "members:create" },
  { prefix: "/members/new", permission: "members:create" },
  { prefix: "/members/families", permission: "families:read" },
  { prefix: "/members", permission: "members:read" },

  // Attendance · Giving · Events
  { prefix: "/attendance/check-in", permission: "attendance:create" },
  { prefix: "/attendance/services", permission: "attendance:read" },
  { prefix: "/attendance", permission: "attendance:read" },
  { prefix: "/giving", permission: "giving:read" },
  { prefix: "/events/check-in", permission: "events:create" },
  { prefix: "/events/new", permission: "events:create" },
  { prefix: "/events/management", permission: "events:read" },
  { prefix: "/events/list", permission: "events:read" },
  { prefix: "/events/registrations", permission: "events:read" },
  { prefix: "/events/[eventId]/edit", permission: "events:update" },
  { prefix: "/events/[eventId]/tiers", permission: "events:update" },
  { prefix: "/events", permission: "events:read" },

  // Sermons
  { prefix: "/sermons/new", permission: "sermons:create" },
  { prefix: "/sermons/series", permission: "sermons:read" },
  { prefix: "/sermons/speakers", permission: "sermons:read" },
  { prefix: "/sermons/[sermonId]/edit", permission: "sermons:update" },
  { prefix: "/sermons", permission: "sermons:read" },

  // Media
  { prefix: "/media/upload", permission: "media:create" },
  { prefix: "/media/folders", permission: "media:read" },
  { prefix: "/media", permission: "media:read" },

  // Pastoral care · Visitors
  { prefix: "/pastoral", permission: "pastoral:read" },
  { prefix: "/visitors/new", permission: "visitors:create" },
  { prefix: "/visitors/follow-up", permission: "visitors:update" },
  { prefix: "/visitors", permission: "visitors:read" },

  // Communication
  { prefix: "/communication/templates", permission: "templates:read" },
  { prefix: "/communication/broadcasts", permission: "broadcasts:read" },
  { prefix: "/communication/messages", permission: "whatsapp:read" },

  // Departments · Assets · Forms
  { prefix: "/departments/cell-groups", permission: "cell_groups:read" },
  { prefix: "/departments", permission: "departments:read" },
  { prefix: "/assets", permission: "assets:read" },
  { prefix: "/forms/submissions", permission: "forms:read" },
  { prefix: "/forms", permission: "forms:read" },

  // Reports
  { prefix: "/reports", permission: "reports:read" },

  // Administration
  { prefix: "/admin/users", permission: "users:read" },
  { prefix: "/admin/roles", roles: ["church_admin", "super_admin"] },
  { prefix: "/admin/settings", permission: "church_settings:update" },
  { prefix: "/admin/branches", permission: "branches:read" },

  // Analytics
  { prefix: "/analytics", permission: "analytics:read" },
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
