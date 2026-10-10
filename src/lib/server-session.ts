import "server-only";
import { type NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIES = { access: "churchos_token", refresh: "churchos_refresh_token" };
export const BACKEND_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

export function trustedBrowserRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  const browserRead = request.method === "GET" && request.headers.get("sec-fetch-site") === "same-origin" && ["image", "audio", "video", "document", "empty"].includes(request.headers.get("sec-fetch-dest") ?? "");
  return (request.headers.get("x-churchos-client") === "web" || browserRead) &&
    request.headers.get("sec-fetch-site") !== "cross-site" &&
    (!origin || origin === request.nextUrl.origin);
}

export function saveSession(response: NextResponse, data: Record<string, unknown>) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  // Retain an expired access token server-side so a valid refresh can recover it.
  if (typeof data.accessToken === "string") response.cookies.set(SESSION_COOKIES.access, data.accessToken, { ...options, maxAge: 30 * 86400 });
  if (typeof data.refreshToken === "string") response.cookies.set(SESSION_COOKIES.refresh, data.refreshToken, { ...options, maxAge: 30 * 86400 });
}

export function expireSession(response: NextResponse) {
  for (const name of Object.values(SESSION_COOKIES)) {
    response.cookies.set(name, "", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0 });
  }
}
