"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useSettings } from "@/contexts/settings-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  HandCoins,
  Calendar,
  Film,
  Heart,
  Settings,
  UserCog,
  Home,
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
  roles?: string[];
}

const navItems: { section: string; items: NavItem[] }[] = [
  {
    section: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        children: [
          { title: "Admin Dashboard", href: "/dashboard/admin", roles: ["super_admin", "church_admin"] },
          { title: "Pastor Dashboard", href: "/dashboard/pastor", roles: ["senior_pastor", "branch_pastor"] },
          { title: "Secretary Dashboard", href: "/dashboard/secretary", roles: ["secretary"] },
          { title: "Treasurer Dashboard", href: "/dashboard/treasurer", roles: ["treasurer"] },
          { title: "Department Dashboard", href: "/dashboard/department", roles: ["department_head"] },
          { title: "My Dashboard", href: "/dashboard", roles: ["member"] },
        ],
      },
      {
        title: "Members",
        href: "/members",
        icon: Users,
        children: [
          { title: "All Members", href: "/members" },
          { title: "Add Member", href: "/members/new" },
          { title: "Import Members", href: "/members/import" },
          { title: "Families", href: "/members/families" },
        ],
      },
      {
        title: "Attendance",
        href: "/attendance",
        icon: CalendarCheck,
        children: [
          { title: "Dashboard", href: "/attendance" },
          { title: "Services", href: "/attendance/services" },
          { title: "Check-In", href: "/attendance/check-in" },
          { title: "Records", href: "/attendance/records" },
          { title: "Reports", href: "/attendance/reports" },
        ],
      },
      {
        title: "Giving",
        href: "/giving",
        icon: HandCoins,
        children: [
          { title: "Dashboard", href: "/giving" },
          { title: "Categories", href: "/giving/categories" },
          { title: "Records", href: "/giving/records" },
          { title: "Reports", href: "/giving/reports" },
          { title: "Recurring Giving", href: "/giving/recurring" },
        ],
      },
      {
        title: "Events",
        href: "/events",
        icon: Calendar,
        children: [
          { title: "Calendar", href: "/events" },
          { title: "All Events", href: "/events/list" },
          { title: "Registrations", href: "/events/registrations" },
          { title: "Tickets", href: "/events/tickets" },
        ],
      },
      {
        title: "Sermons",
        href: "/sermons",
        icon: BookOpen,
        children: [
          { title: "All Sermons", href: "/sermons" },
          { title: "Add Sermon", href: "/sermons/new" },
          { title: "Series", href: "/sermons/series" },
          { title: "Speakers", href: "/sermons/speakers" },
        ],
      },
      {
        title: "Media",
        href: "/media",
        icon: Film,
        children: [
          { title: "Library", href: "/media" },
          { title: "Upload", href: "/media/upload" },
          { title: "Folders", href: "/media/folders" },
        ],
      },
      {
        title: "Pastoral Care",
        href: "/pastoral",
        icon: HeartHandshake,
        children: [
          { title: "Notes", href: "/pastoral" },
          { title: "Life Events", href: "/pastoral/life-events" },
          { title: "Risk Scores", href: "/pastoral/risk-scores" },
          { title: "Engagement", href: "/pastoral/engagement" },
        ],
      },
      {
        title: "Visitors",
        href: "/visitors",
        icon: UserPlus,
        children: [
          { title: "All Visitors", href: "/visitors" },
          { title: "Add Visitor", href: "/visitors/new" },
          { title: "Follow-Up", href: "/visitors/follow-up" },
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
      },
      {
        title: "Broadcasts",
        href: "/communication/broadcasts",
        icon: Megaphone,
      },
      {
        title: "Messages",
        href: "/communication/messages",
        icon: MessageSquare,
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
          { title: "All Departments", href: "/departments" },
          { title: "Cell Groups", href: "/departments/cell-groups" },
        ],
      },
      {
        title: "Assets",
        href: "/assets",
        icon: Package,
        children: [
          { title: "All Assets", href: "/assets" },
          { title: "Categories", href: "/assets/categories" },
          { title: "Maintenance", href: "/assets/maintenance" },
          { title: "Loans", href: "/assets/loans" },
        ],
      },
      {
        title: "Forms",
        href: "/forms",
        icon: ClipboardList,
        children: [
          { title: "All Forms", href: "/forms" },
          { title: "Submissions", href: "/forms/submissions" },
        ],
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileBarChart,
        children: [
          { title: "Financial", href: "/reports/financial" },
          { title: "Attendance", href: "/reports/attendance" },
          { title: "Members", href: "/reports/members" },
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
        children: [
          { title: "Users", href: "/admin/users" },
          { title: "Roles & Permissions", href: "/admin/roles" },
        ],
      },
      {
        title: "Church Settings",
        href: "/admin/settings",
        icon: Settings,
        children: [
          { title: "General", href: "/admin/settings" },
          { title: "Branches", href: "/admin/branches" },
          { title: "Notifications", href: "/admin/notifications" },
          { title: "Webhooks", href: "/admin/webhooks" },
          { title: "Custom Fields", href: "/admin/custom-fields" },
        ],
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        children: [
          { title: "Overview", href: "/analytics" },
          { title: "Giving", href: "/analytics/giving" },
          { title: "Attendance", href: "/analytics/attendance" },
          { title: "Members", href: "/analytics/members" },
        ],
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
        level === 3 && "inside-submenu inside-submenu-two"
      )}
      style={{
        transform: open ? "translateY(-50%) rotate(90deg)" : "translateY(-50%) rotate(0deg)",
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
}: {
  item: NavItem;
  pathname: string;
  closeMobile: () => void;
  level?: number;
  openMenus: Record<string, boolean>;
  toggleMenu: (key: string) => void;
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
      <li className={cn("submenu", level >= 2 && "submenu-two", level >= 3 && "submenu-three")}>
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
            <span className={cn("badge badge-danger ml-auto flex-shrink-0", item.badgeVariant && `badge-${item.badgeVariant}`)}>
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
            />
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href || "#"}
        className={cn("flex items-center gap-2", isActive(item.href) && "active")}
        onClick={closeMobile}
      >
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        <span className="truncate">{item.title}</span>
        {item.badge && (
          <span className={cn("badge badge-danger ms-auto", item.badgeVariant && `badge-${item.badgeVariant}`)}>
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
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});
  const [hoverExpand, setHoverExpand] = React.useState(false);
  const sidebarRef = React.useRef<HTMLElement>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isModern = settings.layout === "modern";

  React.useEffect(() => {
    const expanded: Record<string, boolean> = {};
    const walk = (items: NavItem[], level = 1) => {
      items.forEach((item) => {
        const key = `${level}-${item.title}`;
        if (item.children) {
          const childActive = item.children.some(
            (child) =>
              pathname === child.href ||
              (child.href && pathname.startsWith(child.href + "/"))
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

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
      {mobileOpen && <div className="sidebar-overlay opened" onClick={closeMobile} />}

      <aside
        ref={sidebarRef}
        className={cn(
          "sidebar",
          collapsed && "mini-sidebar",
          collapsed && hoverExpand && "expand-menu",
          mobileOpen && "slide-nav"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar-logo">
          <Link href="/dashboard" className="logo logo-normal">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">ChurchOS</span>
            </div>
          </Link>
          <Link href="/dashboard" className="logo-small">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>
          <Link href="/dashboard" className="logo dark-logo">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">ChurchOS</span>
            </div>
          </Link>
        </div>

        {/* Modern Profile */}
        {isModern && (
          <div className="modern-profile p-3 pb-0">
            <div className="text-center rounded p-3 mb-4 user-profile" style={{ background: "var(--muted)" }}>
              <div className="avatar avatar-lg online mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="" alt="Img" />
                  <AvatarFallback className="text-sm font-semibold">AD</AvatarFallback>
                </Avatar>
              </div>
              <h6 className="text-xs font-normal mb-1">Admin User</h6>
              <p className="text-[10px] text-muted-foreground m-0">System Admin</p>
            </div>
            <div className="sidebar-nav mb-3">
              <ul className="flex list-none m-0 p-0 bg-transparent rounded">
                <li className="flex-1">
                  <a href="#" className="block text-center text-xs font-medium py-1.5 px-2 rounded bg-primary text-primary-foreground">
                    Menu
                  </a>
                </li>
                <li className="flex-1">
                  <Link href="/chat" className="block text-center text-xs font-medium py-1.5 px-2 rounded text-muted-foreground hover:bg-muted">
                    Chats
                  </Link>
                </li>
                <li className="flex-1">
                  <Link href="/email" className="block text-center text-xs font-medium py-1.5 px-2 rounded text-muted-foreground hover:bg-muted">
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
                <AvatarImage src="" alt="Img" />
                <AvatarFallback className="text-xs font-semibold">AD</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-start sidebar-profile-info ms-2">
              <h6>Admin User</h6>
              <p>System Admin</p>
            </div>
          </div>

          <div className="input-group input-group-flat inline-flex mb-4">
            <span className="input-icon-addon">
              <Search size={14} />
            </span>
            <input type="text" className="form-control" placeholder="Search in ChurchOS" />
          </div>

          <div className="flex items-center justify-between menu-item mb-3">
            <div className="me-3">
              <Link href="/calendar" className="btn-menubar">
                <CalendarIcon size={18} />
              </Link>
            </div>
            <div className="me-3">
              <Link href="/chat" className="btn-menubar relative">
                <MessageSquare size={18} />
                <span className="badge badge-info rounded-pill flex items-center justify-center header-badge">
                  5
                </span>
              </Link>
            </div>
            <div className="me-3 notification-item">
              <Link href="/activity" className="btn-menubar relative me-1">
                <Bell size={18} />
                <span className="notification-status-dot"></span>
              </Link>
            </div>
            <div className="me-0">
              <Link href="/email" className="btn-menubar">
                <Mail size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className="sidebar-inner slimscroll">
          <div className="sidebar-menu" id="sidebar-menu">
            <ul>
              {navItems.map((group) => (
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
