"use client";

/**
 * @file Refines the member role from the current profile.
 *
 * Members hold the `member` role (which may be their primary or an additional
 * role). The user directive is that a member is a member whether or not they
 * belong to HQ — there is deliberately NO admin-HQ bypass here. This helper is
 * the single source of truth for "should this surface be restricted to
 * non-members" across the header, sidebar, sermons, media and docs.
 */

import { useCurrentProfile } from "@/hooks/use-profile";

export function useIsMember(): { isMember: boolean } {
  const { data: profile } = useCurrentProfile();
  const isMember = !!profile?.role?.includes("member");
  return { isMember };
}
