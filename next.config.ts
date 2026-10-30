import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs/config";

const withSerwist = withSerwistInit({
  // Note: This is only an option in the webpack plugin. In the Vite plugin,
  // you can pass `process.env.NODE_ENV === "production"` instead.
  disable: process.env.NODE_ENV === "development",
  // Note: This is an option that only works with the webpack plugin.
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  register: true,
  // Keep the unlocked workspace and let its sync engine handle reconnection.
  reloadOnOnline: false,
  // A fallback URL alone does not precache its HTML. Refresh this public shell
  // on every build so its chunk references match the deployed assets.
  manifestTransforms: [async (entries) => ({
    manifest: [...entries, { url: "/offline", revision: new Date().toISOString(), size: 0 }],
    warnings: [],
  })],
});

// Legacy workspace URLs 301 to their Paper (Abide IA) replacements. Specific
// routes come before their dynamic wildcards; Next matches in array order.
const legacyRedirects = [
  { source: "/dashboard", destination: "/home", permanent: true },
  { source: "/members/families/:id", destination: "/people/families/:id", permanent: true },
  { source: "/members/families", destination: "/people/families", permanent: true },
  { source: "/members/import", destination: "/people/members/import", permanent: true },
  { source: "/members/new", destination: "/people/members/new", permanent: true },
  { source: "/members/:id", destination: "/people/members/:id", permanent: true },
  { source: "/members", destination: "/people/members", permanent: true },
  { source: "/visitors/import", destination: "/people/visitors/import", permanent: true },
  { source: "/visitors/follow-up", destination: "/people/visitors/follow-up", permanent: true },
  { source: "/visitors/new", destination: "/people/visitors", permanent: true },
  { source: "/visitors/:id", destination: "/people/visitors/:id", permanent: true },
  { source: "/visitors", destination: "/people/visitors", permanent: true },
  { source: "/pastoral/risk-scores", destination: "/people/pastoral/risk", permanent: true },
  { source: "/pastoral/life-events", destination: "/people/pastoral/life-events", permanent: true },
  { source: "/pastoral/engagement", destination: "/people/pastoral/engagement", permanent: true },
  { source: "/pastoral", destination: "/people/pastoral", permanent: true },
  { source: "/departments/cell-groups/:id", destination: "/gatherings/groups/cell/:id", permanent: true },
  { source: "/departments/cell-groups", destination: "/gatherings/groups/cell", permanent: true },
  { source: "/departments/:id", destination: "/gatherings/groups/:id", permanent: true },
  { source: "/departments", destination: "/gatherings/groups", permanent: true },
  { source: "/events/list", destination: "/gatherings/events", permanent: true },
  { source: "/events/new", destination: "/gatherings/events/new", permanent: true },
  { source: "/events/check-in", destination: "/gatherings/events/check-in", permanent: true },
  { source: "/events/registrations", destination: "/gatherings/events/registrations", permanent: true },
  { source: "/events/management", destination: "/gatherings/events/tickets", permanent: true },
  { source: "/events/:id/tiers", destination: "/gatherings/events/tiers", permanent: true },
  { source: "/events/:id/edit", destination: "/gatherings/events/:id/edit", permanent: true },
  { source: "/events/:id", destination: "/gatherings/events/:id", permanent: true },
  { source: "/events", destination: "/gatherings/events", permanent: true },
  { source: "/attendance/check-in", destination: "/gatherings/attendance/check-in", permanent: true },
  { source: "/attendance/services/:id", destination: "/gatherings/attendance/services/:id", permanent: true },
  { source: "/attendance/services", destination: "/gatherings/attendance/services", permanent: true },
  { source: "/attendance/records", destination: "/gatherings/attendance/records", permanent: true },
  { source: "/attendance/reports", destination: "/gatherings/attendance/reports", permanent: true },
  { source: "/attendance", destination: "/gatherings/attendance", permanent: true },
  { source: "/communication/inbox", destination: "/connect/inbox", permanent: true },
  { source: "/communication/templates", destination: "/connect/templates", permanent: true },
  { source: "/communication/broadcasts/new", destination: "/connect/broadcasts", permanent: true },
  { source: "/communication/broadcasts", destination: "/connect/broadcasts", permanent: true },
  { source: "/communication/messages", destination: "/connect/messages", permanent: true },
  { source: "/communication", destination: "/connect/inbox", permanent: true },
  { source: "/appointments", destination: "/connect/appointments", permanent: true },
  { source: "/sermons/new", destination: "/library/sermons/new", permanent: true },
  { source: "/sermons/series", destination: "/library/sermons/series", permanent: true },
  { source: "/sermons/speakers", destination: "/library/sermons/speakers", permanent: true },
  { source: "/sermons/:id/edit", destination: "/library/sermons/:id/edit", permanent: true },
  { source: "/sermons/:id", destination: "/library/sermons/:id", permanent: true },
  { source: "/sermons", destination: "/library/sermons", permanent: true },
  { source: "/media/upload", destination: "/library/media", permanent: true },
  { source: "/media/folders", destination: "/library/media/folders", permanent: true },
  { source: "/media", destination: "/library/media", permanent: true },
  { source: "/forms/new", destination: "/library/forms/new", permanent: true },
  { source: "/forms/submissions", destination: "/library/forms/submissions", permanent: true },
  { source: "/forms/:id/edit", destination: "/library/forms/:id/edit", permanent: true },
  { source: "/forms/:id/fill", destination: "/library/forms/:id/fill", permanent: true },
  { source: "/forms/:id", destination: "/library/forms/:id", permanent: true },
  { source: "/forms", destination: "/library/forms", permanent: true },
  { source: "/giving/records", destination: "/giving/donations", permanent: true },
  { source: "/giving/categories", destination: "/giving/funds", permanent: true },
  { source: "/giving/recurring", destination: "/giving/schedules", permanent: true },
  { source: "/giving/reports", destination: "/giving/statements", permanent: true },
  { source: "/giving", destination: "/giving/overview", permanent: true },
  { source: "/analytics/giving", destination: "/insights/analytics/giving", permanent: true },
  { source: "/analytics/attendance", destination: "/insights/analytics/attendance", permanent: true },
  { source: "/analytics/members", destination: "/insights/analytics/members", permanent: true },
  { source: "/analytics", destination: "/insights/analytics", permanent: true },
  { source: "/reports", destination: "/insights/reports", permanent: true },
  { source: "/assets/new", destination: "/operations/assets/new", permanent: true },
  { source: "/assets/categories", destination: "/operations/assets/categories", permanent: true },
  { source: "/assets/maintenance", destination: "/operations/assets/maintenance", permanent: true },
  { source: "/assets/loans", destination: "/operations/assets/loans", permanent: true },
  { source: "/assets/:id/edit", destination: "/operations/assets/:id/edit", permanent: true },
  { source: "/assets/:id", destination: "/operations/assets/:id", permanent: true },
  { source: "/assets", destination: "/operations/assets", permanent: true },
  { source: "/admin/settings", destination: "/admin/church", permanent: true },
  { source: "/admin/users/:id", destination: "/admin/team/:id", permanent: true },
  { source: "/admin/users", destination: "/admin/team", permanent: true },
  { source: "/admin/roles/:name", destination: "/admin/permissions/:name", permanent: true },
  { source: "/admin/roles", destination: "/admin/permissions", permanent: true },
  { source: "/admin/branches/:id", destination: "/admin/locations/:id", permanent: true },
  { source: "/admin/branches", destination: "/admin/locations", permanent: true },
  { source: "/admin/integrations", destination: "/admin/channels", permanent: true },
  { source: "/profile", destination: "/settings/profile", permanent: true },
];

const nextConfig: NextConfig = withSerwist({
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async redirects() {
    return legacyRedirects;
  },
});

// Sentry must wrap outermost. Build-time instrumentation + source map upload
// are applied here; runtime SDKs are initialized in src/instrumentation*.ts.
// org/project/authToken are read from env so the build stays green without them
// (source map upload is simply skipped until SENTRY_AUTH_TOKEN is provided).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print upload/log info in CI.
  silent: !process.env.CI,

  // Keep source maps out of the browser; Sentry uploads them and strips the
  // <sourceMappingURL> refs from browser bundles (and removes them after upload)
  // so they are only used for readable stack traces in the Sentry dashboard.
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Auto-instrument App Router pages/components + middleware, and tree-shake
  // Sentry's debug logging from the production bundle.
  webpack: {
    autoInstrumentAppDirectory: true,
    autoInstrumentMiddleware: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
