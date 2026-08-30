"use client";

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/contexts/sidebar-context";
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
import { useEmailUnread } from "@/hooks/use-email";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  IconArrowBarToLeft,
  IconSearch,
  IconSettingsCog,
  IconSparkles,
  IconMaximize,
  IconMinimize,
  IconUser,
  IconSettings,
  IconQuestionMark,
  IconLogout,
  IconChevronDown,
  IconMenu2,
  IconDotsVertical,
  IconX,
  IconMail,
} from "@tabler/icons-react";

const AI_LINKS = [
  { title: "AI Dashboard", href: "/ai-dashboard" },
  { title: "AI Configuration", href: "/ai-configuration" },
  { title: "AI Attendance", href: "/ai-attendance" },
  { title: "AI Hiring Forecast", href: "/ai-hiring" },
];

interface HorizontalNavItem {
  title: string;
  href: string;
  children?: { title: string; href: string }[];
  permission?: string;
}

const HORIZONTAL_NAV: HorizontalNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Members",
    href: "#",
    children: [
      { title: "All Members", href: "/members" },
      { title: "Add Member", href: "/members/new" },
    ],
  },
  {
    title: "Attendance",
    href: "#",
    children: [
      { title: "Dashboard", href: "/attendance" },
      { title: "Records", href: "/attendance/records" },
      { title: "Reports", href: "/attendance/reports" },
    ],
  },
  {
    title: "Giving",
    href: "#",
    children: [
      { title: "Dashboard", href: "/giving" },
      { title: "Records", href: "/giving/records" },
      { title: "Reports", href: "/giving/reports" },
    ],
  },
  {
    title: "Events",
    href: "#",
    children: [
      { title: "Calendar", href: "/events" },
      { title: "All Events", href: "/events/list" },
    ],
  },
  {
    title: "Media",
    href: "/media",
    permission: "media:read",
  },
  {
    title: "Pastoral Care",
    href: "/pastoral",
  },
];

