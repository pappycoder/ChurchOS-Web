import { describe, expect, it } from "vitest";
import { isPublicContentPath } from "./public-content-path";

describe("public content navigation boundary", () => {
  it.each(["/accept-invitation", "/accept-invitation/", "/help", "/help/contact-support", "/forms/public/token-a", "/forms/public/token-a/"])(
    "keeps %s public during session restoration",
    (path) => {
      expect(isPublicContentPath(path)).toBe(true);
    },
  );
  it.each([
    "/accept-invitation/other",
    "/forms",
    "/forms/form-a",
    "/forms/form-a/fill",
    "/forms/public",
    "/forms/publicity/token-a",
    "/forms/public/token-a/edit",
    "/admin/users",
  ])("does not exempt %s from authentication", (path) => {
    expect(isPublicContentPath(path)).toBe(false);
  });
});
