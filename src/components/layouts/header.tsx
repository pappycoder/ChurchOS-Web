"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Search } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ColorModeToggle } from "@/components/shared/color-mode-toggle";
// Temporarily hidden until offline workspace returns in a future build.
// import { OfflineHeaderButton } from "@/components/offline/offline-entry";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { usePermissions } from "@/hooks/use-permissions";
import { useEmailUnread } from "@/hooks/use-email";
import { useVisibleNavigation, navigationLeaves } from "./sidebar";
import { ContextHelpMenu } from "@/components/help/context-help-menu";
import { AskChurchOS } from "@/components/assistant/ask-churchos";
import { AccountMenu } from "./account-menu";

export function Header() {
  const { isMobile, openMobile, open } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const groups = useVisibleNavigation();
  const { ready, can } = usePermissions();
  const canViewInbox = ready && can("emails", "read");
  const { data: unread } = useEmailUnread(canViewInbox);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); setSearchOpen((open) => !open); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <header className="sticky top-0 z-30 flex min-h-20 shrink-0 flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-4 backdrop-blur-sm md:gap-4 md:px-6">
    <SidebarTrigger variant="outline" aria-expanded={isMobile ? openMobile : open} /><Separator orientation="vertical" className="!h-6" />
    <Button variant="outline" className="h-10 min-w-0 flex-1 justify-start sm:flex-none rounded-xl bg-muted/40 text-muted-foreground lg:w-64" onClick={() => setSearchOpen(true)} aria-label="Search navigation">
      <Search className="size-4" /><span>Search navigation...</span><kbd className="ms-auto hidden rounded border px-1.5 font-mono text-[10px] lg:inline-flex">Ctrl K</kbd>
    </Button>
    <div className="ms-auto flex min-w-0 flex-1 basis-full flex-wrap sm:basis-auto items-center justify-end gap-1.5 sm:gap-2">
      <AskChurchOS /><ContextHelpMenu />{/* <OfflineHeaderButton /> */}
      {canViewInbox && <Button variant="ghost" size="icon" asChild tooltip="Inbox"><Link href="/communication/inbox" className="relative"><Mail className="size-4" />{(unread?.count ?? 0) > 0 && <span className="absolute end-0 top-0 rounded-full bg-destructive px-1 text-[10px] text-white">{unread!.count > 99 ? "99+" : unread!.count}</span>}</Link></Button>}
      <NotificationBell compact /><ColorModeToggle /><AccountMenu />
    </div>
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search navigation" description="Find pages in your ChurchOS workspace.">
      <CommandInput placeholder="Search pages..." /><CommandList><CommandEmpty>No accessible pages found.</CommandEmpty>
        {groups.map((group) => <CommandGroup heading={group.section} key={group.section}>
          {navigationLeaves(group.items).map((item) => <CommandItem key={item.href} value={`${item.title} ${item.href}`} onSelect={() => { setSearchOpen(false); router.push(item.href!); }}>{item.icon && <item.icon className="size-4" />}<span>{item.title}</span><span className="ms-auto text-xs text-muted-foreground">{item.href}</span></CommandItem>)}
        </CommandGroup>)}
      </CommandList>
    </CommandDialog>
  </header>;
}
