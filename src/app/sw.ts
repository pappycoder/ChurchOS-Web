/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
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
 */
const apiCache: RuntimeCaching = {
  matcher: ({ url, request }) =>
    request.method === "GET" && url.pathname.startsWith("/api/v1/"),
  handler: new NetworkFirst({
    cacheName: "churchos-api",
    networkTimeoutSeconds: 10,
    plugins: [
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

serwist.addEventListeners();
