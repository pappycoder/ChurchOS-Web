"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { listUrl } from "@/lib/export-all";
import { NOTIFICATIONS_LIST_LIMIT } from "@/hooks/use-notifications";
import { fetchMediaFolders } from "@/hooks/use-media";

/**
 * Route-level prefetch: hover/focus on a sidebar or header nav link warms the
 * React Query cache for that destination's first-screen queries, so the page
 * paints instantly on navigation. Each target uses the EXACT queryKey the
 * destination page's hooks request (TanStack v5 hashes object keys sorted and
 * drops `undefined`, so these collapse to the same entries) and fetches the
 * same endpoint. `prefetchQuery` respects the global staleTime, so repeated
 * hovers never duplicate in-flight or still-fresh data.
 */

interface PrefetchTarget {
  key: unknown[];
  load: () => Promise<unknown>;
}

const ROUTE_PREFETCH: Record<string, PrefetchTarget[]> = {
  "/dashboard": [
    {
      key: ["current-profile"],
      load: () => api.get("/profiles/me"),
    },
    {
      key: ["notifications-unread"],
      load: () => api.get("/notifications/unread-count"),
    },
    {
      key: ["notifications", { page: 1, limit: NOTIFICATIONS_LIST_LIMIT, read: "all" }],
      load: () => api.get(listUrl("/notifications", { limit: NOTIFICATIONS_LIST_LIMIT })),
    },
    {
      key: ["audit-my", 8],
      load: () => api.get(listUrl("/audit", { limit: 8 })),
    },
  ],
  "/members": [
    {
      key: ["members-list", { page: 1, limit: 15, sortBy: "first_name", sortOrder: "asc" }],
      load: () =>
        api.get(
          listUrl("/members", {
            page: 1,
            limit: 15,
            sortBy: "first_name",
            sortOrder: "asc",
          }),
        ),
    },
  ],
  "/visitors": [
    {
      key: ["visitors-stats"],
      load: () => api.get("/visitors/stats"),
    },
    {
      key: ["visitors-list", { page: 1, limit: 15, sortBy: "firstName", sortOrder: "asc" }],
      load: () =>
        api.get(
          listUrl("/visitors", {
            page: 1,
            limit: 15,
            sortBy: "firstName",
            sortOrder: "asc",
          }),
        ),
    },
  ],
  "/giving": [
    {
      key: ["giving-summary"],
      load: () => api.get("/giving/transactions/summary"),
    },
    {
      key: ["giving-transactions", { limit: 8 }],
      load: () => api.get(listUrl("/giving/transactions", { limit: 8 })),
    },
  ],
  "/assets": [
    {
      key: ["assets-stats"],
      load: () => api.get("/assets/stats"),
    },
    {
      key: ["assets-list", { page: 1, limit: 15 }],
      load: () => api.get(listUrl("/assets", { page: 1, limit: 15 })),
    },
  ],
  "/media": [
    {
      key: ["media-folders"],
      // IMPORTANT: reuse the hook's query fn so the prefetched cache entry has
      // the exact shape `useMediaFolders` reads (a bare array, not the raw
      // `{ data }` envelope). Using `api.get(...)` here directly previously
      // poisoned the shared key and crashed `/media` with `.map is not a function`.
      load: fetchMediaFolders,
    },
  ],
  "/events": [
    {
      key: ["events-list", { limit: 100, sortBy: "startDate", sortOrder: "asc" }],
      load: () =>
        api.get(
          listUrl("/events", {
            limit: 100,
            sortBy: "startDate",
            sortOrder: "asc",
          }),
        ),
    },
  ],
};

/**
 * Returns a stable handler to call on nav-link hover/focus. Unknown or
 * un-configured routes no-op; prefetch failures are swallowed silently.
 */
export function usePrefetchRoute() {
  const queryClient = useQueryClient();

  return React.useCallback(
    (href?: string) => {
      if (!href) return;
      const targets = ROUTE_PREFETCH[href];
      if (!targets) return;
      for (const target of targets) {
        void queryClient
          .prefetchQuery({ queryKey: target.key, queryFn: target.load })
          .catch(() => undefined);
      }
    },
    [queryClient],
  );
}