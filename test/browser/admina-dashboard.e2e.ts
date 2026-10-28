import { test, expect, type BrowserContext } from "@playwright/test";
import { COARSE_RESOURCES, EXTRA_PERMISSIONS, PERMISSION_ACTIONS, SURFACE_RESOURCES } from "../../src/lib/menu-catalog";

const grants = new Set<string>(EXTRA_PERMISSIONS);
for (const resource of [...COARSE_RESOURCES, ...Object.keys(SURFACE_RESOURCES)])
  for (const action of PERMISSION_ACTIONS) grants.add(`${resource}:${action}`);
for (const [resource, surfaces] of Object.entries(SURFACE_RESOURCES))
  for (const surface of surfaces)
    for (const action of PERMISSION_ACTIONS) grants.add(`${resource}:${surface}:${action}`);

async function fixture(context: BrowserContext, options: { restricted?: boolean; empty?: boolean; fail?: boolean; limitedPlan?: boolean; waitReads?: Promise<void> } = {}) {
  const writes: string[] = [];
  const notification = { id: "notice-a", type: "system", title: "Welcome to your workspace", body: "Your church workspace is ready.", createdAt: "2026-10-28T08:00:00Z", readAt: undefined as string | undefined };
  await context.addCookies([{ name: "churchos_token", value: "layout-fixture", url: "http://127.0.0.1:3107" }]);
  await context.route("https://**", route => route.abort());
  await context.route("**/api/session", route => route.fulfill({ json: { hasSession: true } }));
  await context.route("**/api/backend/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/backend", "");
    if (request.method() !== "GET") writes.push(`${request.method()} ${path}`);
    let data: unknown = { data: [], meta: { page: 1, limit: 15, total: 0, totalPages: 0 } };
    if (path === "/profiles/me") data = {
      profileId: "profile-a", userId: "user-a", churchId: "church-a", branchId: "branch-a",
      church: { name: "ChurchOS Community Church and International Fellowship" }, branch: { name: "Main branch" },
      firstName: "Grace", lastName: "Reviewer", email: "grace@example.test", role: [options.restricted ? "member" : "church_admin"],
      status: "active", isAdminHq: !options.restricted,
      permissions: options.restricted ? [] : [...grants],
      planFeatures: options.limitedPlan ? [] : ["staff_roles", "custom_roles", "giving", "events", "groups", "forms", "reports", "email", "media", "tickets", "pastoral", "assets", "analytics", "sms", "whatsapp", "calls", "webhooks"],
    };
    else if (path === "/auth/session") data = { userId: "user-a", email: "grace@example.test" };
    else if (path.endsWith("/unread-count") || path.endsWith("/unread")) data = { count: 0 };
    else if (path === "/billing/subscription") data = { limits: {}, usage: {}, subscription: { paid_until: "2099-01-01T00:00:00Z" } };
    else if (path === "/church/roles") data = { roles: [] };
    else if (path === "/notifications") {
      await options.waitReads;
      if (options.fail) return route.fulfill({ status: 503, json: { success: false, error: { message: "Notifications unavailable" } } });
      data = { data: options.empty ? [] : [notification], total: options.empty ? 0 : 1, unreadCount: notification.readAt ? 0 : 1 };
    } else if (path === "/notifications/notice-a/read") {
      notification.readAt = "2026-10-28T09:00:00Z";
      data = notification;
    } else if (path === "/audit") {
      await options.waitReads;
      if (options.fail) return route.fulfill({ status: 503, json: { success: false, error: { message: "Activity unavailable" } } });
      data = { data: [], total: 0 };
    }
    return route.fulfill({ json: { success: true, data } });
  });
  return writes;
}

