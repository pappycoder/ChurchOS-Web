import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: { hasSession: false } }),
  );
  await page.route("**/api/backend/**", (route) =>
    route.fulfill({
      status: 403,
      json: {
        success: false,
        error: {
          message: "No private requests expected from the public landing page",
        },
      },
    }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("landing page remains public after the unauthenticated session check", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/backend/")) requests.push(request.url());
  });
  const presence = page.waitForResponse((response) =>
    response.url().endsWith("/api/session"),
  );
  await page.goto("/");
  await presence;
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A little less admin.",
  );
  await expect(page).toHaveURL("http://127.0.0.1:3107/");
  await expect(
    page.getByRole("link", { name: "Bring your church together", exact: true }),
  ).toHaveAttribute("href", "/register");
  await expect(page).toHaveTitle(/ChurchOS.*ministry/);
  expect(requests).toEqual([]);
});

test("product preview supports selection and keyboard navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("tabpanel")).toContainText("612");
  const first = page.getByRole("tab", { name: "Sunday overview", exact: true });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "People & care", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("1,284");
  await page
    .getByRole("tab", { name: "Giving & reports", exact: true })
    .click();
  await expect(page.getByRole("tabpanel")).toContainText("₦845k");
});

test("pricing switches billing periods and reviews a plan without buying anything", async ({
  page,
}) => {
  await page.goto("/#pricing");
  const plans = [
    { name: "Essentials", monthly: "₦10,000", effective: "₦9,000", yearly: "₦108,000" },
    { name: "Community", monthly: "₦20,000", effective: "₦18,000", yearly: "₦216,000" },
    { name: "Network", monthly: "₦40,000", effective: "₦36,000", yearly: "₦432,000" },
    { name: "Enterprise", monthly: "₦80,000", effective: "₦72,000", yearly: "₦864,000" },
  ];
  const card = (name: string) => page.getByRole("article").filter({
    has: page.getByRole("heading", { name, exact: true }),
  });
  for (const plan of plans) {
    await expect(card(plan.name).getByText(plan.monthly, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: /Yearly Save 10%/ }).click();
  for (const plan of plans) {
    await expect(card(plan.name).getByText(plan.effective, { exact: true })).toBeVisible();
    await expect(card(plan.name)).toContainText(`${plan.yearly} billed yearly`);
  }
  const trigger = page.getByRole("button", {
    name: "Explore Network plan",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("activate your workspace with secure checkout");
  await expect(
    dialog.getByRole("link", { name: "Continue to registration", exact: true }),
  ).toHaveAttribute("href", "/register?plan=network&cycle=annual");
  await expect(dialog).toContainText("₦36,000");
  await expect(dialog).toContainText("₦432,000 billed yearly");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Monthly", exact: true }).click();
  for (const plan of plans) {
    await expect(card(plan.name).getByText(plan.monthly, { exact: true })).toBeVisible();
  }
});

test("FAQs and section links work", async ({ page }) => {
  await page.goto("/");
  const question = page
    .locator("summary")
    .filter({ hasText: "Can we subscribe to these plans today?" });
  await question.click();
  await expect(page.getByText(/complete secure checkout/)).toBeVisible();
  const missing = await page
    .locator('a[href^="#"]')
    .evaluateAll((anchors) =>
      anchors
        .map((anchor) => (anchor as HTMLAnchorElement).hash.slice(1))
        .filter((id) => id && !document.getElementById(id)),
    );
  expect(missing).toEqual([]);
});

for (const width of [320, 390, 768, 1440])
  test(`landing layout fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    if (width === 1440) {
      await page.screenshot({ path: "/tmp/churchos-landing-desktop.png" });
      await page.screenshot({
        path: "/tmp/churchos-landing-full.png",
        fullPage: true,
      });
      await page
        .locator("#pricing")
        .screenshot({ path: "/tmp/churchos-landing-pricing.png" });
    }
    if (width === 390) {
      await page.screenshot({ path: "/tmp/churchos-landing-mobile.png" });
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Close navigation", exact: true }),
      ).toHaveAttribute("aria-expanded", "true");
      await page
        .locator("#marketing-mobile-navigation")
        .getByRole("link", { name: "Pricing", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Open navigation", exact: true }),
      ).toHaveAttribute("aria-expanded", "false");
      await expect(page).toHaveURL(/#pricing$/);
    }
  });

test("protected workspace routes still require sign-in", async ({
  request,
}) => {
  const response = await request.get("/analytics", { maxRedirects: 0 });
  expect([307, 308]).toContain(response.status());
  expect(response.headers().location).toContain("/login");
});