export function Header() {
  const { collapsed, toggleCollapse, mobileOpen, openMobile, closeMobile } = useSidebar();
  const { settings } = useSettings();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const { logout } = useAuth();
  const { data: currentProfile } = useCurrentProfile();
  const { canAny } = usePermissions();
  const { data: emailUnread } = useEmailUnread();
  const emailUnreadCount = emailUnread?.count ?? 0;

  const visibleNav = React.useMemo(
    () => HORIZONTAL_NAV.filter((item) => !item.permission || canAny(item.permission)),
    [canAny],
  );

  const displayName =
    [currentProfile?.firstName, currentProfile?.lastName]
      .filter(Boolean)
      .join(" ") || "My Account";
  const initials = `${currentProfile?.firstName?.charAt(0) ?? ""}${
    currentProfile?.lastName?.charAt(0) ?? ""
  }`.toUpperCase() || "U";

  const handleLogout = async () => {
    await logout();
  };

  const handleMobileToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mobileOpen) {
      closeMobile();
      document.documentElement.classList.remove("menu-opened");
    } else {
      openMobile();
      document.documentElement.classList.add("menu-opened");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isHorizontal = ["horizontal", "horizontal-single", "horizontal-overlay", "horizontal-sidemenu"].includes(
    settings.layout
  );

  return (
    <header className="header">
      <div className="main-header">
        {/* Logo — hidden on desktop via CSS, visible on mobile */}
        <div className="header-left">
          <Link href="/dashboard" className="logo">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">C</span>
              </div>
              <span className="text-lg font-bold text-foreground">ChurchOS</span>
            </div>
          </Link>
          <Link href="/dashboard" className="logo dark-logo">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">C</span>
              </div>
              <span className="text-lg font-bold text-foreground">ChurchOS</span>
            </div>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <a id="mobile_btn" className="mobile_btn" href="#sidebar" onClick={handleMobileToggle}>
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </a>

        {/* header-user with display:contents */}
        <div className="header-user">
          <div className="nav user-menu nav-list">
            {/* LEFT-ALIGNED group: toggle, search, CRM, settings */}
            <div className="me-auto flex items-center" id="header-search">
              <a
                id="toggle_btn"
                href="#"
                className="btn-menubar me-2"
                onClick={(e) => {
                  e.preventDefault();
                  toggleCollapse();
                }}
              >
                <IconArrowBarToLeft
                  style={{
                    transform: collapsed ? "rotate(180deg)" : "none",
                    transition: "transform 0.3s",
                  }}
                  size={18}
                />
              </a>

              <div className="input-group input-group-flat inline-flex me-2">
                <span className="input-icon-addon">
                  <IconSearch size={14} />
                </span>
                <input type="text" className="form-control" placeholder="Search in ChurchOS" />
              </div>

              <Link href="/admin/settings" className="btn-menubar">
                <IconSettingsCog size={18} />
              </Link>
            </div>

            {/* Horizontal Single Menu */}
            {isHorizontal && (
              <div className="sidebar sidebar-horizontal" id="horizontal-single">
                <div className="sidebar-menu">
                  <div className="main-menu">
                    <ul className="nav-menu">
                      {visibleNav.map((item) => (
                        <li
                          key={item.title}
                          className={cn(item.children && "submenu")}
                        >
                          {item.children ? (
                            <>
                              <a href="#">
                                {item.title}
                                <span className="menu-arrow"></span>
                              </a>
                              <ul>
                                {item.children.map((child) => (
                                  <li key={child.href}>
                                    <Link href={child.href}>{child.title}</Link>
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <Link href={item.href}>{item.title}</Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT-ALIGNED group */}
            <div className="header-right flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <a href="#" className="btn-primary-gradient me-1">
                    <IconSparkles size={16} />
                    AI Center
                    <IconChevronDown size={14} />
                  </a>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="app-launcher" align="end">
                  {AI_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="app-launcher-item">
                      {link.title}
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="me-2">
                <ActionTooltip label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                  <button
                    className="btn-menubar btnFullscreen"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                  </button>
                </ActionTooltip>
              </div>

              <div className="me-2 notification_item">
                <ActionTooltip label="Inbox">
                  <Link
                    href="/communication/inbox"
                    className="btn-menubar relative"
                    aria-label="Inbox"
                  >
                    <IconMail size={18} />
                    {emailUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                        {emailUnreadCount > 99 ? "99+" : emailUnreadCount}
                      </span>
                    )}
                  </Link>
                </ActionTooltip>
              </div>

              <div className="me-2 notification_item">
                <NotificationBell />
              </div>

              <div className="dropdown profile-dropdown">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <a href="#" className="dropdown-toggle flex items-center">
                      <span className="avatar avatar-md online">
                        <Avatar className="w-9 h-9 border-2 border-border">
                          <AvatarImage
                            src={currentProfile?.avatarUrl}
                            alt={displayName}
                          />
                          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                      </span>
                    </a>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="dropdown-menu shadow-none p-0" align="end" style={{ minWidth: 240 }}>
                    <div className="card mb-0 border-0 shadow-none">
                      <div className="card-header">
                        <div className="flex items-center gap-3">
                          <span className="avatar avatar-lg avatar-rounded">
                            <Avatar className="w-11 h-11">
                              <AvatarImage
                                src={currentProfile?.avatarUrl}
                                alt={displayName}
                              />
                              <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                          </span>
                          <div>
                            <h5 className="font-semibold m-0 text-sm">{displayName}</h5>
                            <p className="text-muted-foreground m-0 text-xs font-medium">
                              {currentProfile?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="card-body py-2">
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="dropdown-item py-2">
                            <IconUser size={16} /> My Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/settings" className="dropdown-item py-2">
                            <IconSettings size={16} /> Account Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/knowledge-base" className="dropdown-item py-2">
                            <IconQuestionMark size={16} /> Knowledge Base
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <div className="card-footer py-2">
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="dropdown-item py-2 text-destructive"
                        >
                          <IconLogout size={16} /> Logout
                        </DropdownMenuItem>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile 3-dot menu */}
        <div className="mobile-user-menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <a href="#" className="text-foreground text-xl">
                <IconDotsVertical size={20} />
              </a>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ minWidth: 200 }}>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="dropdown-item">
                  <IconUser size={16} /> My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="dropdown-item">
                  <IconSettings size={16} /> Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="dropdown-item text-destructive"
              >
                <IconLogout size={16} /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
