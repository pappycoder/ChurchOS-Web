import { describe, it, expect } from "vitest";
import { sermonRecordingDraft, sermonRecordingError } from "./sermon-recording";

describe("sermon recording drafts", () => {
  it("preserves existing file URLs and allows optional recordings", () => {
    expect(sermonRecordingDraft("https://example.org/recording.mp3").url).toBe(
      "https://example.org/recording.mp3",
    );
    expect(
      sermonRecordingError(sermonRecordingDraft(), "audio"),
    ).toBeUndefined();
  });
  it.each([
    "https://podcasts.example/message.mp3",
    "https://vimeo.com/12345",
    "http://localhost:3000/api/backend/media/files/asset-a",
  ])("accepts recording link %s", (url) => {
    expect(
      sermonRecordingError(sermonRecordingDraft(url), "audio"),
    ).toBeUndefined();
  });
  it.each(["javascript:alert(1)", "not a url", "data:text/html,test"])(
    "rejects link %s before uploading other selections",
    (url) => {
      expect(
        sermonRecordingError(sermonRecordingDraft(url), "video"),
      ).toBeTruthy();
    },
  );
  it("rejects a video selected as audio", () => {
    const draft = {
      ...sermonRecordingDraft(),
      file: new File(["video"], "clip.mp4", { type: "video/mp4" }),
    };
    expect(sermonRecordingError(draft, "audio")).toBeTruthy();
    expect(sermonRecordingError(draft, "video")).toBeUndefined();
  });
  it("enforces the upload size boundary without reading file contents", () => {
    const draft = sermonRecordingDraft();
    draft.file = { type: "audio/mpeg", size: 50 * 1024 * 1024 } as File;
    expect(sermonRecordingError(draft, "audio")).toBeUndefined();
    draft.file = { type: "audio/mpeg", size: 50 * 1024 * 1024 + 1 } as File;
    expect(sermonRecordingError(draft, "audio")).toBe(
      "Choose a file no larger than 50 MB.",
    );
  });
});
