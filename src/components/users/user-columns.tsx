"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  ShieldCheck,
  ShieldOff,
  MoreHorizontal,
  KeyRound,
  LogOut,
} from "lucide-react";
import type { UserProfile } from "@/hooks/use-users";
import { getRoleLabel } from "@/hooks/use-users";
import { format } from "date-fns";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "super_admin":
    case "senior_pastor":
      return "default";
    case "church_admin":
      return "secondary";
    default:
      return "outline";
  }
}

export function UserCheckboxCell({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(!!v)}
      aria-label="Select row"
    />
  );
}

interface UserActionsCellProps {
  user: UserProfile;
  onEditRole: (user: UserProfile) => void;
  onDeactivate: (user: UserProfile) => void;
  onReactivate: (user: UserProfile) => void;
  onResetPassword: (user: UserProfile) => void;
  onForceSignout: (user: UserProfile) => void;
}

export function UserActionsCell({
  user,
  onEditRole,
  onDeactivate,
  onReactivate,
  onResetPassword,
  onForceSignout,
}: UserActionsCellProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEditRole(user)}
        title="Edit Role"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      {user.status === "active" ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDeactivate(user)}
          title="Deactivate"
        >
          <ShieldOff className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700"
          onClick={() => onReactivate(user)}
          title="Activate"
        >
          <ShieldCheck className="h-4 w-4" />
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onResetPassword(user)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onForceSignout(user)}>
            <LogOut className="mr-2 h-4 w-4" />
            Force Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function UserNameCell({ user }: { user: UserProfile }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
        <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
        {user.email && (
          <p className="text-sm text-muted-foreground">{user.email}</p>
        )}
      </div>
    </div>
  );
}

export function UserRoleCell({ role }: { role: string }) {
  return <Badge variant={getRoleBadgeVariant(role)}>{getRoleLabel(role)}</Badge>;
}

export function UserStatusCell({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <Badge variant={isActive ? "default" : "destructive"}>
      <span
        className={`mr-1 h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export function UserCreatedCell({ createdAt }: { createdAt: string }) {
  return (
    <span className="text-muted-foreground">
      {format(new Date(createdAt), "MMM d, yyyy")}
    </span>
  );
}
