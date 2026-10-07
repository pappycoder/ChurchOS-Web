"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface RequestError {
  statusCode?: number;
}

/**
 * Global retry policy: 4xx responses are deterministic client-side
 * failures (bad request, forbidden, not found, conflict) — retrying only
 * multiplies traffic against an endpoint that will keep failing the same
 * way. Network drops (statusCode 0) and 5xx get exactly one retry, so a
 * failing request produces at most 2 hits instead of React Query v5's
 * default 4 (1 + 3 retries).
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const statusCode = (error as RequestError | null | undefined)?.statusCode;
  if (
    typeof statusCode === "number" &&
    statusCode >= 400 &&
    statusCode < 500
  ) {
    return false;
  }
  return failureCount < 1;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: shouldRetry,
            retryDelay: 1000,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
