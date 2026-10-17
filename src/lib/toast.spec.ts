import { describe, expect, it } from "vitest";
import { getToastErrorMessage } from "./toast";

describe("shared notification error messages", () => {
  it("preserves backend API rejection objects, including availability errors", () => {
    expect(getToastErrorMessage({ statusCode: 409, message: "No seats are available." }, "Try again")).toBe("No seats are available.");
  });
  it("preserves Error messages from browser operations", () => {
    expect(getToastErrorMessage(new Error("Unable to read the file"), "Try again")).toBe("Unable to read the file");
  });
  it.each([undefined, null, {}, { message: "" }, { message: "   " }, { message: 42 }])("provides a usable fallback for malformed failures (%j)", (error) => {
    expect(getToastErrorMessage(error, "Please try again.")).toBe("Please try again.");
  });
});
