"use client";

import { planAllowsPath } from "@/lib/plan-features";
import { filterPermissionNavigation } from "@/lib/permission-navigation";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";


import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePrefetchRoute } from "@/lib/prefetch";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarClock,
  HandCoins,
  Calendar,
  Film,
  Heart,
  Settings,
  Plug,
  UserCog,
  MessageSquare,
  Mail,
  BookOpen,
  Upload,
  FolderOpen,
  ClipboardList,
  Building2,
  Package,
  Wrench,
  Handshake,
  FileBarChart,
  Megaphone,
  UserPlus,
  GitBranch,
  BellRing,
  Webhook,
  SlidersHorizontal,
  BarChart3,
  ClipboardCheck,
  Ticket,
  Repeat,
  HeartHandshake,
  AlertTriangle,
  Activity,
  Download,
  FileText,
  UsersRound,
  Eye,
} from "lucide-react";


import { ChevronRight, X } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { SidebarContent, SidebarFooter, SidebarHeader,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AccountMenu } from "./account-menu";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "danger" | "info" | "success" | "warning" | "primary";
  children?: NavItem[];
  /** Required `resource:action` permission, e.g. "members:read". */
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
}

const navItems: { section: string; items: NavItem[] }[] = [
  {
    section: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Members",
        href: "/members",
        icon: Users,
        permission: "members:all:read",
        children: [
          {
            title: "All Members",
            href: "/members",
            permission: "members:all:read",
          },
          {
            title: "Add Member",
            href: "/members/new",
            permission: "members:new:create",
          },
          {
            title: "Import Members",
            href: "/members/import",
            permission: "members:import:create",
          },
          {
            title: "Families",
            href: "/members/families",
            permission: "families:read",
          },
        ],
      },
      {
        title: "Attendance",
        href: "/attendance",
        icon: CalendarCheck,
        children: [
          {
            title: "Dashboard",
            href: "/attendance",
            permission: "attendance:dashboard:read",
          },
          {
            title: "Services",
            href: "/attendance/services",
            permission: "attendance:services:read",
          },
          {
            title: "Check-In",
            href: "/attendance/check-in",
            permission: "attendance:checkin:create",
          },
          {
            title: "Records",
            href: "/attendance/records",
            permission: "attendance:records:read",
          },
          {
            title: "Reports",
            href: "/attendance/reports",
            permission: "attendance:reports:read",
          },
        ],
      },
      {
        title: "Giving",
        href: "/giving",
        icon: HandCoins,
        children: [
          { title: "Dashboard", href: "/giving", permission: "giving:dashboard:read" },
          {
            title: "Categories",
            href: "/giving/categories",
            permission: "giving:categories:read",
          },
          {
            title: "Records",
            href: "/giving/records",
            permission: "giving:records:read",
          },
          {
            title: "Reports",
            href: "/giving/reports",
            permission: "giving:reports:read",
          },
          {
            title: "Recurring Giving",
            href: "/giving/recurring",
            permission: "giving:recurring:read",
          },
        ],
      },
      {
        title: "Events",
        href: "/events",
        icon: Calendar,
        permission: "events:calendar:read",
        children: [
          { title: "Calendar", href: "/events", permission: "events:calendar:read" },
          {
            title: "All Events",
            href: "/events/list",
            permission: "events:all:read",
          },
          {
            title: "Check-In",
            href: "/events/check-in",
            permission: "events:checkin:create",
          },
          {
            title: "Registrations",
            href: "/events/registrations",
            permission: "events:registrations:read",
          },
          {
            title: "Tickets",
            href: "/events/management",
            permission: "events:tickets:read",
          },
        ],
      },
      {
        title: "Sermons",
        href: "/sermons",
        icon: BookOpen,
        permission: "sermons:read",
        children: [
          {
            title: "All Sermons",
            href: "/sermons",
            permission: "sermons:list:read",
          },
          {
            title: "Add Sermon",
            href: "/sermons/new",
            permission: "sermons:new:create",
          },
          {
            title: "Series",
            href: "/sermons/series",
            permission: "sermons:series:read",
          },
          {
            title: "Speakers",
            href: "/sermons/speakers",
            permission: "sermons:speakers:read",
          },
        ],
      },
      {
        title: "Media",
        href: "/media",
        icon: Film,
        permission: "media:read",
        children: [
          { title: "Library", href: "/media", permission: "media:library:read" },
          {
            title: "Upload",
            href: "/media/upload",
            permission: "media:upload:create",
          },
          {
            title: "Folders",
            href: "/media/folders",
            permission: "media:folders:read",
          },
        ],
      },
      {
        title: "Pastoral Care",
        href: "/pastoral",
        icon: HeartHandshake,
        permission: "pastoral:read",
        children: [
          { title: "Notes", href: "/pastoral", permission: "pastoral:notes:read" },
          {
            title: "Life Events",
            href: "/pastoral/life-events",
            permission: "pastoral:life-events:read",
          },
          {
            title: "Risk Scores",
            href: "/pastoral/risk-scores",
            permission: "pastoral:risk-scores:read",
          },
          {
            title: "Engagement",
            href: "/pastoral/engagement",
            permission: "pastoral:engagement:read",
          },
        ],
      },
      {
        title: "Visitors",
        href: "/visitors",
        icon: UserPlus,
        permission: "visitors:read",
        children: [
          {
            title: "All Visitors",
            href: "/visitors",
            permission: "visitors:list:read",
          },
          {
            title: "Add Visitor",
            href: "/visitors/new",
            permission: "visitors:new:create",
          },
          {
            title: "Import Visitors",
            href: "/visitors/import",
            permission: "visitors:new:create",
          },
          {
            title: "Follow-Up",
            href: "/visitors/follow-up",
            permission: "visitors:list:read",
          },
        ],
      },
    ],
  },
  {
    section: "COMMUNICATION",
    items: [
      {
        title: "Templates",
        href: "/communication/templates",
        icon: FileText,
        permission: "templates:read",
      },
      {
        title: "Broadcasts",
        href: "/communication/broadcasts",
        icon: Megaphone,
        permission: "broadcasts:read",
      },
      {
        title: "Messages",
        href: "/communication/messages",
        icon: MessageSquare,
        permission: "whatsapp:read",
      },
      {
        title: "Inbox",
        href: "/communication/inbox",
        icon: Mail,
        permission: "emails:read",
      },
      {
        title: "Appointments",
        href: "/appointments",
        icon: CalendarClock,
        permission: "appointments:read",
      },
    ],
  },
  {
    section: "OPERATIONS",
    items: [
      {
        title: "Departments",
        href: "/departments",
        icon: Building2,
        children: [
          {
            title: "All Departments",
            href: "/departments",
            permission: "departments:read",
          },
          {
            title: "Cell Groups",
            href: "/departments/cell-groups",
            permission: "cell_groups:read",
          },
        ],
      },
      {
        title: "Assets",
        href: "/assets",
        icon: Package,
        permission: "assets:read",
        children: [
          { title: "All Assets", href: "/assets", permission: "assets:list:read" },
          {
            title: "Categories",
            href: "/assets/categories",
            permission: "assets:categories:read",
          },
          {
            title: "Maintenance",
            href: "/assets/maintenance",
            permission: "assets:maintenance:read",
          },
          { title: "Loans", href: "/assets/loans", permission: "assets:loans:read" },
        ],
      },
      {
        title: "Forms",
        href: "/forms",
        icon: ClipboardList,
        permission: "forms:read",
        children: [
          { title: "All Forms", href: "/forms", permission: "forms:list:read" },
          {
            title: "Submissions",
            href: "/forms/submissions",
            permission: "forms:submissions:read",
          },
        ],
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileBarChart,
        permission: "reports:view",
        anyOf: ["reports:financial:read", "reports:attendance:read", "reports:members:read"],
        children: [
          {
            title: "Generate Report",
            href: "/reports",
            permission: "reports:view",
            anyOf: ["reports:financial:read", "reports:attendance:read", "reports:members:read"],
          },
        ],
      },
    ],
  },
  {
    section: "ADMINISTRATION",
    items: [
      {
        title: "User Management",
        href: "/admin/users",
        icon: UserCog,
        permission: "users:read", allOf: ["profiles:read"],
        children: [
          { title: "Users", href: "/admin/users", permission: "users:read", allOf: ["profiles:read"] },
          {
            title: "Roles & Permissions",
            href: "/admin/roles",
            permission: "roles:read",
          },
        ],
      },
      {
        title: "Church Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: "church_settings:update",
      },
      {
        title: "Integrations",
        href: "/admin/integrations",
        icon: Plug,
        permission: "integrations:read",
      },
      {
        title: "Branches",
        href: "/admin/branches",
        icon: Building2,
        permission: "branches:directory:read",
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        children: [
          {
            title: "Overview",
            href: "/analytics",
            permission: "analytics:dashboard:read",
          },
          {
            title: "Giving",
            href: "/analytics/giving",
            permission: "analytics:giving:read",
          },
          {
            title: "Attendance",
            href: "/analytics/attendance",
            permission: "analytics:attendance:read",
          },
          {
            title: "Members",
            href: "/analytics/members",
            permission: "analytics:members:read",
          },
        ],
      },
    ],
  },
  {
    section: "SUPPORT",
    items: [
      {
        title: "Help Centre",
        href: "/help",
        icon: BookOpen,
      },
      { title: "Contact support", href: "/support", icon: Mail },
    ],
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Members: Users,
  Attendance: CalendarCheck,
  Giving: HandCoins,
  Events: Calendar,
  Media: Film,
  "Pastoral Care": HeartHandshake,
  "User Management": UserCog,
  Settings: Settings,
  Sermons: BookOpen,
  Visitors: UserPlus,
  Templates: FileText,
  Broadcasts: Megaphone,
  Messages: MessageSquare,
  Departments: Building2,
  Assets: Package,
  Forms: ClipboardList,
  Reports: FileBarChart,
  "Church Settings": Settings,
  Integrations: Plug,
  Analytics: BarChart3,
  Families: Users,
  Services: CalendarCheck,
  "Check-In": ClipboardCheck,
  Records: FileBarChart,
  Categories: SlidersHorizontal,
  "Recurring Giving": Repeat,
  Calendar: Calendar,
  Tickets: Ticket,
  Registrations: Ticket,
  Series: BookOpen,
  Speakers: Users,
  Library: Film,
  Upload: Upload,
  Folders: FolderOpen,
  Notes: HeartHandshake,
  "Life Events": Heart,
  "Risk Scores": AlertTriangle,
  Engagement: Activity,
  "Follow-Up": UserPlus,
  "All Members": Users,
  "Add Member": UserPlus,
  "Import Members": Download,
  "Import Visitors": Download,
  "All Events": Calendar,
  "All Sermons": BookOpen,
  "Add Sermon": BookOpen,
  "All Visitors": UserPlus,
  "Add Visitor": UserPlus,
  "All Departments": Building2,
  "Cell Groups": UsersRound,
  "All Assets": Package,
  Maintenance: Wrench,
  Loans: Handshake,
  "All Forms": ClipboardList,
  Submissions: Eye,
  Financial: FileBarChart,
  Users: UserCog,
  "Roles & Permissions": SlidersHorizontal,
  General: Settings,
  Branches: GitBranch,
  Notifications: BellRing,
  Webhooks: Webhook,
  "Custom Fields": SlidersHorizontal,
  Overview: BarChart3,
};


