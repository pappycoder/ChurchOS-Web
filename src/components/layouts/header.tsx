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
import { cn } from "@/lib/utils";
import {
  IconArrowBarToLeft,
  IconSearch,
  IconLayoutGrid,
  IconSettingsCog,
  IconSparkles,
  IconMaximize,
  IconMinimize,
  IconMessage,
  IconMail,
  IconBell,
  IconUser,
  IconSettings,
  IconQuestionMark,
  IconLogout,
  IconCalendar,
  IconBrandHipchat,
  IconTimeline,
  IconLayoutKanban,
  IconCreditCard,
  IconChecklist,
  IconNotes,
  IconFolder,
  IconChevronDown,
  IconArrowRight,
  IconMenu2,
  IconDotsVertical,
  IconX,
} from "@tabler/icons-react";

const CRM_LINKS = [
  { title: "Contacts", href: "/contacts", icon: IconUser },
  { title: "Companies", href: "/companies", icon: IconLayoutGrid },
  { title: "Deals", href: "/deals", icon: IconTimeline },
  { title: "Leads", href: "/leads", icon: IconChecklist },
  { title: "Pipeline", href: "/pipeline", icon: IconTimeline },
  { title: "Activities", href: "/activity", icon: IconChecklist },
];

const APP_LINKS = [
  { title: "Calendar", href: "/calendar", icon: IconCalendar },
  { title: "Chat", href: "/chat", icon: IconBrandHipchat },
  { title: "Notes", href: "/notes", icon: IconNotes },
  { title: "Files", href: "/files", icon: IconFolder },
  { title: "Kanban", href: "/kanban", icon: IconLayoutKanban },
  { title: "Invoices", href: "/invoices", icon: IconCreditCard },
];

const AI_LINKS = [
  { title: "AI Dashboard", href: "/ai-dashboard" },
  { title: "AI Configuration", href: "/ai-configuration" },
  { title: "AI Attendance", href: "/ai-attendance" },
  { title: "AI Hiring Forecast", href: "/ai-hiring" },
];

const HORIZONTAL_NAV = [
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <a href="#" className="btn-menubar me-2">
                    <IconLayoutGrid size={18} />
                  </a>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="crm-dropdown p-0" align="start">
                  <div className="card mb-0 border-0 shadow-none">
                    <div className="card-header">
                      <h4 className="text-base font-semibold m-0">CRM</h4>
                    </div>
                    <div className="card-body pb-2">
                      <div className="grid grid-cols-2 gap-3">
                        {CRM_LINKS.map((link) => (
                          <Link key={link.href} href={link.href} className="crm-link">
                            <span className="flex items-center gap-2">
                              <link.icon size={16} />
                              {link.title}
                            </span>
                            <IconArrowRight size={14} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

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
                      {HORIZONTAL_NAV.map((item) => (
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
                <button className="btn-menubar btnFullscreen" onClick={toggleFullscreen}>
                  {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                </button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <a href="#" className="btn-menubar me-2">
                    <IconLayoutGrid size={18} />
                  </a>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="app-launcher" align="end">
                  {APP_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="app-launcher-item">
                      <link.icon size={18} />
                      {link.title}
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="me-2">
                <Link href="/chat" className="btn-menubar relative">
                  <IconMessage size={18} />
                  <span className="msg-status-dot"></span>
                </Link>
              </div>

              <div className="me-2">
                <Link href="/email" className="btn-menubar">
                  <IconMail size={18} />
                </Link>
              </div>

              <div className="me-2 notification_item">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <a href="#" className="btn-menubar relative me-1" id="notification_popup">
                      <IconBell size={18} />
                      <span className="notification-status-dot"></span>
                    </a>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="notification-dropdown p-4" align="end">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                      <h4 className="text-base font-semibold m-0">Notifications (2)</h4>
                      <div className="flex items-center gap-3">
                        <button className="text-sm text-primary bg-transparent border-0 cursor-pointer">
                          Mark all as read
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-xs text-foreground bg-transparent border-0 cursor-pointer flex items-center gap-1">
                              Today <IconChevronDown size={12} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>This Week</DropdownMenuItem>
                            <DropdownMenuItem>Last Week</DropdownMenuItem>
                            <DropdownMenuItem>Last Month</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="noti-content">
                      <div className="flex flex-col">
                        <div className="border-b border-border mb-3 pb-3">
                          <a href="#" className="flex no-underline">
                            <Avatar className="w-10 h-10 mr-2 flex-shrink-0">
                              <AvatarImage src="" alt="Profile" />
                              <AvatarFallback className="text-xs">SH</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="m-0 mb-1 text-sm text-foreground">
                                <span className="font-semibold">Shawn</span> performance in Math is below the threshold.
                              </p>
                              <span className="text-xs text-muted-foreground">Just Now</span>
                            </div>
                          </a>
                        </div>
                        <div className="border-b border-border mb-3 pb-3">
                          <a href="#" className="flex no-underline pb-0">
                            <Avatar className="w-10 h-10 mr-2 flex-shrink-0">
                              <AvatarImage src="" alt="Profile" />
                              <AvatarFallback className="text-xs">SV</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="m-0 mb-1 text-sm text-foreground">
                                <span className="font-semibold">Sylvia</span> added appointment on 02:00 PM
                              </p>
                              <span className="text-xs text-muted-foreground">10 mins ago</span>
                              <div className="flex gap-2 mt-2">
                                <span className="px-3 py-1 rounded text-xs cursor-pointer bg-muted">Deny</span>
                                <span className="px-3 py-1 rounded text-xs cursor-pointer bg-primary text-primary-foreground">
                                  Approve
                                </span>
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <a
                        href="#"
                        className="flex-1 py-2 rounded border border-border bg-muted text-sm text-center no-underline text-foreground"
                      >
                        Cancel
                      </a>
                      <a
                        href="/activity"
                        className="flex-1 py-2 rounded border-0 bg-primary text-primary-foreground text-sm text-center no-underline"
                      >
                        View All
                      </a>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
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
