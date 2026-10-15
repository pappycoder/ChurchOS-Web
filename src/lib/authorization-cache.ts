import type { QueryClient } from "@tanstack/react-query";

interface AuthorizationProfile {
  profileId: string;
  churchId: string;
  branchId?: string;
  memberId?: string;
  isAdminHq: boolean;
  permissions?: readonly string[];
}

export function authorizationScopeKey(profile?: AuthorizationProfile): string | null {
  if (!profile) return null;
  return JSON.stringify([profile.profileId, profile.churchId, profile.branchId, profile.memberId,
    profile.isAdminHq, [...(profile.permissions ?? [])].sort()]);
}

/** Stop old-scope requests before clearing cached workspace data. */
export async function resetAuthorizationQueries(queryClient: QueryClient): Promise<void> {
  const filters = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== "current-profile" };
  await queryClient.cancelQueries(filters);
  await queryClient.resetQueries(filters);
}
