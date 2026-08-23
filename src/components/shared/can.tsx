"use client";

/**
 * Render-gate for permission-controlled UI affordances (buttons, menu items).
 *
 * Usage:
 *   <Can perm="branches:update">
 *     <Button>Edit</Button>
 *   </Can>
 *
 * Fail-closed: renders nothing until permissions have loaded.
 */

import * as React from "react";
import { usePermissions, type PermissionAction } from "@/hooks/use-permissions";

interface CanProps {
  /** `resource:action` name, e.g. "members:create". */
  perm: string;
  /** Or check a resource/action pair directly. */
  resource?: string;
  action?: PermissionAction;
  /** Rendered when the user lacks the permission (defaults to nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ perm, resource, action, fallback = null, children }: CanProps) {
  const { can, ready } = usePermissions();

  if (!ready) return null;
  const allowed = resource && action
    ? can(resource, action)
    : (() => {
        const [res, act] = perm.split(":");
        return can(res, act as PermissionAction);
      })();

  return <>{allowed ? children : fallback}</>;
}
