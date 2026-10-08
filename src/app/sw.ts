/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  RouteMatchCallbackOptions,
  RuntimeCaching,
  SerwistGlobalConfig,
  SerwistPlugin,
} from "serwist";
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

/**
 * Serwist's `defaultCache` matches asset extensions with bare regexes
 * (`/\.(?:jpg|png|...)$/i`) that are NOT origin-scoped, and its last route
 * (`({ sameOrigin }) => !sameOrigin`) caches EVERY cross-origin response. So
 * our media thumbnails on the external storage host
 * (`https://storage.churchos.dev/...`) were being intercepted by the SW; when
 * that host's TLS/fetch failed, the strategy rejected and the browser logged a
 * `no-response` FetchEvent error instead of a normal image error.
 *
 * We scope the extension routes to same-origin (keeping the two explicit
 * Google-Fonts hosts, which are intentionally cross-origin) and drop the
 * blanket cross-origin route. Cross-origin media then bypasses the SW
 * entirely and is fetched natively by the browser — no cache pollution, no
 * synthetic `no-response` failures.
 */
const CROSS_ORIGIN_FONT_HOST = /fonts\.(?:gstatic|googleapis)\.com/;

function matchesCrossOrigin(matcher: RuntimeCaching["matcher"]): boolean {
  if (typeof matcher !== "function") return false;
  try {
    return matcher({
      url: new URL("https://storage.churchos.dev/probe.jpg"),
      sameOrigin: false,
      request: new Request("https://storage.churchos.dev/probe.jpg"),
      event: {} as ExtendableEvent,
    });
  } catch {
    return false;
  }
}

const sameOriginDefaultCache: RuntimeCaching[] = defaultCache
  // Drop the blanket cross-origin NetworkFirst route.
  .filter((route) => !matchesCrossOrigin(route.matcher))
  .map((route) => {
    const matcher = route.matcher;
    // Function matchers already gate on `sameOrigin` (pages/RSC/others).
    if (typeof matcher === "function") return route;
    if (matcher instanceof RegExp) {
      // Keep the intentional cross-origin Google-Fonts routes untouched.
      if (CROSS_ORIGIN_FONT_HOST.test(matcher.source)) return route;
      return {
        ...route,
        matcher: ({ url, sameOrigin }: RouteMatchCallbackOptions) =>
          sameOrigin && matcher.test(url.href),
      };
    }
    // String matchers are URL prefixes.
    if (CROSS_ORIGIN_FONT_HOST.test(matcher)) return route;
    return {
      ...route,
      matcher: ({ url, sameOrigin }: RouteMatchCallbackOptions) =>
        sameOrigin && url.href.startsWith(matcher),
    };
  });

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [apiCache, ...sameOriginDefaultCache],
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
