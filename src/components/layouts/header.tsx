"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/contexts/sidebar-context";
import {
  Bell,
  Settings,
  LogOut,
  User,
  MessageSquare,
  Maximize,
  Minimize,
  Mail,
  MoreVertical,
  ArrowLeftToLine,
} from "lucide-react";

export function Header() {
  const router = useRouter();
  const { collapsed, toggleCollapse, mobileOpen, openMobile, closeMobile } = useSidebar();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleLogout = async () => {
    router.push("/login");
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

        {/* Mobile hamburger — SIBLING of header-left, not child */}
        <a id="mobile_btn" className="mobile_btn" href="#sidebar" onClick={handleMobileToggle}>
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </a>

        {/* header-user with display:contents — flattens to main-header children */}
        <div className="header-user">
          <div className="nav user-menu nav-list">

            {/* LEFT-ALIGNED group: toggle, search, settings */}
            <div className="me-auto" id="header-search">
              <a
                id="toggle_btn"
                href="#"
                className="btn-menubar me-2"
                onClick={(e) => {
                  e.preventDefault();
                  toggleCollapse();
                }}
              >
                <ArrowLeftToLine
                  style={{
                    transform: collapsed ? "rotate(180deg)" : "none",
                    transition: "transform 0.3s",
                  }}
                />
              </a>

              <div className="input-group input-group-flat d-inline-flex me-2">
                <input type="text" className="form-control" placeholder="Search in ChurchOS" />
                <span className="input-group-text">
                  <kbd>CTRL + /</kbd>
                </span>
              </div>

              <Link href="/admin/settings" className="btn-menubar">
                <Settings />
              </Link>
            </div>

            {/* RIGHT-ALIGNED group: fullscreen, chat, email, bell, profile */}
            <div className="d-flex align-items-center">
              <div className="me-2">
                <button className="btn-menubar btnFullscreen" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize /> : <Maximize />}
                </button>
              </div>

              <div className="me-2">
                <Link href="/chat" className="btn-menubar position-relative">
                  <MessageSquare />
                  <span className="msg-status-dot"></span>
                </Link>
              </div>

              <div className="me-2">
                <Link href="/email" className="btn-menubar">
                  <Mail />
                </Link>
              </div>

              <div className="me-2 notification_item">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <a href="#" className="btn-menubar position-relative me-1" id="notification_popup">
                      <Bell />
                      <span className="notification-status-dot"></span>
                    </a>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="notification-dropdown p-4" align="end">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 12 }}>
                      <h4 style={{ fontSize: 16, margin: 0 }}>Notifications (2)</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button style={{ fontSize: 13, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>
                          Mark all as read
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button style={{ fontSize: 12, color: "var(--foreground)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                              Today ▼
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
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 12, paddingBottom: 12 }}>
                          <a href="#" style={{ display: "flex", textDecoration: "none" }}>
                            <Avatar style={{ width: 40, height: 40, marginRight: 8, flexShrink: 0 }}>
                              <AvatarImage src="" alt="Profile" />
                              <AvatarFallback style={{ fontSize: 12 }}>SH</AvatarFallback>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: "0 0 4px 0", fontSize: 13, color: "var(--foreground)" }}>
                                <span style={{ fontWeight: 600 }}>Shawn</span> performance in Math is below the threshold.
                              </p>
                              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Just Now</span>
                            </div>
                          </a>
                        </div>
                        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 12, paddingBottom: 12 }}>
                          <a href="#" style={{ display: "flex", textDecoration: "none", paddingBottom: 0 }}>
                            <Avatar style={{ width: 40, height: 40, marginRight: 8, flexShrink: 0 }}>
                              <AvatarImage src="" alt="Profile" />
                              <AvatarFallback style={{ fontSize: 12 }}>SV</AvatarFallback>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: "0 0 4px 0", fontSize: 13, color: "var(--foreground)" }}>
                                <span style={{ fontWeight: 600 }}>Sylvia</span> added appointment on 02:00 PM
                              </p>
                              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>10 mins ago</span>
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <span style={{ padding: "4px 12px", borderRadius: 4, background: "#F3F4F6", fontSize: 12, cursor: "pointer" }}>Deny</span>
                                <span style={{ padding: "4px 12px", borderRadius: 4, background: "var(--primary)", color: "#fff", fontSize: 12, cursor: "pointer" }}>Approve</span>
                              </div>
                            </div>
                          </a>
                        </div>
                        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 12, paddingBottom: 12 }}>
                          <a href="#" style={{ display: "flex", textDecoration: "none" }}>
                            <Avatar style={{ width: 40, height: 40, marginRight: 8, flexShrink: 0 }}>
                              <AvatarImage src="" alt="Profile" />
                              <AvatarFallback style={{ fontSize: 12 }}>GR</AvatarFallback>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: "0 0 4px 0", fontSize: 13, color: "var(--foreground)" }}>
                                New student record <span style={{ fontWeight: 600 }}>George</span> is created by <span style={{ fontWeight: 600 }}>Teressa</span>
                              </p>
                              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>2 hrs ago</span>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
                      <a href="#" style={{ flex: 1, padding: "8px 0", borderRadius: 4, border: "1px solid var(--border)", background: "#F3F4F6", fontSize: 13, textAlign: "center", textDecoration: "none", color: "var(--foreground)" }}>Cancel</a>
                      <a href="/activity" style={{ flex: 1, padding: "8px 0", borderRadius: 4, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, textAlign: "center", textDecoration: "none" }}>View All</a>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="dropdown profile-dropdown">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <a href="#" className="dropdown-toggle d-flex align-items-center">
                      <span className="avatar avatar-md online">
                        <Avatar style={{ width: 36, height: 36, border: "2px solid var(--border)" }}>
                          <AvatarImage src="" alt="User" />
                          <AvatarFallback style={{ fontSize: 12, fontWeight: 600 }}>AD</AvatarFallback>
                        </Avatar>
                      </span>
                    </a>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="dropdown-menu shadow-none" align="end" style={{ minWidth: 240 }}>
                    <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span className="avatar avatar-lg me-2 avatar-rounded">
                          <Avatar style={{ width: 44, height: 44 }}>
                            <AvatarImage src="" alt="User" />
                            <AvatarFallback style={{ fontSize: 14, fontWeight: 600 }}>AD</AvatarFallback>
                          </Avatar>
                        </span>
                        <div>
                          <h5 style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>Admin User</h5>
                          <p style={{ color: "var(--muted-foreground)", margin: 0, fontSize: 12, fontWeight: 500 }}>admin@church.com</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "8px 16px" }}>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, color: "var(--foreground)", textDecoration: "none" }}>
                          <User size={16} /> My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/settings" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, color: "var(--foreground)", textDecoration: "none" }}>
                          <Settings size={16} /> Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/account" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, color: "var(--foreground)", textDecoration: "none" }}>
                          <User size={16} /> My Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/knowledge-base" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, color: "var(--foreground)", textDecoration: "none" }}>
                          <Settings size={16} /> Knowledge Base
                        </Link>
                      </DropdownMenuItem>
                    </div>
                    <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)" }}>
                      <DropdownMenuItem onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, color: "#E70D0D", cursor: "pointer" }}>
                        <LogOut size={16} /> Logout
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile 3-dot menu */}
              <div className="mobile-user-menu">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <a href="#" style={{ color: "var(--foreground)", fontSize: 20 }}>
                      <MoreVertical />
                    </a>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" style={{ minWidth: 200, top: 44, right: 20 }}>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, textDecoration: "none" }}>
                        <User size={16} /> My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, textDecoration: "none" }}>
                        <Settings size={16} /> Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, color: "#E70D0D", cursor: "pointer" }}>
                      <LogOut size={16} /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
