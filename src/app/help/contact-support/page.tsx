import type { Metadata } from "next";
import { SupportContact } from "@/components/support/support-contact";

export const metadata: Metadata = {
  title: "Contact ChurchOS Support",
  description: "Church administrators can contact ChurchOS Support through the in-app live chat.",
  robots: { index: false, follow: true },
};

export default function ContactSupportPage() {
  return <SupportContact />;
}
