export const SUPPORT_NAME = "ChurchOS Support";
export const SUPPORT_TICKET_EMAIL = "tickets@churchos.p.tawk.email";
export const SUPPORT_CONTACT_PATH = "/help/contact-support";
export const SUPPORT_TICKET_PATH = `${SUPPORT_CONTACT_PATH}#ticket`;

export const SUPPORT_TOPICS = [
  "Account and access",
  "Members and attendance",
  "Plans and payments",
  "Something is not working",
  "Other question",
] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

/** Only information explicitly entered in the form is placed in the email draft. */
export function prepareSupportTicket(input: { subject: string; topic: string; message: string }) {
  const subject = input.subject.replace(/[\r\n\u0000-\u001f\u007f]+/g, " ").trim();
  const message = input.message.trim();
  if (!subject || subject.length > 100) throw new Error("Enter a subject of 1–100 characters.");
  if (!SUPPORT_TOPICS.some((topic) => topic === input.topic))
    throw new Error("Choose a support topic.");
  if (message.length < 20 || message.length > 1200)
    throw new Error("Describe your issue in 20–1,200 characters.");
  const emailSubject = `[${SUPPORT_NAME}] ${subject}`;
  const body = `Topic: ${input.topic}\r\n\r\n${message.replace(/\r?\n/g, "\r\n")}`;
  return {
    subject: emailSubject,
    body,
    mailto: `mailto:${SUPPORT_TICKET_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`,
    copyText: `To: ${SUPPORT_TICKET_EMAIL}\nSubject: ${emailSubject}\n\n${body}`,
  };
}
