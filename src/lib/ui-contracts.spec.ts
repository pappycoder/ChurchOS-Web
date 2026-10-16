import { describe, expect, it } from "vitest";
import { auditUiContracts } from "../../scripts/audit-ui-contracts.mjs";

describe("application UI source contracts", () => {
  it("checks every page, concrete/template link, nav leaf and archive trigger", () => {
    const result = auditUiContracts();
    expect(result.counts.pages).toBeGreaterThan(80);
    expect(result.counts.navigation).toBeGreaterThan(60);
    expect(result.counts.controls).toBeGreaterThan(600);
    expect(result.issues).toEqual([]);
  });
});
