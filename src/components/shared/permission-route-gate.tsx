"use client";

/**
 * Mounted once inside the dashboard layout: resolves the current route's
 * view rule and blocks the page body when the user lacks access.
 * Unmapped routes pass straight through; loading shows a skeleton.
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  usePermissions,
} from "@/hooks/use-permissions";
import {
  checkRule,
  matchRoutePermission,
} from "@/lib/route-permissions";

export function PermissionRouteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, can, hasRole } = usePermissions();

  const rule = matchRoutePermission(pathname);
  const allowed = !ready
    ? null
    : checkRule(rule, (name) => {
        const [resource, action] = name.split(":");
        return can(resource, action as Parameters<typeof can>[1]);
      }, hasRole);

  if (!ready) {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon={<ShieldAlert className="h-12 w-12" />}
          title="Access denied"
          description="You don't have permission to view this page. Contact your church admin if you believe this is a mistake."
        />
      </div>
    );
  }

  return <>{children}</>;
}
