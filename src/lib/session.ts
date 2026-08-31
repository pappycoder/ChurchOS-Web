const ACCESS_TOKEN_COOKIE = "churchos_token";
const REFRESH_TOKEN_COOKIE = "churchos_refresh_token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax; max-age=${maxAgeSeconds}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; SameSite=Lax; max-age=0`;
}

export function getAccessToken(): string | null {
  return readCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | null {
  return readCookie(REFRESH_TOKEN_COOKIE);
}

export function setTokens(
  accessToken: string,
  refreshToken?: string | null,
  ttlSeconds: number = 24 * 60 * 60
) {
  writeCookie(ACCESS_TOKEN_COOKIE, accessToken, ttlSeconds);
  if (refreshToken) {
    // Refresh token outlives the access token; keep it for a longer window.
    writeCookie(REFRESH_TOKEN_COOKIE, refreshToken, 30 * 24 * 60 * 60);
  }
}

export function setAccessToken(accessToken: string) {
  writeCookie(ACCESS_TOKEN_COOKIE, accessToken, 24 * 60 * 60);
}

export function clearTokens() {
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(REFRESH_TOKEN_COOKIE);
}

export function parseJwt(token: string): Record<string, unknown> | null {
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
