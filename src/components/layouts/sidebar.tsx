"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
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
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: { title: string; href: string }[];
}

const navItems: { section: string; items: NavItem[] }[] = [
  {
    section: "MAIN MENU",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      {
        title: "Members",
        href: "/members",
        icon: Users,
        children: [
          { title: "All Members", href: "/members" },
          { title: "Add Member", href: "/members/new" },
        ],
      },
      {
        title: "Attendance",
        href: "/attendance",
        icon: CalendarCheck,
        children: [
          { title: "Dashboard", href: "/attendance" },
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
          { title: "Records", href: "/giving/records" },
          { title: "Reports", href: "/giving/reports" },
        ],
      },
      {
        title: "Events",
        href: "/events",
        icon: Calendar,
        children: [
          { title: "Calendar", href: "/events" },
          { title: "All Events", href: "/events/list" },
        ],
      },
      { title: "Media", href: "/media", icon: Film },
      { title: "Pastoral Care", href: "/pastoral", icon: Heart },
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
      { title: "Settings", href: "/admin/settings", icon: Settings },
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
  "Pastoral Care": Heart,
  "User Management": UserCog,
  Settings: Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});
  const [hoverExpand, setHoverExpand] = React.useState(false);
  const sidebarRef = React.useRef<HTMLElement>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const submenuRefs = React.useRef<Record<string, HTMLUListElement | null>>({});

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  React.useEffect(() => {
    const expanded: Record<string, boolean> = {};
    navItems.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children && item.children.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))) {
          expanded[item.title] = true;
        }
      });
    });
    setOpenMenus((prev) => ({ ...prev, ...expanded }));
  }, [pathname]);

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

  const getSubmenuStyle = (title: string, open: boolean): React.CSSProperties => {
    const el = submenuRefs.current[title];
    if (!el) return { maxHeight: open ? "none" : "0px" };
    if (open) {
      return { maxHeight: el.scrollHeight + "px" };
    }
    return { maxHeight: "0px" };
  };

  const onTransitionEnd = (title: string, open: boolean, el: HTMLUListElement) => {
    if (open) {
      el.style.maxHeight = "none";
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay opened"
          onClick={closeMobile}
        />
      )}

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

        <div className="sidebar-inner">
          <div className="sidebar-search">
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--muted-foreground)" }} />
              <input type="text" placeholder="Search in ChurchOS" style={{ paddingLeft: 30 }} />
            </div>
          </div>

          <div className="sidebar-menu" id="sidebar-menu">
            <ul>
              {navItems.map((group) => (
                <React.Fragment key={group.section}>
                  <li className="menu-title">
                    <span>{group.section}</span>
                  </li>
                  <li>
                    <ul>
                      {group.items.map((item) => {
                        const Icon = ICON_MAP[item.title] || item.icon;
                        const hasChildren = !!item.children?.length;
                        const active = hasChildren ? item.children!.some((child) => isActive(child.href)) : isActive(item.href);
                        const open = openMenus[item.title];

                        return (
                          <li
                            key={item.title}
                            className={cn(hasChildren && "submenu")}
                          >
                            {hasChildren ? (
                              <>
                                <a
                                  href="#"
                                  className={cn(active && "active", open && "subdrop")}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleMenu(item.title);
                                  }}
                                >
                                  <Icon />
                                  <span>{item.title}</span>
                                  <span className="menu-arrow" />
                                </a>
                                <ul
                                  ref={(el) => { submenuRefs.current[item.title] = el; }}
                                  style={getSubmenuStyle(item.title, open)}
                                  onTransitionEnd={(e) => {
                                    if (e.propertyName === "max-height") {
                                      onTransitionEnd(item.title, open, e.currentTarget as HTMLUListElement);
                                    }
                                  }}
                                >
                                  {item.children!.map((child) => (
                                    <li key={child.href} className="submenu-item">
                                      <Link
                                        href={child.href}
                                        className={cn(isActive(child.href) && "active")}
                                        onClick={closeMobile}
                                      >
                                        {child.title}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <Link
                                href={item.href}
                                className={cn(active && "active")}
                                onClick={closeMobile}
                              >
                                <Icon />
                                <span>{item.title}</span>
                              </Link>
                            )}
                          </li>
                        );
                      })}
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
