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
  const isMember =
    !!profile?.role?.includes("member") ||
    !!profile?.role?.includes("cell_leader") ||
    !!profile?.role?.includes("department_head");
  return { isMember };
}

/**
 * Whether the viewer is treated like a member for the tickets surface.
 * Cell group leaders and department heads are deliberately included: their
 * ticket flow (list + self-claim) is identical to a member's, so the page
 * title and claim dialog should behave the same for both.
 */
export function useIsTicketMember(): { isTicketMember: boolean } {
  const { data: profile } = useCurrentProfile();
  const isTicketMember =
    !!profile?.role?.includes("member") ||
    !!profile?.role?.includes("cell_leader") ||
    !!profile?.role?.includes("department_head");
  return { isTicketMember };
}
