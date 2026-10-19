import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_PORTAL_URL, SUPPORT_TICKET_EMAIL } from "@/lib/support";

export default function SupportTicketPage() {
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/support">
            <ArrowLeft className="size-4" />
            Back to contact support
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={SUPPORT_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            Open ticket portal in new tab
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Support ticket</h1>
        <p className="text-sm text-muted-foreground">
          Choose Submit Ticket in the portal below. Our team replies by email; reply to that email
          to continue the same ticket.
        </p>
      </header>
      <iframe
        src={SUPPORT_PORTAL_URL}
        title="ChurchOS Tawk ticket portal"
        className="h-[90svh] min-h-[720px] w-full rounded-xl border bg-white"
        referrerPolicy="no-referrer"
      />
      <p className="text-sm text-muted-foreground">
        Portal not displaying?{" "}
        <a
          className="font-medium text-primary underline underline-offset-4"
          href={SUPPORT_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open it in a new tab
        </a>{" "}
        or email{" "}
        <a
          className="break-all font-medium text-primary underline underline-offset-4"
          href={`mailto:${SUPPORT_TICKET_EMAIL}`}
        >
          {SUPPORT_TICKET_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
