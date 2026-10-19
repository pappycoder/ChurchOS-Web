"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Mail, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSupportChat } from "./support-chat-provider";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SUPPORT_NAME,
  SUPPORT_TICKET_EMAIL,
  SUPPORT_TOPICS,
  prepareSupportTicket,
} from "@/lib/support";

function TicketEmailForm() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState<string>(SUPPORT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof prepareSupportTicket> | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const clear = () => {
      setSubject("");
      setTopic(SUPPORT_TOPICS[0]);
      setMessage("");
      setDraft(null);
      setError("");
      setCopied(false);
    };
    window.addEventListener("churchos-session-ended", clear);
    return () => window.removeEventListener("churchos-session-ended", clear);
  }, []);

  function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCopied(false);
    try {
      setDraft(prepareSupportTicket({ subject, topic, message }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please review your ticket details.");
    }
  }
  async function copy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.copyText);
      setCopied(true);
      setError("");
    } catch {
      setError("Copy is unavailable. Select the email details below and copy them manually.");
    }
  }
  function edit() {
    setDraft(null);
    setCopied(false);
    setError("");
  }

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
        Prepare a separate email for each issue. Send it to{" "}
        <a
          href={`mailto:${SUPPORT_TICKET_EMAIL}`}
          className="break-all font-medium text-primary underline underline-offset-4"
        >
          {SUPPORT_TICKET_EMAIL}
        </a>{" "}
        to create a ticket in our support inbox. Replies arrive by email.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        You will review and send the email from your own mail app. Preparing a draft here does not
        send or submit a ticket.
      </p>
      {!draft ? (
        <form onSubmit={prepare} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="support-topic" className="text-sm font-medium">
              Topic
            </label>
            <select
              id="support-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {SUPPORT_TOPICS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="support-subject" className="text-sm font-medium">
              Subject
            </label>
            <Input
              id="support-subject"
              required
              maxLength={100}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="A short description of the issue"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="support-message" className="text-sm font-medium">
              What happened?
            </label>
            <Textarea
              id="support-message"
              required
              minLength={20}
              maxLength={1200}
              rows={7}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              aria-describedby="support-message-hint"
              placeholder="Describe the steps, what you expected and what happened instead."
            />
            <p id="support-message-hint" className="text-xs leading-relaxed text-muted-foreground">
              20–1,200 characters. Include only what is needed to investigate; leave out passwords,
              payment details and confidential member records. Add any suitable screenshots in your
              email app.
            </p>
          </div>
          <Button type="submit">
            Prepare ticket email
            <ArrowRight className="size-4" />
          </Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border bg-accent/30 p-4">
            <h3 className="font-semibold">Your email draft is ready</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Open the draft, choose an email account where you can receive replies, then send it.
              Your ticket is created after Tawk receives the email.
            </p>
          </div>
          <label htmlFor="support-email-preview" className="block text-sm font-medium">
            Email details
          </label>
          <Textarea
            id="support-email-preview"
            readOnly
            value={draft.copyText}
            rows={10}
            className="text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href={draft.mailto}>
                Open email draft
                <Mail className="size-4" />
              </a>
            </Button>
            <Button type="button" variant="outline" onClick={() => void copy()}>
              <Copy className="size-4" />
              Copy ticket details
            </Button>
            <Button type="button" variant="ghost" onClick={edit}>
              Edit ticket
            </Button>
          </div>
          {copied && (
            <p role="status" className="text-sm">
              Ticket details copied. Paste them into a new email and send it to{" "}
              {SUPPORT_TICKET_EMAIL}.
            </p>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">
            No mail app opened? Copy the details into your webmail. Send a new email for a new
            issue, and reply to the ticket email to continue an existing request.
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}

export function SupportContact() {
  const { user, isAuthenticated, isLoading } = useAuth();
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
          Chat with ChurchOS
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
              Chat requires an active workspace account. You can still email a ticket below.
            </p>
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          For a new chat session, open the widget menu and choose “End this chat session”, then
          start another chat. For separate issues requiring follow-up, create separate email
          tickets.
        </p>
      </section>
      <TicketEmailForm key={user?.userId ?? "public"} />
      <aside className="rounded-xl border p-5 text-sm leading-relaxed text-muted-foreground">
        Your church administrator manages role assignments, location access and church settings.
        ChurchOS Support can help investigate product issues; contacting support does not change
        your account permissions.
      </aside>
    </div>
  );
}