export function useVisibleNavigation() {
  const { ready, canAny } = usePermissions();
  const { data: profile } = useCurrentProfile();
  return React.useMemo(() => !ready || !profile ? [] : navItems.map((group) => ({
    ...group, items: filterPermissionNavigation(group.items, canAny, path => planAllowsPath(profile.planFeatures, path)),
  })).filter((group) => group.items.length > 0), [ready, canAny, profile]);
}

export function navigationLeaves(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => item.children?.length ? navigationLeaves(item.children) : [item]);
}

function NavigationItem({ item, activeHref }: { item: NavItem; activeHref?: string }) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const prefetch = usePrefetchRoute();
  const children = item.children ?? [];
  const Icon = item.icon ?? ICON_MAP[item.title];
  const active = children.length ? navigationLeaves(children).some((child) => child.href === activeHref) : item.href === activeHref;
  const [open, setOpen] = React.useState(active);
  React.useEffect(() => { if (active) setOpen(true); }, [pathname, active]);
  const content = <>{Icon && <Icon className="size-4" />}<span>{item.title}</span>{item.badge && <span className="ms-auto rounded-full bg-secondary px-1.5 text-xs">{item.badge}</span>}</>;
  if (!children.length) return <SidebarMenuItem>
    <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="h-10 rounded-xl px-3">
      <Link href={item.href!} aria-current={active ? "page" : undefined} onClick={() => setOpenMobile(false)} onMouseEnter={() => prefetch(item.href)} onFocus={() => prefetch(item.href)}>{content}</Link>
    </SidebarMenuButton>
  </SidebarMenuItem>;
  if (state === "collapsed" && !isMobile) return <SidebarMenuItem>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><SidebarMenuButton tooltip={item.title} isActive={active} className="h-10 rounded-xl px-3">{content}<ChevronRight className="ms-auto size-4" /></SidebarMenuButton></DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={8}>
        <DropdownMenuLabel>{item.title}</DropdownMenuLabel><DropdownMenuSeparator />
        {navigationLeaves(children).map((child) => <DropdownMenuItem key={child.href} asChild>
          <Link href={child.href!} aria-current={child.href === activeHref ? "page" : undefined} className={cn(child.href === activeHref && "bg-accent")} onClick={() => setOpenMobile(false)}>{child.title}</Link>
        </DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  </SidebarMenuItem>;
  return <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
    <SidebarMenuItem>
      <CollapsibleTrigger asChild><SidebarMenuButton tooltip={item.title} isActive={active} className="h-10 rounded-xl px-3">{content}<ChevronRight className="ms-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" /></SidebarMenuButton></CollapsibleTrigger>
      <CollapsibleContent className="CollapsibleContent"><SidebarMenuSub>
        {children.map((child) => child.children?.length ? <NavigationItem key={child.title} item={child} activeHref={activeHref} /> : <SidebarMenuSubItem key={child.title + child.href}>
          <SidebarMenuSubButton asChild isActive={child.href === activeHref}>
            <Link href={child.href!} aria-current={child.href === activeHref ? "page" : undefined} onClick={() => setOpenMobile(false)} onMouseEnter={() => prefetch(child.href)} onFocus={() => prefetch(child.href)}><span>{child.title}</span></Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>)}
      </SidebarMenuSub></CollapsibleContent>
    </SidebarMenuItem>
  </Collapsible>;
}

const SECTION_PRESENTATION: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  "MAIN MENU": { label: "General", icon: LayoutDashboard },
  COMMUNICATION: { label: "Communication", icon: MessageSquare },
  OPERATIONS: { label: "Operations", icon: Building2 },
  ADMINISTRATION: { label: "Administration", icon: Settings },
  SUPPORT: { label: "Support", icon: BookOpen },
};

