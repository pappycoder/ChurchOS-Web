/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  RouteMatchCallbackOptions,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Never persist private API responses, RSC payloads, or dashboard documents.
const privateRequests: RuntimeCaching = {
  matcher: ({ url, request }) => url.pathname.startsWith("/api/") || request.headers.has("authorization") || request.mode === "navigate" || request.headers.get("rsc") === "1" || url.searchParams.has("_rsc"),
  handler: new NetworkOnly(),
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
  runtimeCaching: [privateRequests, ...sameOriginDefaultCache],
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
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => /api|pages|rsc|others/i.test(name)).map((name) => caches.delete(name)))));
});

serwist.addEventListeners();
