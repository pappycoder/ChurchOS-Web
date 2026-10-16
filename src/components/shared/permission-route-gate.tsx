"use client";

/**
 * Mounted once inside the dashboard layout: resolves the current route's
 * view rule and blocks the page body when the user lacks access.
 * Unmapped routes are denied; loading shows a skeleton.
 */

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authorizationScopeKey, resetAuthorizationQueries } from "@/lib/authorization-cache";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { useCurrentProfile } from "@/hooks/use-profile";
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
  const { ready, canAny } = usePermissions();
  const profile = useCurrentProfile();
  const queryClient = useQueryClient();
  const scope = React.useMemo(() => authorizationScopeKey(profile.data), [profile.data]);
  const [appliedScope, setAppliedScope] = React.useState(scope);
  React.useEffect(() => {
    if (!scope || scope === appliedScope) return;
    let active = true;
    async function applyScope() {
      if (appliedScope) await resetAuthorizationQueries(queryClient);
      if (active) setAppliedScope(scope);
    }
    void applyScope();
    return () => { active = false; };
  }, [scope, appliedScope, queryClient]);

  const rule = matchRoutePermission(pathname);
  const allowed = !ready
    ? null
    : checkRule(rule, (name) => canAny(name));

  if (profile.isError) {
    return <ErrorState title="Unable to verify your permissions" onRetry={() => { void profile.refetch(); }} retrying={profile.isFetching} />;
  }

  if (!ready || scope !== appliedScope) {
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
