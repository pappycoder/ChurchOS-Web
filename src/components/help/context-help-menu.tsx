"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LifeBuoy, MessageCircle } from "lucide-react";
import { useCurrentProfile } from "@/hooks/use-profile";
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
  if (!ready) return null;
  const suggestions = suggestedHelp(
    path,
    (permission) => canAny(permission),
    profile?.role || [],
  );
  const administrator = profile?.role.some(
    (role) => role === "church_admin" || role === "super_admin",
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
          <Link href="/docs">
            <BookOpen className="size-4" />
            Help Centre
          </Link>
        </DropdownMenuItem>
        {administrator && (
          <DropdownMenuItem asChild>
            <Link href="/support">
              <MessageCircle className="size-4" />
              Contact support
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
