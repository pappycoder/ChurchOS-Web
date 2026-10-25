import { describe, it, expect } from "vitest";
import { mediaPlaybackUrl, videoEmbedUrl } from "./media-playback";

describe("recording URLs", () => {
  it.each([
    "http://localhost:3000/api/backend/media/files/asset-a",
    "https://old-api.example/api/v1/media/files/asset-a",
    "/api/backend/media/files/asset-a",
  ])("opens managed file %s through the current session", value => {
    expect(mediaPlaybackUrl(value)).toBe("/api/backend/media/files/asset-a");
  });
  it("preserves external recordings and their signed parameters", () => {
    const url = "https://storage.example/recording.mp3?token=signed";
    expect(mediaPlaybackUrl(url)).toBe(url);
  });
  it.each(["javascript:alert(1)", "data:text/html,test", "file:///secret", "not a link"])("rejects unsafe or malformed URL %s", value => {
    expect(mediaPlaybackUrl(value)).toBeUndefined();
    expect(videoEmbedUrl(value)).toBeUndefined();
  });
  it.each([
    ["https://youtu.be/recording-a", "https://www.youtube-nocookie.com/embed/recording-a"],
    ["https://www.youtube.com/watch?v=recording-a", "https://www.youtube-nocookie.com/embed/recording-a"],
    ["https://youtube.com/shorts/recording-a", "https://www.youtube-nocookie.com/embed/recording-a"],
    ["https://vimeo.com/12345", "https://player.vimeo.com/video/12345"],
  ])("embeds the supported video link %s", (value, expected) => expect(videoEmbedUrl(value)).toBe(expected));
  it("does not embed lookalike hosts or direct files", () => {
    expect(videoEmbedUrl("https://fake-youtube.com/watch?v=recording-a")).toBeUndefined();
    expect(videoEmbedUrl("https://storage.example/recording.mp4")).toBeUndefined();
  });
});
