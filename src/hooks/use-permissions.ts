"use client";

/**
 * @file Client-side permission gating derived from the current profile.
 *
 * Permissions are a flat list of `resource:action` strings (e.g. `members:read`)
 * resolved server-side across all held roles and returned on GET /profiles/me.
 * They are collected at login (the login flow primes the ["current-profile"]
 * cache before navigating) and live for the whole tab session; the query
 * refetches on window focus / reconnect so role changes made mid-session are
 * picked up. All checks are fail-closed: until the profile loads, nothing is
 * shown. The backend guards remain the real enforcement layer.
 */

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentProfile } from "@/hooks/use-profile";

export type PermissionAction = "create" | "read" | "update" | "delete";

/** `resource:action` permission name, e.g. "branches:create". */
export type PermissionName = string;

interface PermissionsState {
  /** True once the profile (and therefore permissions/roles) has loaded. */
  ready: boolean;
  permissions: Set<PermissionName>;
  roles: string[];
}

function usePermissionsState(): PermissionsState {
  const { data: profile, isLoading } = useCurrentProfile();

  const permissions = React.useMemo(
    () => new Set(profile?.permissions ?? []),
    [profile?.permissions]
  );
  const roles = React.useMemo(() => profile?.role ?? [], [profile?.role]);

  return { ready: !isLoading && !!profile, permissions, roles };
}

export interface PermissionChecker {
  ready: boolean;
  /** True when the user holds `resource:action`. Fail-closed while loading. */
  can: (resource: string, action: PermissionAction) => boolean;
  /** True when the user holds any of the given permission names. */
  canAny: (...names: PermissionName[]) => boolean;
  /** Any-of role check for nav items without a dedicated permission resource. */
  hasRole: (...roleNames: string[]) => boolean;
}

export function usePermissions(): PermissionChecker {
  const { ready, permissions, roles } = usePermissionsState();

  const can = React.useCallback(
    (resource: string, action: PermissionAction) =>
      permissions.has(`${resource}:${action}`),
    [permissions]
  );

  const canAny = React.useCallback(
    (...names: PermissionName[]) => names.some((n) => permissions.has(n)),
    [permissions]
  );

  const hasRole = React.useCallback(
    (...roleNames: string[]) => roles.some((r) => roleNames.includes(r)),
    [roles]
  );

  return { ready, can, canAny, hasRole };
}

/** Convenience single-check hook: `const allowed = useCan("branches", "update")`. */
export function useCan(
  resource: string,
  action: PermissionAction
): { allowed: boolean; ready: boolean } {
  const { can, ready } = usePermissions();
  return { allowed: can(resource, action), ready };
}

/** Invalidates the profile cache so fresh permissions are fetched immediately. */
export function useRefreshPermissions(): () => void {
  const queryClient = useQueryClient();
  return React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["current-profile"] });
  }, [queryClient]);
}
