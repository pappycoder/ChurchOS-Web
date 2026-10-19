"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { SUPPORT_TICKET_PATH } from "@/lib/support";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useSupportChat } from "@/components/support/support-chat-provider";
import { usePermissions } from "@/hooks/use-permissions";
import { suggestedHelp } from "@/lib/help/recommendations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
export function ContextHelpMenu() {
  const path = usePathname();
  const { data: profile } = useCurrentProfile();
  const { ready, canAny } = usePermissions();
  const { available: supportAvailable, openChat } = useSupportChat();
  if (!ready) return null;
  const suggestions = suggestedHelp(
    path,
    (permission) => canAny(permission),
    profile?.role || [],
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Help for this page"
          disableTooltip
        >
          <LifeBuoy className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuLabel>Help for this page</DropdownMenuLabel>
        {suggestions.map((article) => (
          <DropdownMenuItem asChild key={article.slug}>
            <Link href={`/help/${article.slug}`} className="items-start">
              <BookOpen className="mt-0.5 size-4 shrink-0" />
              <span className="whitespace-normal">{article.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/help">
            <BookOpen className="size-4" />
            Help Centre
          </Link>
        </DropdownMenuItem>
        {supportAvailable && (
          <DropdownMenuItem onSelect={openChat}>
              <MessageCircle className="size-4" />
              Contact support
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild><Link href={SUPPORT_TICKET_PATH}><Mail className="size-4" />Create support ticket</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
