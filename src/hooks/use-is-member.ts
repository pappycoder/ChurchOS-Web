"use client";

/**
 * @file Identifies ticket presentation from the current permission set.
 *
 * Documentation is now public and has no member-role presentation branch.
 * Ticket surfaces continue to check their own action permissions.
 */

import { usePermissions } from "@/hooks/use-permissions";

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