test("rail selection, collapse, direct routes and history preserve navigation", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await fixture(context);
  await page.goto("/dashboard");
  const sections = page.getByRole("navigation", { name: "Workspace sections" });
  const menu = page.getByRole("navigation", { name: "Workspace", exact: true });
  await expect(sections.getByRole("button", { name: "General", exact: true })).toHaveAttribute("aria-pressed", "true");
  await sections.getByRole("button", { name: "Operations", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(menu.getByRole("button", { name: "Assets", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(menu).toBeHidden();
  await expect(sections).toBeVisible();
  await sections.getByRole("button", { name: "General", exact: true }).click();
  await expect(menu).toBeVisible();
  await sections.getByRole("button", { name: "Support", exact: true }).click();
  await page.getByRole("navigation", { name: "Common tasks" }).getByRole("link", { name: "My profile", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(sections.getByRole("button", { name: "Support", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.goBack();
  await expect(sections.getByRole("button", { name: "General", exact: true })).toHaveAttribute("aria-pressed", "true");
  await menu.getByRole("button", { name: "Members", exact: true }).click();
  await menu.getByRole("link", { name: "All Members", exact: true }).click();
  await expect(page).toHaveURL(/\/members$/, { timeout: 15000 });
  await expect(menu.getByRole("link", { name: "All Members", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goto("/assets/loans");
  await expect(sections.getByRole("button", { name: "Operations", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(menu.getByRole("link", { name: "Loans", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goto("/dashboard");
  await page.goBack();
  await expect(sections.getByRole("button", { name: "Operations", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 1199, height: 1000 });
  await expect(sections).toBeHidden();
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(page.getByRole("dialog", { name: "Main navigation" })).toBeVisible();
  await page.setViewportSize({ width: 1200, height: 1000 });
  await expect(page.getByRole("dialog", { name: "Main navigation" })).toBeHidden();
  await expect(sections).toBeVisible();
});

for (const width of [375, 768, 1024, 1440]) {
  test(`responsive shell and theme previews at ${width}px`, async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await fixture(context);
    await page.goto("/dashboard");
    await expect(page.getByText("Welcome back, Grace!")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Common tasks" }).getByRole("link")).toHaveCount(6);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const theme of ["light", "dark"]) {
      const isDark = await page.locator("html").evaluate(element => element.classList.contains("dark"));
      if (isDark !== (theme === "dark")) await page.getByRole("button", { name: `Switch to ${theme} mode`, exact: true }).click();
      await page.mouse.move(0, 0);
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
    }
    if (width < 1200) {
      const toggle = page.getByRole("button", { name: "Toggle Sidebar" });
      await expect(page.getByRole("navigation", { name: "Workspace sections" })).toBeHidden();
      await toggle.click();
      const drawer = page.getByRole("dialog", { name: "Main navigation" });
      await expect(drawer).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`navigation-${width}.png`), animations: "disabled" });
      await page.keyboard.press("Tab");
      await expect.poll(() => drawer.evaluate(element => element.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Shift+Tab");
      await expect.poll(() => drawer.evaluate(element => element.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
      await expect(toggle).toBeFocused();
      await toggle.click();
      await page.mouse.click(width - 10, 400);
      await expect(drawer).toBeHidden();
      await toggle.click();
      await page.getByRole("navigation", { name: "Workspace", exact: true }).getByRole("link", { name: "Dashboard", exact: true }).click();
      await expect(drawer).toBeHidden();
    }
  });
}

test("restricted navigation and command search exclude inaccessible pages", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await fixture(context, { restricted: true, empty: true });
  await page.goto("/dashboard");
  const sections = page.getByRole("navigation", { name: "Workspace sections" });
  await expect(sections.getByRole("button", { name: "General", exact: true })).toBeVisible();
  await expect(sections.getByRole("button", { name: "Operations", exact: true })).toHaveCount(0);
  await expect(sections.getByRole("button", { name: "Administration", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Common tasks" }).getByRole("link")).toHaveCount(1);
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Search navigation" });
  await expect(search).toBeVisible();
  await search.getByPlaceholder("Search pages...").fill("Assets");
  await expect(search.getByText("No accessible pages found.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("No activity yet.")).toBeVisible();
  await expect(page.getByText("You're all caught up!")).toBeVisible();
});

test("notification detail and header account actions remain available", async ({ page, context }) => {
  const writes = await fixture(context);
  await page.goto("/dashboard");
  await page.getByRole("main").getByRole("button", { name: /Welcome to your workspace/ }).click();
  await expect(page.getByRole("dialog", { name: "Welcome to your workspace" })).toBeVisible();
  await expect.poll(() => writes.some(value => value === "PATCH /notifications/notice-a/read")).toBe(true);
  await page.keyboard.press("Escape");
  await page.locator("header").getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menuitem", { name: "Profile", exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
});

test("dashboard read failures remain explicit", async ({ page, context }) => {
  await fixture(context, { fail: true });
  await page.goto("/dashboard");
  await expect(page.getByText("Unable to load account activity")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Unable to load notifications")).toBeVisible({ timeout: 20000 });
});


test("subscription filtering also applies to the rail, shortcuts and search", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await fixture(context, { limitedPlan: true });
  await page.goto("/dashboard");
  await expect(page.getByText("Welcome back, Grace!")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Workspace sections" }).getByRole("button", { name: "Operations", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Common tasks" }).getByRole("link", { name: "View events" })).toHaveCount(0);
  await page.getByRole("button", { name: "Search navigation", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search navigation" });
  await search.getByPlaceholder("Search pages...").fill("Assets");
  await expect(search.getByRole("option").filter({ hasText: "/assets" })).toHaveCount(0);
});

test("dashboard panels show loading before resolving to empty states", async ({ page, context }) => {
  let release!: () => void;
  const waitReads = new Promise<void>(resolve => { release = resolve; });
  await fixture(context, { empty: true, waitReads });
  try {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Recent Audit Logs" })).toBeVisible();
    await expect(page.getByRole("main").locator(".animate-pulse").first()).toBeVisible();
    await expect(page.getByText("No activity yet.")).toHaveCount(0);
    await expect(page.getByText("You're all caught up!")).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.getByText("No activity yet.")).toBeVisible();
  await expect(page.getByText("You're all caught up!")).toBeVisible();
});


test("header help, notifications, inbox and theme controls remain usable", async ({ page, context }) => {
  await fixture(context);
  await page.goto("/dashboard");
  const header = page.locator("header");
  await expect(header.getByRole("button", { name: "Ask ChurchOS", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "Inbox", exact: true })).toHaveAttribute("href", "/communication/inbox");
  await header.getByRole("button", { name: "Help for this page", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Help Centre", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await header.getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menu").getByText("Welcome to your workspace")).toBeVisible();
  await page.keyboard.press("Escape");
  await header.getByRole("button", { name: "Switch to dark mode", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await header.getByRole("button", { name: "Switch to light mode", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
