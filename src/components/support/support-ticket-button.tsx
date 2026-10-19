import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_TICKET_PATH } from "@/lib/support";

export function SupportTicketButton() {
  return (
    <Button asChild variant="outline">
      <Link href={SUPPORT_TICKET_PATH}>
        <Mail className="size-4" />
        Create support ticket
      </Link>
    </Button>
  );
}
