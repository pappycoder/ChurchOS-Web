import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

export function register() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    // Only capture in production (or when explicitly enabled) — dev stays quiet,
    // but a real DSN set for a prod build will light up as expected.
    enabled:
      process.env.NODE_ENV === "production" || process.env.SENTRY_DEBUG === "1",
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ||
      process.env.NODE_ENV ||
      "production",
    // Release/commit tracking — set a fixed release from env when available.
    release: process.env.SENTRY_RELEASE || undefined,

    // Tracing — low sample rate to keep volume/cost down.
    tracesSampleRate: 0.1,

    // Session Replay — enabled per-project request. Metadata is masked by
    // default to avoid capturing sensitive member/visitor details.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.2,
    integrations: [Sentry.replayIntegration()],

    // Privacy: never send the raw text/inputs or media to Sentry.
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
      }
      return event;
    },
  });
}

// Instrument client-side route navigations as Sentry spans/transactions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
