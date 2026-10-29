import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { activeDestination, areaForPath, destinationLeaves, groupWorkspaceNavigation, workspaceAreas } from "./workspace-navigation";

describe("workspace navigation presentation", () => {
  const items = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Members", href: "/members", children: [{ title: "All Members", href: "/members" }, { title: "Families", href: "/members/families" }] },
    { title: "Giving", href: "/giving", children: [{ title: "Records", href: "/giving/records" }] },
  ];
  it("groups only visible destinations, preserving their identities and order", () => {
    const groups = groupWorkspaceNavigation(items);
    expect(groups.map(group => group.id)).toEqual(["home", "people", "giving"]);
    expect(groups[1].items[0]).toBe(items[1]);
    expect(destinationLeaves(groups[2].items)[0].href).toBe("/giving/records");
  });
  it("selects the most specific destination for nested details without prefix collisions", () => {
    expect(activeDestination(items, "/members/families/family-a")?.title).toBe("Families");
    expect(activeDestination(items, "/members/member-a")?.href).toBe("/members");
    expect(activeDestination(items, "/membership")).toBeUndefined();
    expect(areaForPath(groupWorkspaceNavigation(items), "/giving/records/record-a")?.id).toBe("giving");
  });
  it("does not create an area or fallback destination for inaccessible modules", () => {
    expect(groupWorkspaceNavigation([])).toEqual([]);
    expect(areaForPath(groupWorkspaceNavigation(items), "/admin/users")).toBeUndefined();
  });
  it("accounts for every canonical module without silently dropping new destinations", () => {
    const source = ts.createSourceFile("sidebar.tsx", readFileSync(new URL("../components/layouts/sidebar.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const modules: string[] = [];
    const property = (node: ts.ObjectLiteralExpression, name: string) => node.properties.find((item): item is ts.PropertyAssignment => ts.isPropertyAssignment(item) && item.name.getText(source) === name)?.initializer;
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && node.name.getText(source) === "navItems" && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        for (const group of node.initializer.elements) {
          if (!ts.isObjectLiteralExpression(group)) continue;
          const items = property(group, "items");
          if (!items || !ts.isArrayLiteralExpression(items)) continue;
          for (const item of items.elements) {
            if (!ts.isObjectLiteralExpression(item)) continue;
            const title = property(item, "title");
            if (title && ts.isStringLiteral(title)) modules.push(title.text);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    const covered = new Set<string>([...workspaceAreas.flatMap(area => [...area.modules]), "Help Centre", "Contact support"]);
    expect(modules.length).toBeGreaterThan(20);
    expect(modules.filter(title => !covered.has(title))).toEqual([]);
  });
});
