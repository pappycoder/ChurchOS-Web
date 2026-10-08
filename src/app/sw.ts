/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig, SerwistPlugin } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Conservative runtime cache for the JSON API: NetworkFirst for GETs under
 * /api/v1 (matches the default `API_BASE + /api/v1` in src/lib/api.ts — a
 * cross-origin dev host or a same-origin prod proxy — by pathname only),
 * falling back to the cache after 10s and keeping only 5 minutes of entries.
 * React Query already holds the in-memory copy; this mostly covers hard
 * refreshes and offline revisits of already-viewed data.
 *
 * NetworkFirst caches every HTTP 200 by default (Serwist's cacheOkAndOpaque
 * plugin only checks the status), so an API failure that still returns
 * `200 + { success: false }` would be cached and replayed on every reload
 * for up to 5 minutes — the media library's "error page until hard refresh"
 * bug. `apiEnvelopePlugin` parses the (cloned) body and only lets a genuine
 * `success: true` JSON envelope into the cache; anything else — error
 * envelopes, non-JSON bodies, non-200s — is fetched but never stored.
 */
const apiEnvelopePlugin: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) => {
    if (response.status !== 200) return null;
    if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
      return null;
    }
    try {
      const body = (await response.clone().json()) as { success?: unknown } | null;
      return body && body.success === true ? response : null;
    } catch {
      return null;
    }
  },
};

const apiCache: RuntimeCaching = {
  matcher: ({ url, request }) =>
    request.method === "GET" && url.pathname.startsWith("/api/v1/"),
  handler: new NetworkFirst({
    cacheName: "churchos-api",
    networkTimeoutSeconds: 10,
    plugins: [
      apiEnvelopePlugin,
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 5 * 60,
      }),
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [apiCache, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

// Purge API entries written by the previous (unguarded) worker version on
// activation — a cached 200-with-error-body would otherwise keep erroring
// until its 5-minute TTL. React Query owns the in-memory copy, so dropping
// this cache costs nothing beyond the next refetch.
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("churchos-api"));
});

serwist.addEventListeners();
