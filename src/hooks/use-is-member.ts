"use client";

/**
 * @file Identifies member-facing access from the current permission set.
 *
 * The dedicated members:own:read permission marks member-facing presentation
 * for documentation presentation. Broader member-directory grants take
 * precedence; operational surfaces check their own action permissions.
 */

import { usePermissions } from "@/hooks/use-permissions";

export function useIsMember(): { isMember: boolean } {
  const { canAny } = usePermissions();
  const isMember = canAny("members:own:read") && !canAny("members:all:read");
  return { isMember };
}

/**
 * Whether the viewer is treated like a member for the tickets surface.
 * Cell group leaders and department heads are deliberately included: their
 * ticket flow (list + self-claim) is identical to a member's, so the page
 * title and claim dialog should behave the same for both.
 */
export function useIsTicketMember(): { isTicketMember: boolean } {
  const { canAny } = usePermissions();
  const isTicketMember = canAny("members:own:read") && !canAny("events:ticket-records:read", "events:tickets:create");
  return { isTicketMember };
}
