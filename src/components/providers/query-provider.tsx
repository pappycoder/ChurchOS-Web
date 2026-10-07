"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // Exactly one attempt per fetch, ever. React Query v5 defaults
            // to retry:3, so a failing endpoint used to receive 4 requests
            // per fetch (1 + 3 retries) per user — with many concurrent
            // users that amplifies load on an already-struggling backend.
            // Recovery paths: the error state's Retry button, refetch on
            // navigation/remount, and the unread-count polls (which resume
            // as soon as any refetch succeeds).
            retry: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
