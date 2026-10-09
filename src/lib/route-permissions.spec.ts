import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  ROUTE_PERMISSIONS,
  matchRoutePermission,
  type RoutePermissionRule,
} from "./route-permissions";
import {
  isValidPermission,
  routeNotStricterThanNav,
} from "./menu-catalog";

const repoRoot = process.cwd();
const sidebarSrc = fs.readFileSync(
  path.join(repoRoot, "src/components/layouts/sidebar.tsx"),
  "utf8",
);
const headerSrc = fs.readFileSync(
  path.join(repoRoot, "src/components/layouts/header.tsx"),
  "utf8",
);

/** Represents one nav item and its permission gate. */
interface NavItemGate {
  href: string;
  permission?: string;
  /** False when the item carries children — sidebar parents render as menu
   *  openers (`<a href="#">`), so their href never navigates. */
  leaf: boolean;
}

/**
 * Collect every nav item (recursively, including children) that carries a
 * permission gate from a layout source file.
 */
function extractNavGates(source: string): NavItemGate[] {
  const gates: NavItemGate[] = [];
  // Match each nav object: href + optional permission.
  const itemRe = /\{[\s\S]*?href:\s*["`]([^"`]+)["`][\s\S]*?\}/g;
  for (const m of source.matchAll(itemRe)) {
    const block = m[0];
    const href = m[1];
    if (href === "#" || href === "undefined") continue;
    const permMatch = block.match(/permission:\s*["`]([^"`]+)["`]/);
    if (!permMatch) continue;
    gates.push({
      href,
      permission: permMatch?.[1],
      leaf: !block.includes("children:"),
    });
  }
  return gates;
}

describe("route-permissions guard", () => {
  const sidebarGates = extractNavGates(sidebarSrc);
  const headerGates = extractNavGates(headerSrc);

  describe("nav gates use known permission codes", () => {
    it.each([...sidebarGates, ...headerGates].filter((g) => g.permission))(
      "$href uses a known code — $permission",
      (gate) => {
        expect(isValidPermission(gate.permission!)).toBe(true);
      },
    );
  });

  describe("every nav-gated href resolves to a route rule", () => {
    it.each([...sidebarGates, ...headerGates].filter((g) => g.permission))(
      "$href is covered by a route rule — $permission",
      (gate) => {
        const rule = matchRoutePermission(gate.href);
        expect(rule).not.toBeNull();
        expect(rule!.permission).toBeDefined();
      },
    );
  });

  describe("route gate is never stricter than the nav gate", () => {
    // Only leaf items navigate — sidebar parents render as `<a href="#">`
    // menu openers (NavLink discards their href), so only leaf permissions
    // are route gates.
    it.each(
      [...sidebarGates, ...headerGates].filter((g) => g.leaf && g.permission),
    )(
      "$href — nav($permission)",
      (gate) => {
        const rule = matchRoutePermission(gate.href);
        // Open route (e.g. /dashboard) is never stricter.
        if (!rule) {
          expect(gate.permission).toBeUndefined();
          return;
        }

        expect(
          routeNotStricterThanNav(gate.permission, rule.permission),
          `nav ${gate.permission} vs route ${rule.permission}`,
        ).toBe(true);
      },
    );
  });

  describe("route-permissions use known codes", () => {
    it.each(ROUTE_PERMISSIONS.filter((r) => r.permission))(
      "$prefix → $permission is a known code",
      (rule: RoutePermissionRule) => {
        expect(isValidPermission(rule.permission!)).toBe(true);
      },
    );

    it("longest-prefix matching returns the deepest rule for each entry", () => {
      for (const rule of ROUTE_PERMISSIONS) {
        const matched = matchRoutePermission(rule.prefix);
        expect(matched?.prefix).toBe(rule.prefix);
      }
    });
  });
});
