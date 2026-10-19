import { describe, expect, it } from "vitest";
import { helpArticles, helpTopics } from "./catalog";
import { helpContent, helpSearchIndex } from "./content";
import { searchHelpArticles } from "./search";
import { legacyHelpSections, suggestedHelp } from "./recommendations";
import { isPublicHelpPath } from "./paths";

describe("public Help Centre content", () => {
  it("has a complete, navigable article library", () => {
    expect(helpArticles).toHaveLength(20);
    expect(new Set(helpArticles.map((article) => article.slug)).size).toBe(
      helpArticles.length,
    );
    for (const article of helpArticles) {
      expect(helpTopics.some((topic) => topic.id === article.topic)).toBe(true);
      expect(article.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      const sections = helpContent[article.slug];
      expect(sections.length).toBeGreaterThanOrEqual(3);
      expect(new Set(sections.map((section) => section.id)).size).toBe(
        sections.length,
      );
      for (const section of sections)
        expect(
          [
            ...(section.paragraphs || []),
            ...(section.steps || []),
            ...(section.bullets || []),
          ].join(" ").length,
        ).toBeGreaterThan(60);
    }
    for (const slug of Object.values(legacyHelpSections))
      expect(helpArticles.some((article) => article.slug === slug)).toBe(true);
  });
  it("keeps public help paths distinct from authenticated routes", () => {
    expect(isPublicHelpPath("/help")).toBe(true);
    expect(isPublicHelpPath("/help/import-members")).toBe(true);
    for (const path of ["/help-other", "/docs", "/support", "/admin/help"])
      expect(isPublicHelpPath(path)).toBe(false);
  });
});
describe("help search", () => {
  const index = helpSearchIndex();
  it("finds tasks using natural phrasing, punctuation and case", () => {
    expect(
      searchHelpArticles(index, "How do I IMPORT my members?")[0].slug,
    ).toBe("import-members");
    expect(searchHelpArticles(index, "CSV spreadsheet")[0].slug).toBe(
      "import-members",
    );
    expect(searchHelpArticles(index, "donation receipt")[0].slug).toBe(
      "record-giving-and-receipts",
    );
    expect(searchHelpArticles(index, "2FA")[0].slug).toBe(
      "sign-in-and-account-recovery",
    );
  });
  it("searches article bodies as well as titles and keywords", () => {
    expect(
      searchHelpArticles(index, "reinstall").map((article) => article.slug),
    ).toContain("offline-work-and-reconnection");
  });
  it("combines topic and search and handles empty or unmatched input", () => {
    expect(searchHelpArticles(index, "CSV", "billing")).toEqual([]);
    expect(searchHelpArticles(index, "", "attendance")).toHaveLength(2);
    expect(searchHelpArticles(index, "")).toHaveLength(20);
    expect(searchHelpArticles(index, "nonexistent-zebra-article")).toEqual([]);
  });
});
describe("workspace help recommendations", () => {
  it("offers attendance help to ushers without administrative billing suggestions", () => {
    const permissions = new Set([
      "attendance:checkin:create",
      "attendance:services:read",
    ]);
    const result = suggestedHelp(
      "/attendance/check-in",
      (permission) => permissions.has(permission),
      ["usher"],
    );
    expect(result[0].slug).toBe("check-in-attendees");
    expect(
      result.some((article) => "adminOnly" in article && article.adminOnly),
    ).toBe(false);
  });
  it("does not treat a copied billing permission or HQ scope as administrator status", () => {
    const result = suggestedHelp("/subscription", () => true, [
      "custom_finance",
    ]);
    expect(
      result.some((article) => "adminOnly" in article && article.adminOnly),
    ).toBe(false);
    expect(
      suggestedHelp("/subscription", () => true, ["church_admin"])[0].slug,
    ).toBe("plans-and-allowances");
  });
  it("does not recommend unavailable import actions but keeps common guidance reachable", () => {
    const result = suggestedHelp("/members/import", () => false, ["usher"]);
    expect(result.some((article) => article.slug === "import-members")).toBe(
      false,
    );
    expect(result).toHaveLength(3);
    expect(new Set(result.map((article) => article.slug)).size).toBe(
      result.length,
    );
  });
});
