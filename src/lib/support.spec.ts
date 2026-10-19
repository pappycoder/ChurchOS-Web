import { describe, expect, it } from "vitest";
import { prepareSupportTicket, SUPPORT_TICKET_EMAIL, SUPPORT_TOPICS } from "./support";

describe("support ticket email drafts", () => {
  const input = {
    subject: "Attendance did not save",
    topic: SUPPORT_TOPICS[1],
    message: "I saved the attendance form but the total still shows zero.",
  };

  it("addresses the supplied ticket inbox and preserves user-entered Unicode and punctuation", () => {
    const draft = prepareSupportTicket({
      ...input,
      subject: "Help & attendance?",
      message: input.message + " Please check 🙏\nThanks.",
    });
    const url = new URL(draft.mailto);
    expect(url.pathname).toBe(SUPPORT_TICKET_EMAIL);
    expect(url.searchParams.get("subject")).toBe("[ChurchOS Support] Help & attendance?");
    expect(url.searchParams.get("body")).toContain("Please check 🙏\r\nThanks.");
    expect([...url.searchParams.keys()]).toEqual(["subject", "body"]);
  });

  it("does not let subject/body text inject additional mail recipients or headers", () => {
    const draft = prepareSupportTicket({
      ...input,
      subject: "Help\r\nBcc: other@example.test",
      message: input.message + " &bcc=other@example.test",
    });
    const url = new URL(draft.mailto);
    expect(url.searchParams.get("bcc")).toBeNull();
    expect(url.searchParams.get("subject")).not.toMatch(/[\r\n]/);
    expect(url.pathname).toBe(SUPPORT_TICKET_EMAIL);
  });

  it.each([
    { subject: " " },
    { subject: "a".repeat(101) },
    { topic: "unknown" },
    { message: "too short" },
    { message: "a".repeat(1201) },
  ])("rejects invalid draft data: %j", (change) => {
    expect(() => prepareSupportTicket({ ...input, ...change })).toThrow();
  });

  it("provides a complete plain-text fallback without adding any app identity or records", () => {
    const draft = prepareSupportTicket(input);
    expect(draft.copyText).toContain(`To: ${SUPPORT_TICKET_EMAIL}`);
    expect(draft.copyText).toContain(input.message);
    expect(draft.body).toBe(`Topic: ${input.topic}\r\n\r\n${input.message}`);
  });
});
