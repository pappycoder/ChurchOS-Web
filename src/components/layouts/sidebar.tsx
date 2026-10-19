"use client";

import { SUPPORT_TICKET_PATH } from "@/lib/support";
import { featureForPath } from "@/lib/plan-features";
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


import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Sidebar as SidebarPrimitive, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AccountMenu } from "./account-menu";

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
      { title: "Support ticket", href: SUPPORT_TICKET_PATH, icon: Mail },
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
    ...group, items: filterPermissionNavigation(group.items, canAny).filter(item => { const feature = featureForPath(item.href || ""); return !feature || profile.planFeatures === undefined || profile.planFeatures.includes(feature); }),
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
    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
      <Link href={item.href!} aria-current={active ? "page" : undefined} onClick={() => setOpenMobile(false)} onMouseEnter={() => prefetch(item.href)} onFocus={() => prefetch(item.href)}>{content}</Link>
    </SidebarMenuButton>
  </SidebarMenuItem>;
  if (state === "collapsed" && !isMobile) return <SidebarMenuItem>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><SidebarMenuButton tooltip={item.title} isActive={active}>{content}<ChevronRight className="ms-auto size-4" /></SidebarMenuButton></DropdownMenuTrigger>
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
      <CollapsibleTrigger asChild><SidebarMenuButton tooltip={item.title}>{content}<ChevronRight className="ms-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" /></SidebarMenuButton></CollapsibleTrigger>
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

export function Sidebar() {
  const pathname = usePathname();
  const groups = useVisibleNavigation();
  const { setOpenMobile } = useSidebar();
  const { data: profile } = useCurrentProfile();
  React.useEffect(() => { setOpenMobile(false); }, [pathname, setOpenMobile]);
  const activeHref = navigationLeaves(groups.flatMap((group) => group.items))
    .map((item) => item.href).filter((href): href is string => !!href && (pathname === href || pathname.startsWith(href + "/")))
    .sort((a, b) => b.length - a.length)[0];
  return <SidebarPrimitive collapsible="icon" variant="inset" aria-label="Main navigation">
    <SidebarHeader><SidebarMenu><SidebarMenuItem>
      <SidebarMenuButton size="lg" asChild className="gap-2">
        <Link href="/dashboard" onClick={() => setOpenMobile(false)}>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background"><BrandLogo variant="mark" emblemClassName="size-7 dark:brightness-0 dark:invert" /></div>
          <div className="grid flex-1 text-start text-sm leading-tight"><span className="truncate font-semibold">{profile?.church?.name || "ChurchOS"}</span><span className="truncate text-xs text-sidebar-foreground/70">{profile?.isAdminHq ? "Headquarters workspace" : profile?.branch?.name || "Church workspace"}</span></div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem></SidebarMenu></SidebarHeader>
    <SidebarContent><nav id="sidebar-menu" aria-label="Workspace">
      {groups.map((group) => <SidebarGroup key={group.section}>
        <SidebarGroupLabel>{group.section === "MAIN MENU" ? "General" : group.section.charAt(0) + group.section.slice(1).toLowerCase()}</SidebarGroupLabel>
        <SidebarMenu>{group.items.map((item) => <NavigationItem key={item.title} item={item} activeHref={activeHref} />)}</SidebarMenu>
      </SidebarGroup>)}
    </nav></SidebarContent>
    <SidebarFooter><AccountMenu placement="sidebar" /></SidebarFooter>
    <SidebarRail />
  </SidebarPrimitive>;
}
