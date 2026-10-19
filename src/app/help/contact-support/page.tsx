import type { Metadata } from "next";
import { SupportContact } from "@/components/support/support-contact";

export const metadata: Metadata = {
  title: "Contact ChurchOS Support",
  description: "Chat with ChurchOS or prepare a support ticket for email follow-up.",
  robots: { index: false, follow: true },
};

export default function ContactSupportPage() {
  return <SupportContact />;
}
