"use client";
import Link from "next/link";
import * as React from "react";
import { AppearanceDialog } from "@/components/shared/appearance-dialog";
import {
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings,
  User,
  Palette,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

export function AccountMenu({
  placement = "header",
}: {
  placement?: "header" | "sidebar";
}) {
  const { data: profile } = useCurrentProfile();
  const [appearanceOpen, setAppearanceOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const { logout } = useAuth();
  const { ready, can } = usePermissions();
  const { isMobile } = useSidebar();
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "My account";
  const initials =
    `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";
  const avatar = (
    <Avatar className="size-8 rounded-lg">
      <AvatarImage src={profile?.avatarUrl ?? ""} alt={name} />
      <AvatarFallback className="rounded-lg text-xs text-muted-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
  const summary = (
    <div className="grid flex-1 text-start text-sm leading-tight">
      <span className="truncate font-semibold">{name}</span>
      <span className="truncate text-xs text-muted-foreground [[data-sidebar=sidebar]_&]:text-sidebar-foreground/70">
        {profile?.email || profile?.role?.join(", ").replaceAll("_", " ")}
      </span>
    </div>
  );
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {placement === "sidebar" ? (
          <SidebarMenuButton
            ref={triggerRef}
            size="lg"
            aria-label="Account menu"
          >
            {avatar}
            {summary}
            <ChevronsUpDown className="ms-auto size-4" />
          </SidebarMenuButton>
        ) : (
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            aria-label="Account menu"
            disableTooltip
          >
            {avatar}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64"
        side={placement === "sidebar" && !isMobile ? "right" : "bottom"}
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          {avatar}
          {summary}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setAppearanceOpen(true)}>
          <Palette className="size-4" />
          Appearance
        </DropdownMenuItem>
        {ready && can("church_settings", "update") && (
          <DropdownMenuItem asChild>
            <Link href="/admin/settings">
              <Settings className="size-4" />
              Church settings
            </Link>
          </DropdownMenuItem>
        )}
        {ready &&
          profile?.role.some(
            (role) => role === "church_admin" || role === "super_admin",
          ) &&
          can("billing", "read") && (
            <DropdownMenuItem asChild>
              <Link href="/subscription">
                <CreditCard className="size-4" />
                Plan & Billing
              </Link>
            </DropdownMenuItem>
          )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void logout();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <>
      {placement === "sidebar" ? (
        <SidebarMenu>
          <SidebarMenuItem>{menu}</SidebarMenuItem>
        </SidebarMenu>
      ) : (
        menu
      )}
      <AppearanceDialog
        open={appearanceOpen}
        onOpenChange={setAppearanceOpen}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
