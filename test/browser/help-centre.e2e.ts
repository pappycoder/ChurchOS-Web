import { test, expect, type BrowserContext } from "@playwright/test";

async function publicSession(context: BrowserContext) {
  await context.route("**/api/session", (route) =>
    route.fulfill({ json: { hasSession: false } }),
  );
}
async function staffSession(
  context: BrowserContext,
  role = "usher",
  extraPermissions: string[] = [],
) {
  await context.addCookies([
    {
      name: "churchos_token",
      value: "help-fixture",
      url: "http://127.0.0.1:3107",
    },
  ]);
  await context.addInitScript(
    ({ role, extraPermissions }) => {
      const original = window.fetch.bind(window);
      window.fetch = async (input, options) => {
        const path = new URL(
          input instanceof Request ? input.url : String(input),
          location.origin,
        ).pathname;
        if (!path.startsWith("/api/")) return original(input, options);
        if (path === "/api/session") return Response.json({ hasSession: true });
        let data: unknown = [];
      if (path.endsWith("/audit") || path.endsWith("/notifications")) data = { data: [], total: 0 };
        if (path.endsWith("/auth/session"))
          data = { userId: "u", email: "help@example.test" };
        if (path.endsWith("/profiles/me"))
          data = {
            profileId: "p",
            userId: "u",
            churchId: "c",
            role: [role],
            status: "active",
            firstName: "Grace",
            lastName: "Staff",
            permissions: [
              ...(role === "church_admin"
                ? ["billing:read", "billing:update"]
                : ["attendance:checkin:create", "attendance:services:read"]),
              ...extraPermissions,
            ],
            planFeatures: [],
            isAdminHq: false,
          };
        if (path.endsWith("/billing/subscription"))
          data = {
            active: true,
            subscription: {
              plan: "essentials",
              paid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
            },
            limits: { members: 100, staff: 2, locations: 1 },
            usage: { members: 25, staff: 1, locations: 1 },
          };
        return Response.json({ success: true, data });
      };
    },
    { role, extraPermissions },
  );
}

test("public search finds tasks, filters topics and recovers from no results", async ({
  page,
  context,
}) => {
  await publicSession(context);
  const privateRequests: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().includes("/api/backend/") ||
      request.url().includes("embed.tawk.to")
    )
      privateRequests.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/help");
  await expect(
    page.getByRole("heading", { name: "How can we help?", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/churchos-help-centre-desktop.png" });
  await page
    .getByRole("searchbox", { name: "Search help articles" })
    .fill("How do I import my members?");
  const results = page.locator("#help-results");
  await expect(results.getByRole("link").first()).toContainText(
    "Import your member directory",
  );
  await expect(page).toHaveURL(/q=How/);
  await page.getByRole("button", { name: /Giving & subscriptions/ }).click();
  await expect(
    page.getByRole("heading", { name: "No matching guides yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset search and topics" }).click();
  await expect(page.getByRole("status")).toHaveText("20 guides");
  expect(privateRequests).toEqual([]);
});

test("shared search links restore filters after reload", async ({
  page,
  context,
}) => {
  await publicSession(context);
  await page.goto("/help?q=headcount&topic=attendance");
  await expect(
    page.getByRole("searchbox", { name: "Search help articles" }),
  ).toHaveValue("headcount");
  await expect(
    page.getByRole("button", { name: /Attendance Check people/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .locator("#help-results")
      .getByRole("link", { name: /Record service and meeting totals/ }),
  ).toBeVisible();
});

test("article has content, navigation and metadata with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto("http://127.0.0.1:3107/help/import-members");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Import your member directory",
    }),
  ).toBeVisible();
  await expect(page.getByText("Last reviewed", { exact: false })).toContainText(
    "19 October 2026",
  );
  await expect(
    page.getByRole("heading", { name: "Import and review the result" }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/help\/import-members$/,
  );
  await expect(page).toHaveTitle(/Import your member directory/);
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toContainText("People & follow-up");
  await expect(
    page.getByRole("region", { name: "Related guides" }),
  ).toBeVisible();
  await context.close();
});

test("an expired session does not redirect public articles to sign-in", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "churchos_token",
      value: "expired-help-session",
      url: "http://127.0.0.1:3107",
    },
  ]);
  await context.route("**/api/session", (route) =>
    route.fulfill({ json: { hasSession: true } }),
  );
  await context.route("**/api/backend/**", (route) =>
    route.fulfill({
      status: 401,
      json: { success: false, error: { message: "Session expired" } },
    }),
  );
  const refresh = page.waitForResponse((response) =>
    response.url().endsWith("/api/backend/auth/refresh"),
  );
  await page.goto("/help/plans-and-allowances");
  await refresh;
  await expect(
    page.getByRole("heading", {
      name: "Choose a plan and understand allowances",
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/help\/plans-and-allowances$/);
});

