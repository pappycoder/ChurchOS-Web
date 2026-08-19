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
  ChevronLeft,
  MessageSquare,
} from "lucide-react";

export function Header() {
  const router = useRouter();
  const { collapsed, toggleCollapse, mobileOpen, openMobile, closeMobile } = useSidebar();

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

  return (
    <header className="header">
      <div className="main-header">
        <div className="header-left">
          <a href="#" className="mobile_btn" onClick={handleMobileToggle}>
            <span className="bar-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </a>
        </div>

        <div className="header-user">
          <div className="user-menu">
            <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <a
                id="toggle_btn"
                href="#"
                className="btn-menubar"
                onClick={(e) => {
                  e.preventDefault();
                  toggleCollapse();
                }}
              >
                <ChevronLeft
                  style={{
                    transform: collapsed ? "rotate(180deg)" : "none",
                    transition: "transform 0.3s",
                  }}
                />
              </a>

              <div className="input-group">
                <input type="text" className="form-control" placeholder="Search in ChurchOS" />
                <span className="input-group-text">
                  <kbd style={{ fontSize: 11 }}>CTRL + /</kbd>
                </span>
              </div>

              <Link href="/admin/settings" className="btn-menubar">
                <Settings />
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ marginRight: 4 }}>
                <Link href="/chat" className="btn-menubar" style={{ position: "relative" }}>
                  <MessageSquare />
                  <span className="msg-status-dot"></span>
                </Link>
              </div>

              <div style={{ marginRight: 4, position: "relative" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="btn-menubar" style={{ position: "relative" }}>
                      <Bell />
                      <span className="notification-status-dot"></span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="notification-dropdown" align="end">
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 12 }}>
                        <h5 style={{ fontSize: 16, margin: 0 }}>Notifications</h5>
                        <button className="btn-menubar" style={{ fontSize: 12, color: "var(--primary)" }}>
                          Mark all as read
                        </button>
                      </div>
                      <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        <div style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                          <p style={{ fontSize: 13, margin: 0, color: "var(--foreground)" }}>
                            <strong>Welcome</strong> to ChurchOS Admin Dashboard
                          </p>
                          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Just now</span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="btn-menubar" style={{ padding: 0, width: "auto" }}>
                    <Avatar style={{ width: 36, height: 36, border: "2px solid var(--border)" }}>
                      <AvatarImage src="" alt="User" />
                      <AvatarFallback style={{ fontSize: 12, fontWeight: 600 }}>AD</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="profile-dropdown" align="end" style={{ minWidth: 240 }}>
                  <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar style={{ width: 44, height: 44 }}>
                        <AvatarImage src="" alt="User" />
                        <AvatarFallback style={{ fontSize: 14, fontWeight: 600 }}>AD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>Admin User</p>
                        <p style={{ color: "var(--muted-foreground)", margin: 0, fontSize: 12 }}>admin@church.com</p>
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
                  </div>
                  <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)" }}>
                    <DropdownMenuItem onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 14, color: "var(--destructive)", cursor: "pointer" }}>
                      <LogOut size={16} /> Logout
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
