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


import { ArrowUpRight, CircleHelp, House, Layers3 } from "lucide-react";
import { areaForPath, activeDestination, groupWorkspaceNavigation } from "@/lib/workspace-navigation";
import { ColorModeToggle } from "@/components/shared/color-mode-toggle";
import { Sidebar as SidebarPrimitive, SidebarContent, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

const AREA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: House, people: UsersRound, gatherings: Calendar, giving: HandCoins,
  communication: MessageSquare, resources: Layers3, insights: BarChart3, administration: Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const groups = useVisibleNavigation();
  const { setOpenMobile, setOpen, open, isMobile } = useSidebar();
  const { data: profile } = useCurrentProfile();
  const prefetch = usePrefetchRoute();
  const items = React.useMemo(() => groups.flatMap(group => group.items), [groups]);
  const areas = React.useMemo(() => groupWorkspaceNavigation(items), [items]);
  const currentArea = areaForPath(areas, pathname);
  const area = areas.find(candidate => candidate.id === currentArea?.id) ?? areas[0];
  const activeHref = activeDestination(items, pathname)?.href;

  React.useEffect(() => { setOpenMobile(false); }, [pathname, setOpenMobile]);
  React.useEffect(() => {
    if (window.matchMedia("(min-width: 768px) and (max-width: 1279px)").matches) setOpen(false);
    // Set the initial tablet layout once; subsequent toggles belong to the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => setOpenMobile(false);
  const areaLink = (entry: (typeof areas)[number], compact: boolean) => {
    const Icon = AREA_ICONS[entry.id];
    const href = navigationLeaves(entry.items)[0]?.href;
    if (!href) return null;
    const active = currentArea?.id === entry.id;
    const link = <Link prefetch={false} href={href} aria-current={active ? "true" : undefined}
      aria-label={entry.title} data-area={entry.id} data-active={active}
      onClick={() => { close(); if (!isMobile) setOpen(true); }}
      className={cn("workspace-area-link", compact ? "workspace-area-link-compact" : "workspace-area-link-mobile")}>
      <Icon className="size-[19px] shrink-0" /><span>{compact && entry.id === "communication" ? "Connect" : compact && entry.id === "administration" ? "Admin" : entry.title}</span>
    </Link>;
    return compact ? <Tooltip key={entry.id}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{entry.title}</TooltipContent></Tooltip> : <React.Fragment key={entry.id}>{link}</React.Fragment>;
  };

  return <SidebarPrimitive collapsible="icon" variant="sidebar" aria-label="Main navigation" className="workspace-sidebar">
    <div className="flex min-h-0 flex-1">
      <nav aria-label="Workspace areas" className="workspace-area-rail hidden md:flex">
        <Link href="/dashboard" aria-label="ChurchOS home" className="workspace-brand-mark" onClick={close}>
          <BrandLogo variant="mark" emblemClassName="!size-8 brightness-0 invert" />
        </Link>
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-3">{areas.map(entry => areaLink(entry, true))}</div>
        <div className="flex flex-col items-center gap-2 border-t border-white/10 py-3">
          <Tooltip><TooltipTrigger asChild><Link href="/support" aria-label="Contact support" className="workspace-rail-utility"><CircleHelp className="size-5" /></Link></TooltipTrigger><TooltipContent side="right">Contact support</TooltipContent></Tooltip>
          <ColorModeToggle className="workspace-rail-utility" />
          <AccountMenu />
        </div>
      </nav>
      <div className={cn("workspace-context-panel flex min-h-0 flex-1 flex-col", !open && !isMobile && "hidden")}>
        <div className="workspace-church-heading">
          <span className="workspace-eyebrow">WORKSPACE</span>
          <p className="truncate text-sm font-semibold" title={profile?.church?.name}>{profile?.church?.name || "ChurchOS"}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.isAdminHq ? "Headquarters" : profile?.branch?.name || "Church workspace"}</p>
        </div>
        <SidebarContent>
          <nav aria-label="Workspace areas" className="grid grid-cols-2 gap-1 border-b p-3 md:hidden">{areas.map(entry => areaLink(entry, false))}</nav>
          <div className="px-5 pb-3 pt-6">
            <p className="text-lg font-semibold tracking-tight">{area?.title ?? (pathname === "/profile" ? "Your account" : "Workspace")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{area?.description ?? "Your personal workspace"}</p>
          </div>
          <nav id="sidebar-menu" aria-label="Workspace" className="space-y-5 px-3 pb-5">
            {area?.items.map(item => <section key={item.title}>
              {item.children?.length ? <>
                <p className="workspace-nav-label">{item.title}</p>
                <div className="space-y-1">{navigationLeaves(item.children).map(child => {
                  const Icon = child.icon ?? ICON_MAP[child.title] ?? item.icon;
                  return <Link prefetch={false} key={child.href} href={child.href!} onClick={close}
                    aria-current={child.href === activeHref ? "page" : undefined}
                    data-active={child.href === activeHref} className="workspace-destination"
                    onMouseEnter={() => prefetch(child.href)} onFocus={() => prefetch(child.href)}>
                    {Icon && <Icon className="size-4 shrink-0" />}<span>{child.title}</span>
                  </Link>;
                })}</div>
              </> : <Link href={item.href!} onClick={close} aria-current={item.href === activeHref ? "page" : undefined}
                data-active={item.href === activeHref} className="workspace-destination"
                onMouseEnter={() => prefetch(item.href)} onFocus={() => prefetch(item.href)}>
                {item.icon && <item.icon className="size-4 shrink-0" />}<span>{item.title}</span>
              </Link>}
            </section>)}
          </nav>
        </SidebarContent>
        <SidebarFooter className="workspace-context-footer">
          <Link href="/help" aria-label="Help Centre" className="flex items-center justify-between gap-2 rounded-xl border bg-background px-3 py-3 text-xs text-muted-foreground hover:text-foreground" onClick={close}>A little help, whenever you need it<ArrowUpRight className="size-4 shrink-0" /></Link>
          <div className="flex items-center justify-between md:hidden"><Link href="/support" className="workspace-destination" onClick={close}>Contact support</Link><ColorModeToggle /><AccountMenu /></div>
        </SidebarFooter>
      </div>
    </div>
  </SidebarPrimitive>;
}