export function Sidebar() {
  const pathname = usePathname();
  const groups = useVisibleNavigation();
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();
  const { data: profile } = useCurrentProfile();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const [selection, setSelection] = React.useState({ pathname: "", section: "MAIN MENU" });
  React.useEffect(() => { setOpenMobile(false); }, [pathname, setOpenMobile]);
  React.useEffect(() => { if (!isMobile) setOpenMobile(false); }, [isMobile, setOpenMobile]);
  const activeHref = navigationLeaves(groups.flatMap((group) => group.items))
    .map((item) => item.href).filter((href): href is string => !!href && (pathname === href || pathname.startsWith(href + "/")))
    .sort((a, b) => b.length - a.length)[0];
  const routeGroup = groups.find((group) => navigationLeaves(group.items).some((item) => item.href === activeHref));
  // A route change selects its owning section; browsing rail sections never navigates.
  const selectedSection = selection.pathname !== pathname && routeGroup ? routeGroup.section : selection.section;
  const selectedGroup = groups.find((group) => group.section === selectedSection) ?? routeGroup ?? groups[0];
  React.useEffect(() => {
    if (selectedGroup && (selection.pathname !== pathname || selection.section !== selectedGroup.section)) {
      setSelection({ pathname, section: selectedGroup.section });
    }
  }, [pathname, selectedGroup, selection]);

  const navigation = <div data-sidebar="sidebar" className="flex h-full min-h-0 w-full bg-sidebar text-sidebar-foreground">
    <nav aria-label="Workspace sections" className="flex w-[72px] shrink-0 flex-col items-center gap-6 border-e border-sidebar-border py-5">
      <Link href="/dashboard" aria-label="ChurchOS dashboard" onClick={() => setOpenMobile(false)} className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sidebar-ring">
        <BrandLogo variant="mark" emblemClassName="size-8" />
      </Link>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3">
        {groups.map((group) => {
          const { label, icon: Icon } = SECTION_PRESENTATION[group.section];
          const selected = selectedGroup?.section === group.section;
          const button = <button key={group.section} type="button" aria-label={label} aria-pressed={selected} aria-expanded={selected && (isMobile || open)} aria-controls="workspace-menu" onClick={() => { setSelection({ pathname, section: group.section }); setOpen(true); }} className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring", selected ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <Icon className="size-5" />
            </button>;
          return isMobile ? button : <ActionTooltip key={group.section} label={label} side="right">{button}</ActionTooltip>;
        })}
      </div>
    </nav>
    <div id="workspace-menu" hidden={!isMobile && !open} className={cn("min-w-0 flex-1 flex-col", !isMobile && !open ? "hidden" : "flex")}>
      <SidebarHeader className="gap-4 border-b border-sidebar-border px-5 py-5">
        <div className="flex min-w-0 items-start gap-2">
          <Link href="/dashboard" onClick={() => setOpenMobile(false)} className="min-w-0 flex-1 rounded-md focus-visible:outline-2 focus-visible:outline-sidebar-ring">
            <p className="truncate text-base font-semibold">{profile?.church?.name || "ChurchOS"}</p>
            <p className="mt-1 truncate text-xs text-sidebar-foreground/65">{profile?.isAdminHq ? "Headquarters workspace" : profile?.branch?.name || "Church workspace"}</p>
          </Link>
          {isMobile && <Button ref={closeButtonRef} disableTooltip variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setOpenMobile(false)} className="size-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><X className="size-4" /></Button>}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4"><nav id="sidebar-menu" aria-label="Workspace">
        {selectedGroup && <SidebarGroup>
          <SidebarGroupLabel className="mb-3 text-[11px] font-semibold uppercase tracking-widest">{SECTION_PRESENTATION[selectedGroup.section].label}</SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">{selectedGroup.items.map((item) => <NavigationItem key={item.title} item={item} activeHref={activeHref} />)}</SidebarMenu>
        </SidebarGroup>}
      </nav></SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3"><AccountMenu placement="sidebar" /></SidebarFooter>
    </div>
  </div>;

  if (isMobile) return <Sheet open={openMobile} onOpenChange={setOpenMobile}>
    <SheetContent side="left" showCloseButton={false} className="w-[min(320px,100vw)] gap-0 overflow-hidden border-sidebar-border bg-sidebar p-0 text-sidebar-foreground" onOpenAutoFocus={(event) => { event.preventDefault(); closeButtonRef.current?.focus(); }} onCloseAutoFocus={(event) => { event.preventDefault(); document.querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')?.focus(); }}>
      <SheetTitle className="sr-only">Main navigation</SheetTitle>
      <SheetDescription className="sr-only">Select a workspace section and page.</SheetDescription>
      {navigation}
    </SheetContent>
  </Sheet>;

  return <div className="hidden shrink-0 min-[1200px]:block" style={{ width: open ? 320 : 72 }}>
    <aside aria-label="Main navigation" className="fixed inset-y-0 start-0 z-40 border-e border-sidebar-border" style={{ width: open ? 320 : 72 }}>{navigation}</aside>
  </div>;
}
