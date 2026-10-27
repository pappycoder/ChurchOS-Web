"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
import { api } from "@/lib/api";
import { getRoleLabel, VALID_ROLES } from "@/hooks/use-users";

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface RoleWithPermissions {
  roleName: string;
  /** Human-friendly display name (custom roles); null falls back to the dictionary. */
  label?: string | null;
  description: string | null;
  permissions: Permission[];
  /** Whether the role's permissions were customized by this church (templates only). */
  isCustomized: boolean;
  /** Whether the role is owned by this church rather than a global template. */
  isChurchOwned?: boolean;
  defaultPermissionIds?: string[];
}

export interface CreateRoleInput {
  label: string;
  description?: string;
}

export interface RolesSummaryResponse {
  roles: RoleWithPermissions[];
}

export const PERMISSION_ACTIONS = ["create", "read", "update", "delete", "view"] as const;

export const ROLE_ORDER = [
  "church_admin",
  "senior_pastor",
  "branch_pastor",
  "secretary",
  "treasurer",
  "usher",
  "department_head",
  "cell_leader",
] as const;

/** Permissions church_admin must always retain (mirrors backend REQUIRED_ADMIN_PERMISSIONS). */
export const PROTECTED_ADMIN_PERMISSIONS = [
  "members:create",
  "members:read",
  "members:update",
  "members:delete",
  "profiles:create",
  "profiles:read",
  "profiles:update",
  "profiles:delete",
  "church:read",
  "church:update",
];

export function getResourceLabel(resource: string): string {
  return resource.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function sortRolesByOrder<T extends { roleName: string }>(roles: T[]): T[] {
  return roles.filter((role) => !["super_admin", "member"].includes(role.roleName)).sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.roleName as (typeof ROLE_ORDER)[number]);
    const bi = ROLE_ORDER.indexOf(b.roleName as (typeof ROLE_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function useRolesSummary() {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["roles-summary"],
    enabled: can("roles", "read"),
    queryFn: ({ signal }) => api.get<RolesSummaryResponse>("/church/roles", { signal }),
    staleTime: 60 * 1000,
  });
}

/**
 * Builds a roleName → display-label map from the roles summary so any
 * surface rendering role names (user badges, chips, CSV export) shows
 * custom-role labels instead of slugs. Falls back to the seeded dictionary.
 */
export function useRoleLabelMap(): Map<string, string> {
  const { data } = useRolesSummary();
  return React.useMemo(() => {
    const map = new Map<string, string>();
    for (const r of data?.roles ?? []) {
      map.set(r.roleName, r.label || getRoleLabel(r.roleName));
    }
    return map;
  }, [data]);
}

/** Resolves a display label using an optional label map, then the dictionary. */
export function resolveRoleLabel(
  roleName: string,
  labels?: Map<string, string>
): string {
  return labels?.get(roleName) ?? getRoleLabel(roleName);
}

/**
 * All roles that can be assigned in pickers and filters: the 8 seeded church staff roles
 * plus every church-owned custom role, each with its display label.
 */
export function useAssignableRoles(currentRoles: readonly string[] = []): { value: string; label: string }[] {
  const { data } = useRolesSummary();
  const { data: profile } = useCurrentProfile();
  const extendedRoles = profile?.planFeatures?.includes("staff_roles") === true;
  const customRoles = profile?.planFeatures?.includes("custom_roles") === true;
  const retainAdmin = currentRoles.includes("church_admin");
  return React.useMemo(() => {
    const custom = (data?.roles ?? [])
      .filter((r) => r.isChurchOwned && !["member", "super_admin"].includes(r.roleName))
      .map((r) => ({ value: r.roleName, label: r.label || getRoleLabel(r.roleName) }));
    const seen = new Set<string>(VALID_ROLES.map((r) => r.value));
    const builtIn = extendedRoles ? VALID_ROLES : VALID_ROLES.filter(role =>
      ["senior_pastor", "branch_pastor", "secretary"].includes(role.value) || (retainAdmin && role.value === "church_admin")
    );
    return [...builtIn, ...(customRoles ? custom.filter((c) => !seen.has(c.value)) : [])];
  }, [data, extendedRoles, customRoles, retainAdmin]);
}

export function useRolePermissions(roleName: string) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["role-permissions", roleName],
    queryFn: ({ signal }) =>
      api.get<RoleWithPermissions>(
        `/church/roles/${encodeURIComponent(roleName)}/permissions`, { signal }
      ),
    enabled: !!roleName && can("roles", "read"),
  });
}

export function useAllPermissions() {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["all-permissions"],
    enabled: can("roles", "read"),
    queryFn: ({ signal }) => api.get<Permission[]>("/church/roles/all", { signal }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Creates a church-owned custom role. The backend slugifies the label into
 * a snake_case role name and rejects reserved/duplicate names with a 409.
 */
export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) =>
      api.post<RoleWithPermissions>("/church/roles", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-summary"] });
    },
  });
}

function invalidateRoleQueries(queryClient: ReturnType<typeof useQueryClient>, roleName: string) {
  queryClient.invalidateQueries({ queryKey: ["roles-summary"] });
  queryClient.invalidateQueries({ queryKey: ["role-permissions", roleName] });
}

/**
 * Saves the full set of church-level permission overrides for a role.
 * Overrides are additive on top of the role's global defaults — permissions
 * that are global defaults cannot be revoked here.
 */
export function useSetRolePermissions(roleName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissionIds: string[]) =>
      api.put<RoleWithPermissions>(
        `/church/roles/${encodeURIComponent(roleName)}/permissions`,
        { permissionIds }
      ),
    onSuccess: () => invalidateRoleQueries(queryClient, roleName),
  });
}

/** Deletes all church-level overrides for a role, restoring global defaults. */
export function useResetRoleToDefaults(roleName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<RoleWithPermissions>(
        `/church/roles/${encodeURIComponent(roleName)}/reset`
      ),
    onSuccess: () => invalidateRoleQueries(queryClient, roleName),
  });
}

export { getRoleLabel };
