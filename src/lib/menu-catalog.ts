/**
 * @file Canonical surface-permission catalog + coherence helpers.
 *
 * Mirrors the backend seed's `SURFACES` expansion: a role holding the coarse
 * `resource:action` permission also holds `resource:<surface>:<action>` for
 * every surface of that resource (plus `resource:view` when it holds any
 * `resource:*`). Nav items, route gates and backend decorators all key off
 * these codes — keep this list and the backend seed in sync.
 */

export const PERMISSION_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "view",
] as const;

/** Resources with a dedicated surface hierarchy (matches backend seed). */
export const SURFACE_RESOURCES: Record<string, string[]> = {
  members: ["all", "new", "import"],
  attendance: ["dashboard", "services", "checkin", "records", "reports"],
  giving: ["dashboard", "categories", "records", "reports", "recurring"],
  events: ["calendar", "list", "checkin", "registrations", "tickets"],
  sermons: ["list", "new", "series", "speakers"],
  media: ["library", "upload", "folders"],
  pastoral: ["notes", "life-events", "risk-scores", "engagement"],
  visitors: ["list", "new", "followup"],
  assets: ["list", "categories", "maintenance", "loans"],
  forms: ["list", "submissions"],
};

/** Single-page / no-surface resources (only coarse `resource:action` codes). */
export const COARSE_RESOURCES = [
  "families",
  "appointments",
  "templates",
  "broadcasts",
  "whatsapp",
  "emails",
  "departments",
  "cell_groups",
  "reports",
  "users",
  "church_settings",
  "branches",
  "analytics",
];

export interface ParsedPermission {
  resource: string;
  surface?: string;
  action: string;
}

export function parsePermission(name: string): ParsedPermission {
  const [resource, surface, action] = name.split(":");
  return surface && action
    ? { resource, surface, action }
    : { resource, action: surface ?? "read" };
}

/** True when `name` is a known coarse (`resource:action`) or surface (`resource:surface:action`) code. */
export function isValidPermission(name: string): boolean {
  const parts = name.split(":");
  if (parts.length === 2) {
    const [resource, action] = parts;
    const known =
      resource in SURFACE_RESOURCES || COARSE_RESOURCES.includes(resource);
    return known && (PERMISSION_ACTIONS as readonly string[]).includes(action);
  }
  if (parts.length === 3) {
    const { resource, surface, action } = parsePermission(name);
    return (
      surface !== undefined &&
      SURFACE_RESOURCES[resource]?.includes(surface) === true &&
      (PERMISSION_ACTIONS as readonly string[]).includes(action)
    );
  }
  return false;
}

/**
 * The never-stricter guarantee used by the guard: if a nav item is shown via
 * `nav`, its route gate `route` must never deny a user who could see the item.
 *
 * Coarse `resource:action` implies the same-action surface codes (the seed
 * grants them together), so a coarse nav gate permits a surface route gate for
 * the same resource+action. A surface nav gate never implies the coarse parent
 * (a custom role can hold a surface code without the coarse code).
 */
export function routeNotStricterThanNav(
  nav: string | undefined,
  route: string | undefined,
): boolean {
  if (!route) return true;
  if (!nav) return false;
  if (nav === route) return true;

  const navParts = parsePermission(nav);
  const routeParts = parsePermission(route);
  if (!navParts.surface) {
    // coarse nav → surface route for the same resource+action
    return (
      navParts.resource === routeParts.resource &&
      navParts.action === routeParts.action &&
      routeParts.surface !== undefined
    );
  }
  if (navParts.surface && !routeParts.surface) {
    // surface nav → coarse route: narrower nav grant may lack the coarse code
    return false;
  }
  return false;
}