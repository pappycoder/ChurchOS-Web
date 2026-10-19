"use client";

import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSupportChat } from "./support-chat-provider";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import {
  SUPPORT_NAME,
  SUPPORT_TICKET_EMAIL,
  SUPPORT_TICKET_PATH,
  SUPPORT_PORTAL_URL,
} from "@/lib/support";

function TicketFormLink({ signedIn }: { signedIn: boolean }) {
  return (
    <section
      id="ticket"
      aria-labelledby="ticket-title"
      className="scroll-mt-6 rounded-2xl border bg-card p-5 sm:p-7"
    >
      <h2 id="ticket-title" className="flex items-center gap-2 text-xl font-semibold">
        <Mail className="size-5 text-primary" />
        Create a support ticket
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Choose Submit Ticket in the ticket portal. Enter your name, a reply email, subject and
        description. Use a separate ticket for each issue.
      </p>
      <div className="mt-5">
        <Button asChild>
          <Link href={signedIn ? SUPPORT_TICKET_PATH : SUPPORT_PORTAL_URL}>
            Create support ticket
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Tawk.to handles your submission. Our team replies by email; reply to that email to continue
        the same ticket. Your support team manages ticket progress in Tawk.to.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Prefer email? Send your request to{" "}
        <a
          href={`mailto:${SUPPORT_TICKET_EMAIL}`}
          className="break-all font-medium text-primary underline underline-offset-4"
        >
          {SUPPORT_TICKET_EMAIL}
        </a>
        .
      </p>
    </section>
  );
}

export function SupportContact() {
  const { isAuthenticated, isLoading } = useAuth();
  const { available, openChat } = useSupportChat();
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <BrandLogo variant="mark" emblemClassName="!size-10" />
        <p className="text-xs font-semibold tracking-widest text-primary">HERE TO HELP</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Contact {SUPPORT_NAME}
        </h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          Get help with ChurchOS, report a problem or follow up by email. Every user can contact our
          support team.
        </p>
      </header>
      <section aria-labelledby="chat-title" className="rounded-2xl border bg-accent/30 p-5 sm:p-7">
        <h2 id="chat-title" className="flex items-center gap-2 text-xl font-semibold">
          <MessageCircle className="size-5 text-primary" />
          Administrator live chat
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Use the floating chat bubble for a quick question. If the team is offline, leave a message
          and a reply email in the widget.
        </p>
        <div className="mt-4">
          {available ? (
            <Button variant="outline" onClick={openChat}>
              Open support chat
            </Button>
          ) : isLoading ? (
            <p role="status" className="text-sm text-muted-foreground">
              Checking chat availability…
            </p>
          ) : !isAuthenticated ? (
            <Button asChild variant="outline">
              <Link href="/login?returnTo=%2Fhelp%2Fcontact-support">Sign in to chat</Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Live chat is available to active church administrators. Every user can create a
              support ticket.
            </p>
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          For a new chat session, open the widget menu and choose “End this chat session”, then
          start another chat. For separate issues requiring follow-up, create separate support
          tickets.
        </p>
      </section>
      <TicketFormLink signedIn={isAuthenticated} />
      <aside className="rounded-xl border p-5 text-sm leading-relaxed text-muted-foreground">
        Your church administrator manages role assignments, location access and church settings.
        ChurchOS Support can help investigate product issues; contacting support does not change
        your account permissions.
      </aside>
    </div>
  );
}
