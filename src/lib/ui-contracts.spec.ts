import { describe, expect, it } from "vitest";
import { auditUiContracts } from "../../scripts/audit-ui-contracts.mjs";

describe("application UI source contracts", () => {
  it("checks every page, concrete/template link, nav leaf and archive trigger", () => {
    const result = auditUiContracts();
    expect(result.counts.pages).toBeGreaterThan(80);
    // The unified Shadcn sidebar replaces the duplicated horizontal navigation.
    expect(result.counts.navigation).toBeGreaterThanOrEqual(57);
    expect(result.counts.controls).toBeGreaterThan(600);
    expect(result.issues).toEqual([]);
  }, 30_000);
});
