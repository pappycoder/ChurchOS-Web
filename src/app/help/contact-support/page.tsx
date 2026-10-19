import type { Metadata } from "next";
import { SupportContact } from "@/components/support/support-contact";

export const metadata: Metadata = {
  title: "Contact ChurchOS Support",
  description: "Contact ChurchOS Support or submit a ticket for email follow-up.",
  robots: { index: false, follow: true },
};

export default function ContactSupportPage() {
  return <SupportContact />;
}
