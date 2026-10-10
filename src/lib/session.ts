/** Tokens belong to HttpOnly server cookies. The browser can only end a session. */
export async function clearTokens() {
  if (typeof window === "undefined") return;
  const response = await fetch("/api/session", { method: "DELETE", headers: { "X-ChurchOS-Client": "web" }, cache: "no-store" });
  if (!response.ok) throw new Error("Unable to clear your session. Please try again.");
  if ("caches" in window) {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => /api|pages|rsc|others/i.test(name)).map((name) => caches.delete(name)));
  }
}