test("staff help suggests permitted tasks and directs staff to their administrator", async ({
  page,
  context,
}) => {
  await staffSession(context);
  await page.goto("/docs");
  await expect(
    page.getByRole("heading", { level: 1, name: "Help Centre" }),
  ).toBeVisible();
  const suggestions = page.getByRole("region", {
    name: "Suggested for your work",
  });
  await expect(
    suggestions.getByRole("heading", { name: "Check people in for a service" }),
  ).toBeVisible();
  await expect(suggestions).not.toContainText("Choose a plan");
  await expect(
    page.getByText(/Ask your church administrator about your role/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Contact support", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Help for this page" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Check people in for a service" }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "Contact support" }),
  ).toHaveCount(0);
});

test("administrator opens chat directly from help without leaving the page", async ({
  page,
  context,
}) => {
  await staffSession(context, "church_admin");
  let widgets = 0;
  await page.route("https://embed.tawk.to/**", async (route) => {
    widgets++;
    await route.abort();
  });
  await page.goto("/docs");
  await expect(
    page.getByRole("region", { name: "Suggested for your work" }),
  ).toContainText("Choose a plan and understand allowances");
  expect(widgets).toBe(0);
  await page.getByRole("button", { name: "Contact support", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Chat could not load" })).toBeVisible();
  await expect(page).toHaveURL(/\/docs$/);
  expect(widgets).toBe(1);
});

test("legacy documentation anchors reach their replacement guide", async ({
  page,
  context,
}) => {
  await staffSession(context);
  await page.goto("/docs#members");
  await expect(page).toHaveURL(/\/help\/add-and-update-members$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Add and update members" }),
  ).toBeVisible();
});

test("unknown public articles return 404 and public guides appear in the sitemap", async ({
  page,
  context,
}) => {
  await publicSession(context);
  const response = await page.goto("/help/not-a-published-article");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "We couldn’t find that guide" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Browse the Help Centre" }),
  ).toHaveAttribute("href", "/help");
  await expect(page).not.toHaveURL(/\/login/);
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/help/import-members");
  expect(await sitemap.text()).not.toContain("/docs</loc>");
  const unauthenticated = await page.request.get("/docs", { maxRedirects: 0 });
  expect(unauthenticated.status()).toBe(307);
  expect(unauthenticated.headers().location).toContain("/login");
});

for (const width of [320, 390])
  test(`Help Centre and article fit ${width}px`, async ({ page, context }) => {
    await publicSession(context);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/help");
    await page
      .getByRole("searchbox", { name: "Search help articles" })
      .fill("pending payment");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("searchbox", { name: "Search help articles" })
      .fill("z".repeat(160));
    await expect(
      page.getByRole("heading", { name: "No matching guides yet" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/help/subscription-currencies-and-payments");
    await page.locator("summary").filter({ hasText: "On this page" }).click();
    await expect(
      page
        .getByRole("link", {
          name: "Renewals and pending checkout",
          exact: true,
        })
        .first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390)
      await page.screenshot({
        path: "/tmp/churchos-help-article-mobile.png",
        fullPage: true,
      });
  });

test("staff help and header navigation fit a phone", async ({
  page,
  context,
}) => {
  await staffSession(context);
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/docs");
  await expect(
    page.getByRole("heading", { level: 1, name: "Help Centre" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Popular guides", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Help for this page" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Check people in for a service" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await page.screenshot({ path: "/tmp/churchos-help-workspace-mobile.png" });
});

test("administrator help header fits a phone with all utility controls", async ({
  page,
  context,
}) => {
  await staffSession(context, "church_admin", ["emails:read", "offline:read"]);
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/docs");
  await expect(
    page.getByRole("heading", { level: 1, name: "Help Centre" }),
  ).toBeVisible();
  await expect(
    page
      .locator("header")
      .getByRole("link", { name: "Offline workspace", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});


test("signed-in help articles keep dashboard navigation and clear return links", async ({ page, context }) => {
  await staffSession(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/docs");
  await expect(page.getByRole("link", { name: "Back to dashboard", exact: true })).toHaveAttribute("href", "/dashboard");
  await expect(page.getByRole("navigation", { name: "Help workspace navigation" }).getByRole("link", { name: "ChurchOS home" })).toHaveAttribute("href", "/");
  await page.getByRole("region", { name: "Suggested for your work" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/help\//);
  await expect(page.getByRole("button", { name: "Account menu", exact: true }).last()).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Help return navigation" });
  await expect(navigation.getByRole("link", { name: "Back to dashboard" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "ChurchOS home" })).toHaveAttribute("href", "/");
  await page.screenshot({ path: "/tmp/churchos-help-article-workspace-desktop.png" });
  await navigation.getByRole("link", { name: "Back to dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("topic navigation updates the public guide results without a reload", async ({ page, context }) => {
  await publicSession(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/help");
  await page.getByRole("navigation", { name: "Help topics" }).first().getByRole("link", { name: "Attendance", exact: true }).click();
  await expect(page).toHaveURL(/topic=attendance/);
  await expect(page.getByRole("button", { name: /Attendance Check people/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#help-results")).toContainText("Record service and meeting totals");
  await expect(page.locator("#help-results")).not.toContainText("Import your member directory");
  await page.getByRole("navigation", { name: "Help topics" }).first().getByRole("link", { name: "All guides" }).click();
  await expect(page.getByRole("status")).toHaveText("20 guides");
});

for (const width of [320, 390]) test(`signed-in guide navigation fits ${width}px`, async ({ page, context }) => {
  await staffSession(context, "church_admin");
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/help/plans-and-allowances");
  await expect(page.getByRole("link", { name: "Back to dashboard", exact: true })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Browse help topics" }).click();
  await expect(page.getByRole("link", { name: "Giving & subscriptions", exact: true }).last()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width === 390) await page.screenshot({ path: "/tmp/churchos-help-article-workspace-mobile.png" });
});
