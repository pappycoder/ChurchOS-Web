import { test, expect, type BrowserContext } from "@playwright/test";

async function fixture(context: BrowserContext, role = "church_admin") {
  await context.addCookies([{ name: "churchos_token", value: "support-fixture", url: "http://127.0.0.1:3107" }]);
  await context.addInitScript(({ role }) => {
    const native = window.fetch.bind(window);
    window.fetch = async (input, options) => {
      const path = new URL(input instanceof Request ? input.url : String(input), location.origin).pathname;
      if (!path.startsWith("/api/")) return native(input, options);
      if (path === "/api/session") return Response.json({ hasSession: true });
      let data: unknown = [];
      if (path.endsWith("/auth/session")) data = { userId: "u", email: "admin@example.test" };
      if (path.endsWith("/profiles/me")) data = {
        userId: "u", profileId: "p", churchId: "c", role: [role], status: "active",
        firstName: "Grace", lastName: "Admin", permissions: [], planFeatures: [],
      };
      return Response.json({ success: true, data });
    };
  }, { role });
}

const mockWidget = `
window.chatCalls = [];
const api = window.Tawk_API;
for (const name of ['start', 'hideWidget', 'showWidget', 'maximize', 'endChat', 'shutdown']) {
  api[name] = (...args) => window.chatCalls.push({ name, args });
}
api.logout = (callback) => { window.chatCalls.push({ name: 'logout' }); callback?.(); };
api.onLoad();
`;

test("admin chat is lazy, uses the supplied widget and closes on session end", async ({ page, context }) => {
  await fixture(context);
  let requests = 0;
  await page.route("https://embed.tawk.to/**", async route => {
    requests++;
    expect(route.request().url()).toBe("https://embed.tawk.to/6ad5c1c809d49434c8f515a2/1k59fptu4");
    await route.fulfill({ contentType: "application/javascript", body: mockWidget });
  });
  await page.goto("/support");
  await expect(page.getByRole("heading", { name: "Contact support" })).toBeVisible();
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Chat with support", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.stringify((window as unknown as { chatCalls: unknown[] }).chatCalls))).toContain('"maximize"');
  await page.evaluate(() => window.dispatchEvent(new Event("churchos-session-ended")));
  const calls = await page.evaluate(() => (window as unknown as { chatCalls: { name: string }[] }).chatCalls.map(c => c.name));
  expect(calls.slice(-5)).toEqual(["hideWidget", "endChat", "logout", "shutdown", "shutdown"]);
  expect(requests).toBe(1);
});

test("staff cannot load the widget or see the support menu", async ({ page, context }) => {
  await fixture(context, "usher");
  let requests = 0;
  await page.route("https://embed.tawk.to/**", async route => { requests++; await route.abort(); });
  await page.goto("/support");
  await expect(page.getByText("Please contact your church administrator for support.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Chat with support", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Account menu", exact: true }).last().click();
  await expect(page.getByRole("menuitem", { name: "Contact support" })).toHaveCount(0);
  expect(requests).toBe(0);
});

test("blocked widget gives a retry and an external fallback", async ({ page, context }) => {
  await fixture(context);
  await page.route("https://embed.tawk.to/**", route => route.abort());
  await page.goto("/support");
  await page.getByRole("button", { name: "Chat with support", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Chat could not load" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chat with support", exact: true })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Open support in a new tab" })).toHaveAttribute("href", "https://tawk.to/chat/6ad5c1c809d49434c8f515a2/1k59fptu4");
});

test("a widget that finishes loading after logout cannot open chat", async ({ page, context }) => {
  await fixture(context);
  let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  await page.route("https://embed.tawk.to/**", async route => {
    await delayed;
    await route.fulfill({ contentType: "application/javascript", body: mockWidget });
  });
  await page.goto("/support");
  await page.getByRole("button", { name: "Chat with support", exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("churchos-session-ended")));
  release();
  await expect.poll(() => page.evaluate(() => !!(window as unknown as { chatCalls: unknown }).chatCalls)).toBe(true);
  const calls = await page.evaluate(() => (window as unknown as { chatCalls: { name: string }[] }).chatCalls.map(c => c.name));
  expect(calls).not.toContain("showWidget");
  expect(calls).not.toContain("maximize");
});
