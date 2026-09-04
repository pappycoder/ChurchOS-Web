"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useSettings } from "@/contexts/settings-context";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  UserCog,
  Search,
  Calendar as CalendarIcon,
  MessageSquare,
  Bell,
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

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "danger" | "info" | "success" | "warning" | "primary";
  children?: NavItem[];
  /** Legacy any-of role gate (no dedicated permission resource). */
  roles?: string[];
  /** Required `resource:action` permission, e.g. "members:read". */
  permission?: string;
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
        permission: "members:read",
        children: [
          {
            title: "All Members",
            href: "/members",
            permission: "members:read",
          },
          {
            title: "Add Member",
            href: "/members/new",
            permission: "members:create",
          },
          {
            title: "Import Members",
            href: "/members/import",
            permission: "members:create",
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
        permission: "attendance:read",
        children: [
          {
            title: "Dashboard",
            href: "/attendance",
            permission: "attendance:read",
          },
          {
            title: "Services",
            href: "/attendance/services",
            permission: "attendance:read",
          },
          {
            title: "Check-In",
            href: "/attendance/check-in",
            permission: "attendance:read",
          },
          {
            title: "Records",
            href: "/attendance/records",
            permission: "attendance:read",
          },
          {
            title: "Reports",
            href: "/attendance/reports",
            permission: "attendance:read",
          },
        ],
      },
      {
        title: "Giving",
        href: "/giving",
        icon: HandCoins,
        permission: "giving:read",
        children: [
          { title: "Dashboard", href: "/giving", permission: "giving:read" },
          {
            title: "Categories",
            href: "/giving/categories",
            permission: "giving:read",
          },
          {
            title: "Records",
            href: "/giving/records",
            permission: "giving:read",
          },
          {
            title: "Reports",
            href: "/giving/reports",
            permission: "giving:read",
          },
          {
            title: "Recurring Giving",
            href: "/giving/recurring",
            permission: "giving:read",
          },
        ],
      },
      {
        title: "Events",
        href: "/events",
        icon: Calendar,
        permission: "events:read",
        children: [
          { title: "Calendar", href: "/events", permission: "events:read" },
          {
            title: "All Events",
            href: "/events/list",
            permission: "events:read",
          },
          {
            title: "Check-In",
            href: "/events/check-in",
            permission: "events:update",
          },
          {
            title: "Registrations",
            href: "/events/registrations",
            permission: "events:read",
          },
          {
            title: "Tickets",
            href: "/events/management",
            permission: "events:read",
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
            permission: "sermons:read",
          },
          {
            title: "Add Sermon",
            href: "/sermons/new",
            permission: "sermons:create",
          },
          {
            title: "Series",
            href: "/sermons/series",
            permission: "sermons:read",
          },
          {
            title: "Speakers",
            href: "/sermons/speakers",
            permission: "sermons:read",
          },
        ],
      },
      {
        title: "Media",
        href: "/media",
        icon: Film,
        permission: "media:read",
        children: [
          { title: "Library", href: "/media", permission: "media:read" },
          {
            title: "Upload",
            href: "/media/upload",
            permission: "media:create",
          },
          {
            title: "Folders",
            href: "/media/folders",
            permission: "media:read",
          },
        ],
      },
      {
        title: "Pastoral Care",
        href: "/pastoral",
        icon: HeartHandshake,
        permission: "pastoral:read",
        children: [
          { title: "Notes", href: "/pastoral", permission: "pastoral:read" },
          {
            title: "Life Events",
            href: "/pastoral/life-events",
            permission: "pastoral:read",
          },
          {
            title: "Risk Scores",
            href: "/pastoral/risk-scores",
            permission: "pastoral:read",
          },
          {
            title: "Engagement",
            href: "/pastoral/engagement",
            permission: "pastoral:read",
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
            permission: "visitors:read",
          },
          {
            title: "Add Visitor",
            href: "/visitors/new",
            permission: "visitors:create",
          },
          {
            title: "Follow-Up",
            href: "/visitors/follow-up",
            permission: "visitors:update",
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
        permission: "departments:read",
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
          { title: "All Assets", href: "/assets", permission: "assets:read" },
          {
            title: "Categories",
            href: "/assets/categories",
            permission: "assets:read",
          },
          {
            title: "Maintenance",
            href: "/assets/maintenance",
            permission: "assets:read",
          },
          { title: "Loans", href: "/assets/loans", permission: "assets:read" },
        ],
      },
      {
        title: "Forms",
        href: "/forms",
        icon: ClipboardList,
        permission: "forms:read",
        children: [
          { title: "All Forms", href: "/forms", permission: "forms:read" },
          {
            title: "Submissions",
            href: "/forms/submissions",
            permission: "forms:read",
          },
        ],
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileBarChart,
        permission: "reports:read",
        children: [
          {
            title: "Generate Report",
            href: "/reports",
            permission: "reports:read",
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
        permission: "users:read",
        children: [
          { title: "Users", href: "/admin/users", permission: "users:read" },
          {
            title: "Roles & Permissions",
            href: "/admin/roles",
            roles: ["church_admin", "super_admin"],
          },
        ],
      },
      {
        title: "Church Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: "church_settings:update",
        children: [
          {
            title: "General",
            href: "/admin/settings",
            permission: "church_settings:update",
          },
          {
            title: "Branches",
            href: "/admin/branches",
            permission: "branches:read",
          },
        ],
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        roles: ["church_admin", "senior_pastor", "branch_pastor", "treasurer"],
        children: [
          {
            title: "Overview",
            href: "/analytics",
            roles: ["church_admin", "senior_pastor", "branch_pastor"],
          },
          {
            title: "Giving",
            href: "/analytics/giving",
            roles: [
              "church_admin",
              "senior_pastor",
              "branch_pastor",
              "treasurer",
            ],
          },
          {
            title: "Attendance",
            href: "/analytics/attendance",
            roles: ["church_admin", "senior_pastor", "branch_pastor"],
          },
          {
            title: "Members",
            href: "/analytics/members",
            roles: ["church_admin", "senior_pastor", "branch_pastor"],
          },
        ],
      },
    ],
  },
  {
    section: "SUPPORT",
    items: [
      {
        title: "Help & Documentation",
        href: "/docs",
        icon: BookOpen,
      },
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

function MenuArrow({ open, level }: { open: boolean; level: number }) {
  return (
    <span
      className={cn(
        "menu-arrow",
        level === 2 && "inside-submenu",
        level === 3 && "inside-submenu inside-submenu-two",
      )}
      style={{
        transform: open
          ? "translateY(-50%) rotate(90deg)"
          : "translateY(-50%) rotate(0deg)",
      }}
    />
  );
}

function NavLink({
  item,
  pathname,
  closeMobile,
  level = 1,
  openMenus,
  toggleMenu,
  isLinkActive,
}: {
  item: NavItem;
  pathname: string;
  closeMobile: () => void;
  level?: number;
  openMenus: Record<string, boolean>;
  toggleMenu: (key: string) => void;
  isLinkActive: (href?: string) => boolean;
}) {
  const Icon = item.icon || ICON_MAP[item.title];
  const hasChildren = !!item.children?.length;
  const itemKey = `${level}-${item.title}`;
  const open = openMenus[itemKey];

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const active = hasChildren
    ? item.children!.some((child) => isActive(child.href))
    : isActive(item.href);

  if (hasChildren) {
    return (
      <li
        className={cn(
          "submenu",
          level >= 2 && "submenu-two",
          level >= 3 && "submenu-three",
        )}
      >
        <a
          href="#"
          className={cn(active && "active", open && "subdrop")}
          onClick={(e) => {
            e.preventDefault();
            toggleMenu(itemKey);
          }}
        >
          {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span className="truncate">{item.title}</span>
          {item.badge && (
            <span
              className={cn(
                "badge badge-danger ml-auto flex-shrink-0",
                item.badgeVariant && `badge-${item.badgeVariant}`,
              )}
            >
              {item.badge}
            </span>
          )}
          <MenuArrow open={open} level={level} />
        </a>
        <ul
          className={cn(open && "subdrop-show")}
          style={{
            overflow: "hidden",
            transition: "max-height 0.3s ease",
          }}
        >
          {item.children!.map((child) => (
            <NavLink
              key={child.title + (child.href || "")}
              item={child}
              pathname={pathname}
              closeMobile={closeMobile}
              level={level + 1}
              openMenus={openMenus}
              toggleMenu={toggleMenu}
              isLinkActive={isLinkActive}
            />
          ))}{" "}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href || "#"}
        className={cn(
          "flex items-center gap-2",
          isLinkActive(item.href) && "active",
        )}
        onClick={closeMobile}
      >
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        <span className="truncate">{item.title}</span>
        {item.badge && (
          <span
            className={cn(
              "badge badge-danger ms-auto",
              item.badgeVariant && `badge-${item.badgeVariant}`,
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const { settings } = useSettings();
  const { ready, can, hasRole } = usePermissions();
  const { data: currentProfile } = useCurrentProfile();
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});
  const [hoverExpand, setHoverExpand] = React.useState(false);
  const sidebarRef = React.useRef<HTMLElement>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isModern = settings.layout === "modern";

  const profileName = currentProfile
    ? `${currentProfile.firstName ?? ""} ${currentProfile.lastName ?? ""}`.trim() ||
      "Admin User"
    : "Admin User";
  const profileRole = currentProfile?.role?.[0] || "Administrator";
  const profileInitials = (currentProfile?.firstName?.[0] ?? "") +
    `${currentProfile?.lastName?.[0] ?? ""}`.toUpperCase() || "AD";

  // Permission-filtered nav: items without a gate stay visible; gated items
  // require their permission (or legacy role). Parents survive only when at
  // least one child survives; empty sections are dropped. Fail-closed while
  // the profile loads.
  const visibleNav = React.useMemo(() => {
    if (!ready) return [];
    const itemAllowed = (item: NavItem): boolean => {
      if (item.permission) {
        const [resource, action] = item.permission.split(":");
        if (!can(resource, action as Parameters<typeof can>[1])) return false;
      }
      if (item.roles?.length && !hasRole(...item.roles)) return false;
      return true;
    };
    const filterItem = (item: NavItem): NavItem | null => {
      if (!itemAllowed(item)) return null;
      if (!item.children) return item;
      const children = item.children
        .map(filterItem)
        .filter((c): c is NavItem => c !== null);
      return children.length > 0 ? { ...item, children } : null;
    };
    return navItems
      .map((group) => ({
        ...group,
        items: group.items
          .map(filterItem)
          .filter((i): i is NavItem => i !== null),
      }))
      .filter((group) => group.items.length > 0);
  }, [ready, can, hasRole]);

  React.useEffect(() => {
    const expanded: Record<string, boolean> = {};
    const walk = (items: NavItem[], level = 1) => {
      items.forEach((item) => {
        const key = `${level}-${item.title}`;
        if (item.children) {
          const childActive = item.children.some(
            (child) =>
              pathname === child.href ||
              (child.href && pathname.startsWith(child.href + "/")),
          );
          if (childActive) {
            expanded[key] = true;
          }
          walk(item.children, level + 1);
        }
      });
    };
    walk(navItems.flatMap((g) => g.items));
    setOpenMenus((prev) => ({ ...prev, ...expanded }));
  }, [pathname]);

  // Close the mobile (off-canvas) sidebar with the Escape key.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      // Single-open accordion: clicking a menu collapses every other one.
      // Clicking the already-open menu just closes it (empty object).
      return { [key]: !prev[key] };
    });
  };

  // Every leaf link's href in the (permission-filtered) tree.
  const leafHrefs = React.useMemo(() => {
    const out: string[] = [];
    const walk = (items: NavItem[]) =>
      items.forEach((i) => {
        if (i.children?.length) walk(i.children);
        else if (i.href) out.push(i.href);
      });
    visibleNav.forEach((g) => walk(g.items));
    return out;
  }, [visibleNav]);

  // Longest matching href wins, so an index link ("/members") doesn't stay
  // lit on its own subpages ("/members/import", "/members/families", ...).
  const isLinkActive = React.useCallback(
    (href?: string) => {
      if (!href) return false;
      const matches = (candidate?: string) =>
        !!candidate &&
        (pathname === candidate || pathname.startsWith(candidate + "/"));
      if (!matches(href)) return false;
      return !leafHrefs.some(
        (other) =>
          other !== href && other.length > href.length && matches(other),
      );
    },
    [pathname, leafHrefs],
  );

  const handleMouseEnter = React.useCallback(() => {
    if (!collapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverExpand(true);
  }, [collapsed]);

  const handleMouseLeave = React.useCallback(() => {
    if (!collapsed) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverExpand(false);
    }, 100);
  }, [collapsed]);

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay opened" onClick={closeMobile} />
      )}

      <aside
        ref={sidebarRef}
        className={cn(
          "sidebar",
          collapsed && "mini-sidebar",
          collapsed && hoverExpand && "expand-menu",
          mobileOpen && "slide-nav",
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar-logo">
          <Link href="/dashboard" className="logo">
            <BrandLogo emblemClassName="h-20" />
          </Link>
          <Link href="/dashboard" className="logo dark-logo">
            <BrandLogo emblemClassName="h-20" />
          </Link>
          <Link href="/dashboard" className="logo-small">
            <BrandLogo variant="mark" emblemClassName="h-14 w-14" />
          </Link>
        </div>

        {/* Modern Profile */}
        {isModern && (
          <div className="modern-profile p-3 pb-0">
            <div
              className="text-center rounded p-3 mb-4 user-profile"
              style={{ background: "var(--muted)" }}
            >
              <div className="avatar avatar-lg online mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={currentProfile?.avatarUrl ?? ""} alt={profileName} />
                  <AvatarFallback className="text-sm font-semibold">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h6 className="text-xs font-normal mb-1">{profileName}</h6>
              <p className="text-[10px] text-muted-foreground m-0">
                {profileRole}
              </p>
            </div>
            <div className="sidebar-nav mb-3">
              <ul className="flex list-none m-0 p-0 bg-transparent rounded">
                <li className="flex-1">
                  <a
                    href="#"
                    className="block text-center text-xs font-medium py-1.5 px-2 rounded bg-primary text-primary-foreground"
                  >
                    Menu
                  </a>
                </li>
                <li className="flex-1">
                  <Link
                    href="/communication/inbox"
                    className="block text-center text-xs font-medium py-1.5 px-2 rounded text-muted-foreground hover:bg-muted"
                  >
                    Inbox
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div
            className="rounded p-2 mb-4 sidebar-profile flex items-center"
            style={{ background: "var(--muted)" }}
          >
            <div className="avatar avatar-md online">
              <Avatar className="w-9 h-9">
                <AvatarImage src={currentProfile?.avatarUrl ?? ""} alt={profileName} />
                <AvatarFallback className="text-xs font-semibold">
                  {profileInitials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-start sidebar-profile-info ms-2">
              <h6>{profileName}</h6>
              <p>{profileRole}</p>
            </div>
          </div>

          <div className="input-group input-group-flat inline-flex mb-4">
            <span className="input-icon-addon">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search in ChurchOS"
            />
          </div>

          <div className="flex items-center justify-between menu-item mb-3">
            <div className="me-3">
              <Link href="/calendar" className="btn-menubar">
                <CalendarIcon size={18} />
              </Link>
            </div>
            <div className="me-3 notification-item">
              <Link href="/activity" className="btn-menubar relative me-1">
                <Bell size={18} />
                <span className="notification-status-dot"></span>
              </Link>
            </div>
            <div className="me-0">
              <Link href="/communication/inbox" className="btn-menubar">
                <Mail size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className="sidebar-inner slimscroll">
          <div className="sidebar-menu" id="sidebar-menu">
            <ul>
              {visibleNav.map((group) => (
                <React.Fragment key={group.section}>
                  <li className="menu-title">
                    <span>{group.section}</span>
                  </li>
                  <li>
                    <ul>
                      {group.items.map((item) => (
                        <NavLink
                          key={item.title}
                          item={item}
                          pathname={pathname}
                          closeMobile={closeMobile}
                          openMenus={openMenus}
                          toggleMenu={toggleMenu}
                          isLinkActive={isLinkActive}
                        />
                      ))}
                    </ul>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
