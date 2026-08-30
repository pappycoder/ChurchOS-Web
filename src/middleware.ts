import { type NextRequest, NextResponse } from "next/server";

function getTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get("churchos_token");
  return cookie?.value || null;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isAuthenticated(token: string | null): boolean {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  if (payload.exp && (payload.exp as number) * 1000 <= Date.now()) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const authenticated = isAuthenticated(token);
  const { pathname } = request.nextUrl;

  const protectedPaths = [
    "/dashboard",
    "/members",
    "/attendance",
    "/giving",
    "/events",
    "/forms",
    "/media",
    "/pastoral",
    "/admin",
    "/profile",
    "/communication",
    "/appointments",
  ];

  const alwaysPublicPaths = ["/forms/public"];

  const isAlwaysPublic = alwaysPublicPaths.some((path) => pathname.startsWith(path));
  const isProtected = !isAlwaysPublic && protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const authPaths = ["/login", "/register", "/forgot-password"];
  const isAuth = authPaths.some((path) => pathname.startsWith(path));

  if (isAuth && authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
