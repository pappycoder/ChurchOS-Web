import type { Metadata } from "next";
import Link from "next/link";
import { HelpSearch } from "@/components/help/help-search";
import { helpSearchIndex } from "@/lib/help/content";
import { Button } from "@/components/ui/button";
import { SUPPORT_CONTACT_PATH } from "@/lib/support";
export const metadata: Metadata = {
  title: "Help Centre",
  description:
    "Practical ChurchOS guides for onboarding, members, attendance, subscriptions and troubleshooting. Open to everyone.",
  alternates: { canonical: "/help" },
};
export default function HelpPage() {
  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary">
          CHURCHOS HELP CENTRE
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          How can we help?
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Find a clear next step, from welcoming your first visitor to managing
          your church workspace. No sign-in needed.
        </p>
      </header>
      <HelpSearch index={helpSearchIndex()} />
      <aside className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-accent/40 p-6 sm:p-8">
        <div className="max-w-xl">
          <h2 className="text-xl font-semibold">Still need a hand?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Every user can chat with ChurchOS Support or prepare an email ticket.
            Your church administrator still manages roles and church settings.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={SUPPORT_CONTACT_PATH}>
            Contact ChurchOS Support
          </Link>
        </Button>
      </aside>
    </div>
  );
}
