"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, KeyRound, LogOut, UserX, UserCheck, ShieldCheck } from "lucide-react";
import type { UserProfile } from "@/hooks/use-users";
import { getRoleLabel } from "@/hooks/use-users";
import { format } from "date-fns";

interface UserActionsCellProps {
  user: UserProfile;
  onEditRole: (user: UserProfile) => void;
  onDeactivate: (user: UserProfile) => void;
  onReactivate: (user: UserProfile) => void;
  onResetPassword: (user: UserProfile) => void;
  onForceSignout: (user: UserProfile) => void;
}

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

export function UserActionsCell({
  user,
  onEditRole,
  onDeactivate,
  onReactivate,
  onResetPassword,
  onForceSignout,
}: UserActionsCellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEditRole(user)}>
          <Shield className="mr-2 h-4 w-4" />
          Change Role
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPassword(user)}>
          <KeyRound className="mr-2 h-4 w-4" />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForceSignout(user)}>
          <LogOut className="mr-2 h-4 w-4" />
          Force Sign Out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.status === "active" ? (
          <DropdownMenuItem onClick={() => onDeactivate(user)} variant="destructive">
            <UserX className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onReactivate(user)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Activate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
        <div className="flex items-center gap-1.5">
          <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
          {user.mfaEnabled && (
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          )}
        </div>
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
