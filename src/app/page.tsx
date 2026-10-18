import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: { absolute: "ChurchOS — A little less admin. A lot more ministry." },
  description:
    "Bring people, attendance, giving and every branch together with ChurchOS. Explore church management plans from ₦10,000 monthly, with savings on every yearly plan.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ChurchOS — Make room for more ministry",
    description:
      "One thoughtful platform for people, services, giving and every branch. Explore affordable launch plans for your church.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ChurchOS church management platform",
      },
    ],
  },
};

export default function Home() {
  return <LandingPage />;
}
