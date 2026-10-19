import { test, expect, type BrowserContext } from "@playwright/test";
import { mockTawkWidget } from "../fixtures/tawk-widget";

test.beforeEach(async ({ context }) => {
  await context.route("https://embed.tawk.to/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: mockTawkWidget }),
  );
});

async function fixture(context: BrowserContext, role = "church_admin") {
  await context.addCookies([
    { name: "churchos_token", value: "support-fixture", url: "http://127.0.0.1:3107" },
  ]);
  await context.addInitScript(
    ({ role }) => {
      const native = window.fetch.bind(window);
      window.fetch = async (input, options) => {
        const path = new URL(input instanceof Request ? input.url : String(input), location.origin)
          .pathname;
        if (!path.startsWith("/api/")) return native(input, options);
        if (path === "/api/session") return Response.json({ hasSession: true });
        let data: unknown = [];
        if (path.endsWith("/audit") || path.endsWith("/notifications"))
          data = { data: [], total: 0 };
        if (path.endsWith("/auth/session")) data = { userId: "u", email: "admin@example.test" };
        if (path.endsWith("/profiles/me"))
          data = {
            userId: "u",
            profileId: "p",
            churchId: "c",
            role: [role],
            status: "active",
            firstName: "Grace",
            lastName: "Admin",
            permissions: [],
            planFeatures: [],
          };
        return Response.json({ success: true, data });
      };
    },
    { role },
  );
}

