import * as Sentry from "@sentry/nextjs";

/**
 * Reports a failed React Query fetch to Sentry from a page's local error
 * state (pages that render their own "Failed to load …" UI instead of
 * throwing to the dashboard `error.tsx` boundary never reach Sentry
 * otherwise — that gap hid the media library failure).
 *
 * `src/lib/api.ts` throws plain `AuthError` objects (`{ message, statusCode }`)
 * rather than `Error` instances, so the value is normalized into a real
 * `Error` first — Sentry event grouping and stack traces only work with
 * genuine Errors.
 *
 * Returns the Sentry event id.
 */
export function reportQueryError(error: unknown, surface: string): string {
  let normalized: Error;
  let statusCode: number | undefined;

  if (error instanceof Error) {
    normalized = error;
    statusCode = (error as Error & { statusCode?: number }).statusCode;
  } else {
    const partial = (error ?? {}) as { message?: string; statusCode?: number };
    statusCode = partial.statusCode;
    normalized = new Error(
      partial.statusCode !== undefined
        ? `${partial.message ?? "Request failed"} (status ${partial.statusCode})`
        : (partial.message ?? "Request failed")
    );
  }

  return Sentry.captureException(normalized, {
    tags: { surface },
    ...(statusCode !== undefined ? { extra: { statusCode } } : {}),
  });
}
