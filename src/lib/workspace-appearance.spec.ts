import { describe, expect, it } from "vitest";
import {
  accentTokens,
  appearanceKey,
  contrast,
  DEFAULT_ACCENT,
  normalizeAccent,
  readAccent,
} from "./workspace-appearance";

describe("workspace appearance", () => {
  it("accepts only complete hex values and normalizes case", () => {
    expect(normalizeAccent("#AB12EF")).toBe("#ab12ef");
    for (const invalid of [
      "red",
      "#abc",
      "#12345678",
      "#12345g",
      "url(test)",
      null,
      12,
    ])
      expect(normalizeAccent(invalid)).toBeNull();
  });
  it("isolates browser preferences by both account and church", () => {
    expect(appearanceKey("p1", "c1")).not.toBe(appearanceKey("p2", "c1"));
    expect(appearanceKey("p1", "c1")).not.toBe(appearanceKey("p1", "c2"));
  });
  it("fails safely on absent, malformed and invalid stored preferences", () => {
    for (const invalid of [null, "bad json", "{}", "null", '{"accent":"red"}'])
      expect(readAccent(invalid)).toBe(DEFAULT_ACCENT);
    expect(readAccent('{"accent":"#AB12EF"}')).toBe("#ab12ef");
  });
  for (const dark of [false, true])
    it(`preserves the chosen base and provides readable text, focus and boundaries, dark=${dark}`, () => {
      for (const accent of [
        "#ffffff",
        "#000000",
        "#ffff00",
        "#00ffff",
        "#777777",
        DEFAULT_ACCENT,
        "#e11d48",
      ]) {
        const tokens = accentTokens(accent, dark);
        const surface = dark ? "#202024" : "#fafafa";
        expect(tokens["--workspace-accent"]).toBe(accent);
        expect(
          contrast(accent, tokens["--workspace-accent-foreground"]),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(surface, tokens["--workspace-accent-readable"]),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(surface, tokens["--workspace-focus"]),
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrast(surface, tokens["--workspace-accent-border"]),
        ).toBeGreaterThanOrEqual(3);
      }
    });
});