test("native Tawk bubble loads automatically without expanding and closes on session end", async ({
  page,
  context,
}) => {
  await fixture(context);
  let requests = 0;
  await page.route("https://embed.tawk.to/**", async (route) => {
    requests++;
    expect(route.request().url()).toBe("https://embed.tawk.to/6ad5c1c809d49434c8f515a2/1k59fptu4");
    await route.fulfill({ contentType: "application/javascript", body: mockTawkWidget });
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Tawk.to chat" })).toBeVisible();
  expect(requests).toBe(1);
  await expect(page.getByRole("button", { name: "Chat with support", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeHidden();
  await page.getByRole("button", { name: "Open Tawk.to chat" }).click();
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(
    await page.evaluate(() =>
      (window as unknown as { chatCalls: { name: string }[] }).chatCalls.some(
        (c) => c.name === "logout",
      ),
    ),
  ).toBe(false);
  await page.evaluate(() => window.dispatchEvent(new Event("churchos-session-ended")));
  const calls = await page.evaluate(() =>
    (window as unknown as { chatCalls: { name: string }[] }).chatCalls.map((c) => c.name),
  );
  expect(calls).toContain("endChat");
  expect(calls).toContain("shutdown");
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeHidden();
  expect(requests).toBe(1);
});

test("staff cannot load the widget or see the support menu", async ({ page, context }) => {
  await fixture(context, "usher");
  let requests = 0;
  await page.route("https://embed.tawk.to/**", async (route) => {
    requests++;
    await route.abort();
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chat with support", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open Tawk.to chat" })).toHaveCount(0);
  await page.getByRole("button", { name: "Account menu", exact: true }).last().click();
  await expect(page.getByRole("menuitem", { name: "Contact support" })).toHaveCount(0);
  expect(requests).toBe(0);
});

test("a blocked automatic widget gives a working retry and an external fallback", async ({
  page,
  context,
}) => {
  await fixture(context);
  let requests = 0;
  await page.route("https://embed.tawk.to/**", async (route) => {
    requests++;
    if (requests === 1) await route.abort();
    else await route.fulfill({ contentType: "application/javascript", body: mockTawkWidget });
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("alert").filter({ hasText: "Chat could not load" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chat with support", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open support in a new tab" })).toHaveAttribute(
    "href",
    "https://tawk.to/chat/6ad5c1c809d49434c8f515a2/1k59fptu4",
  );
  await page.getByRole("button", { name: "Retry support chat" }).click();
  await expect(page.getByRole("button", { name: "Open Tawk.to chat" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeVisible();
  expect(requests).toBe(2);
});

test("a widget that finishes loading after logout cannot open chat", async ({ page, context }) => {
  await fixture(context);
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("https://embed.tawk.to/**", async (route) => {
    await delayed;
    await route.fulfill({ contentType: "application/javascript", body: mockTawkWidget });
  });
  const loading = page.waitForRequest("https://embed.tawk.to/**");
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await loading;
  await page.evaluate(() => window.dispatchEvent(new Event("churchos-session-ended")));
  release();
  await expect
    .poll(() => page.evaluate(() => !!(window as unknown as { chatCalls: unknown }).chatCalls))
    .toBe(true);
  const calls = await page.evaluate(() =>
    (window as unknown as { chatCalls: { name: string }[] }).chatCalls.map((c) => c.name),
  );
  expect(calls).not.toContain("showWidget");
  expect(calls).not.toContain("maximize");
  await expect(page.getByRole("button", { name: "Open Tawk.to chat" })).toBeHidden();
});

test("chat opens on the current page and remains visible when help opens separately", async ({
  page,
  context,
}) => {
  await fixture(context);
  let requests = 0;
  await page.route("https://embed.tawk.to/**", async (route) => {
    requests++;
    await route.fulfill({ contentType: "application/javascript", body: mockTawkWidget });
  });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open Tawk.to chat" }).click();
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Help Centre" })
    .click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole("button", { name: "Account menu", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeVisible();
  expect(requests).toBe(1);
});

test("an already-loaded widget reconnects after leaving the workspace", async ({
  page,
  context,
}) => {
  await fixture(context);
  let requests = 0;
  await page.route("https://embed.tawk.to/**", async (route) => {
    requests++;
    await route.fulfill({ contentType: "application/javascript", body: mockTawkWidget });
  });
  await page.goto("/subscription");
  await page.getByRole("button", { name: "Open Tawk.to chat" }).click();
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeVisible();
  await page.getByRole("link", { name: "ChurchOS home", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeHidden();
  await page.getByRole("link", { name: "Help Centre", exact: true }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole("button", { name: "Open Tawk.to chat" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeHidden();
  await page.getByRole("button", { name: "Open Tawk.to chat" }).click();
  await expect(page.getByRole("dialog", { name: "ChurchOS support chat" })).toBeVisible();
  expect(requests).toBe(1);
});

test("legacy support URL returns to the dashboard with a floating chat control", async ({
  page,
  context,
}) => {
  await fixture(context);
  await page.goto("/support");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("button", { name: "Open Tawk.to chat" })).toBeVisible();
});

for (const path of ["/login", "/register?plan=network"]) {
  test(`verified signed-in users visiting ${path} go to their dashboard`, async ({
    page,
    context,
  }) => {
    await fixture(context);
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In", exact: true })).toHaveCount(0);
  });
}

test("an expired cookie does not redirect a visitor away from sign-in", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "churchos_token", value: "expired", url: "http://127.0.0.1:3107" },
  ]);
  await context.route("**/api/session", (route) => route.fulfill({ json: { hasSession: true } }));
  await context.route("**/api/backend/**", (route) =>
    route.fulfill({ status: 401, json: { success: false, error: { message: "Expired" } } }),
  );
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign In", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

for (const active of [true, false]) {
  test(`fresh sign-in retains ${active ? "authorized returnTo" : "subscription activation"} routing`, async ({
    page,
    context,
  }) => {
    // Cookie presence lets the fixture through middleware; the verified initial session is absent.
    await context.addCookies([
      { name: "churchos_token", value: "entry-fixture", url: "http://127.0.0.1:3107" },
    ]);
    await context.route("**/api/session", (route) =>
      route.fulfill({ json: { hasSession: false } }),
    );
    await context.route("**/api/backend/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path.endsWith("/auth/login"))
        data = { sessionEstablished: true, userId: "u", email: "admin@example.test" };
      if (path.endsWith("/profiles/me"))
        data = {
          userId: "u",
          profileId: "p",
          churchId: "c",
          role: ["church_admin"],
          status: "active",
          firstName: "Grace",
          lastName: "Admin",
          permissions: ["billing:read", "billing:update"],
          planFeatures: [],
        };
      if (path.endsWith("/billing/subscription"))
        data = {
          active,
          subscription: {
            plan: "essentials",
            cycle: "monthly",
            paid_until: active ? "2027-10-19T00:00:00Z" : null,
          },
          limits: { members: 100, staff: 2, locations: 1 },
          usage: { members: 0, staff: 1, locations: 1 },
          gateways: [],
        };
      return route.fulfill({ json: { success: true, data } });
    });
    await page.goto("/login?returnTo=%2Fdocs");
    await page.getByLabel("Email Address", { exact: true }).fill("admin@example.test");
    await page.getByLabel("Password", { exact: true }).fill("LongUniquePassword!29");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page).toHaveURL(active ? /\/help$/ : /\/subscription$/);
    await expect(
      page.getByRole("heading", {
        name: active ? "How can we help?" : "Plan & Billing",
        exact: true,
      }),
    ).toBeVisible();
  });
}
