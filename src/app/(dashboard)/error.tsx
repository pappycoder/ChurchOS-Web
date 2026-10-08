"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

/**
 * Transient asset-loading failures (a stale service-worker-cached chunk after
 * a deploy) only heal with a fresh document — a plain re-render re-requests
 * the same missing module. Everything else retries via `reset()` first.
 */
const CHUNK_ERROR_RE =
  /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

/** Absolute cap on auto-recovery attempts per route per session, so a digest
 *  that changes on every server error can't loop forever. */
const MAX_AUTO_ATTEMPTS = 3;

function fingerprint(error: Error & { digest?: string }): string {
  return error.digest || error.message || "unknown-error";
}

function seenKey(pathname: string, fp: string): string {
  return `churchos-error-recovered:${pathname}:${fp}`;
}

function attemptsKey(pathname: string): string {
  return `churchos-error-attempts:${pathname}`;
}

function sessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode) — recovery still runs, just unguarded
    // across reloads; the per-route attempt cap keeps it bounded.
  }
}

function pathAttempts(pathname: string): number {
  return Number(sessionGet(attemptsKey(pathname)) ?? "0") || 0;
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // True once auto-recovery is unavailable for this error (already attempted
  // or the per-route cap is exhausted) — the card becomes fully interactive.
  const [settled, setSettled] = React.useState(false);
  const lastAttempted = React.useRef<string | null>(null);
  const timerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  React.useEffect(() => {
    const pathname = window.location.pathname;
    const fp = fingerprint(error);

    // The error object can be re-created with identical content on re-renders;
    // only the first sighting of each distinct error schedules recovery.
    if (lastAttempted.current === fp) return;
    lastAttempted.current = fp;

    if (sessionGet(seenKey(pathname, fp)) || pathAttempts(pathname) >= MAX_AUTO_ATTEMPTS) {
      setSettled(true);
      return;
    }
    sessionSet(seenKey(pathname, fp), "1");
    sessionSet(attemptsKey(pathname), String(pathAttempts(pathname) + 1));

    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    setSettled(false);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      // A newer error superseded this attempt while it was pending.
      if (lastAttempted.current !== fp) return;
      if (CHUNK_ERROR_RE.test(error.message ?? "")) {
        window.location.reload();
      } else {
        reset();
      }
    }, 1000);
    // No per-run cleanup: a re-created-but-equal `error` must not cancel an
    // in-flight attempt (the ref guard makes a duplicate schedule impossible).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Cancel a pending attempt when the boundary unmounts (recovered, or the
  // user navigated away) so it can't fire a stray reset/reload afterwards.
  React.useEffect(() => {
    return () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, []);

  const cancelPendingAttempt = () => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setSettled(true);
  };

  const handleRetry = () => {
    cancelPendingAttempt();
    reset();
  };

  const handleReload = () => {
    cancelPendingAttempt();
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="max-w-md w-full rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {settled
            ? "We couldn't recover automatically. Try again, or reload the page."
            : "Trying to recover\u2026"}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button onClick={handleRetry}>Try again</Button>
          <Button variant="outline" onClick={handleReload}>
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}
