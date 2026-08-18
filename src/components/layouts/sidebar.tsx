"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  ChevronDown,
  ChevronLeft,
  Home,
} from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";

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
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
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
      {
        title: "Media",
        href: "/media",
        icon: Film,
      },
      {
        title: "Pastoral Care",
        href: "/pastoral",
        icon: Heart,
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
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-border transition-all duration-300",
        collapsed ? "w-[70px]" : "w-[252px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-[52px] px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-foreground">ChurchOS</span>
          )}
        </Link>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3">
          <SearchInput placeholder="Search in ChurchOS" shortcut />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navItems.map((group) => (
          <div key={group.section} className="mt-4">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.title}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={cn(
                          "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.title}</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform",
                                openMenus[item.title] && "rotate-180"
                              )}
                            />
                          </>
                        )}
                      </button>
                      {!collapsed && openMenus[item.title] && (
                        <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={cn(
                                  "flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors",
                                  pathname === child.href
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                {child.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute top-[52px] -right-3 z-50">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-border shadow-sm hover:bg-muted transition-colors"
        >
          <ChevronLeft
            className={cn(
              "h-3 w-3 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </aside>
  );
}
