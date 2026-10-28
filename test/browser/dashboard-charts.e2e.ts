import { test, expect, type BrowserContext, type Page } from "@playwright/test";

declare global {
  interface Window {
    dashboardCalls: { path: string; method: string }[];
    failDashboardGiving: boolean;
  }
}

async function setup(
  context: BrowserContext,
  options: {
    hq?: boolean;
    analytics?: boolean;
    empty?: boolean;
    failGiving?: boolean;
    features?: string[];
  } = {},
) {
  await context.addCookies([
    {
      name: "churchos_token",
      value: "dashboard-fixture",
      url: "http://127.0.0.1:3107",
    },
  ]);
  await context.addInitScript(
    ({
      hq = true,
      analytics = true,
      empty = false,
      failGiving = false,
      features = ["analytics", "giving", "events", "forms"],
    }) => {
      const native = window.fetch.bind(window);
      window.dashboardCalls = [];
      window.failDashboardGiving = failGiving;
      let read = false;
      const notification = () => ({
        id: "notice-a",
        type: "system",
        title: "Dashboard fixture notice",
        body: "Existing notification details",
        createdAt: "2026-10-28T08:00:00Z",
        ...(read ? { readAt: "2026-10-28T09:00:00Z" } : {}),
      });
      window.fetch = async (input, init) => {
        const url = new URL(
          input instanceof Request ? input.url : String(input),
          location.origin,
        );
        if (!url.pathname.startsWith("/api/")) return native(input, init);
        window.dashboardCalls.push({
          path: url.pathname + url.search,
          method: init?.method ?? "GET",
        });
        if (url.pathname === "/api/session")
          return Response.json({ hasSession: true });
        const path = url.pathname.replace("/api/backend", "");
        let data: unknown = [];
        const total = url.searchParams.get("branchId") === "branch-b" ? 7 : 42;
        const point = {
          date: "2026-10-27",
          total,
          members: total - 2,
          visitors: 2,
        };
        if (path === "/profiles/me")
          data = {
            profileId: "profile-a",
            churchId: "church-a",
            branchId: "branch-a",
            branch: { name: "Branch A" },
            church: { name: "Fixture Church" },
            firstName: "Grace",
            lastName: "Adeyemi",
            email: "grace@example.test",
            status: "active",
            role: ["church_admin"],
            isAdminHq: hq,
            planFeatures: features,
            permissions: [
              "branches:read",
              "giving:dashboard:read",
              "events:list:read",
              "members:all:read",
              "attendance:checkin:read",
              "visitors:list:read",
              "forms:read",
              ...(analytics
                ? [
                    "analytics:attendance:read",
                    "analytics:giving:read",
                    "analytics:members:read",
                  ]
                : []),
            ],
          };
        else if (path === "/branches")
          data = {
            data: [
              { branchId: "branch-a", name: "Branch A" },
              { branchId: "branch-b", name: "Branch B" },
            ],
            total: 2,
          };
        else if (path === "/analytics/members")
          data = {
            total: empty ? 0 : total,
            byStatus: empty ? {} : { active: total },
            byGender: {},
            byAgeGroup: empty ? {} : { age_18_30: total },
            growth: empty ? [] : [point],
          };
        else if (path === "/analytics/attendance")
          data = {
            total: empty ? 0 : total,
            members: total - 2,
            visitors: 2,
            trend: empty ? [] : [point],
            byService: [],
            byBranch: [],
            bySource: {},
          };
        else if (path === "/analytics/giving") {
          if (window.failDashboardGiving)
            return Response.json(
              {
                success: false,
                error: { message: "Fixture giving unavailable" },
              },
              { status: 500 },
            );
          data = {
            total: empty ? 0 : total,
            count: 2,
            average: total / 2,
            trend: empty ? [] : [point],
            byCategory: empty
              ? []
              : [
                  {
                    categoryId: "cat-a",
                    categoryName: "Offering",
                    total,
                    count: 2,
                  },
                ],
          };
        } else if (path === "/giving/dashboard")
          data = { monthTotal: 100, allTimeTotal: 500, count: 3, trend: [] };
        else if (path === "/events") data = { data: [], total: 0 };
        else if (path === "/audit") data = { data: [], total: 0 };
        else if (path === "/notifications")
          data = {
            data: [notification()],
            total: 1,
            unreadCount: read ? 0 : 1,
          };
        else if (path === "/notifications/unread-count")
          data = { count: read ? 0 : 1 };
        else if (path === "/notifications/notice-a/read") {
          read = true;
          data = notification();
        }
        return Response.json({ success: true, data });
      };
    },
    options,
  );
}

async function analyticsCalls(page: Page) {
  return page.evaluate(() =>
    window.dashboardCalls.filter((c) => c.path.includes("/analytics/")),
  );
}

test("HQ filters update branch charts; dates and currency leave member history unchanged", async ({
  page,
  context,
}) => {
  await setup(context);
  await page.goto("/dashboard");
  await expect(
    page.getByText("Attendance trend", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".recharts-surface")).toHaveCount(6);
  await page.screenshot({
    path: test.info().outputPath("dashboard-desktop.png"),
    fullPage: true,
  });
  const firstGiving = (await analyticsCalls(page)).find((c) =>
    c.path.includes("/giving"),
  )!;
  expect(firstGiving.path).toContain("currency=NGN");
  expect(firstGiving.path).toContain("T23%3A59%3A59.999Z");
  await page
    .getByLabel("Dashboard branch", { exact: true })
    .selectOption("branch-b");
  await expect(
    page.getByRole("heading", { name: "Membership · Branch B" }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await analyticsCalls(page)).filter((c) =>
          c.path.includes("branchId=branch-b"),
        ).length,
    )
    .toBe(3);
  const before = (await analyticsCalls(page)).filter((c) =>
    c.path.includes("/members"),
  ).length;
  await page.getByLabel("Dashboard giving currency").selectOption("USD");
  await expect
    .poll(async () =>
      (await analyticsCalls(page)).some((c) => c.path.includes("currency=USD")),
    )
    .toBe(true);
  await page.getByRole("button", { name: "All time", exact: true }).click();
  await expect
    .poll(async () =>
      (await analyticsCalls(page)).some(
        (c) =>
          c.path.includes("/giving") &&
          c.path.includes("currency=USD") &&
          !c.path.includes("startDate"),
      ),
    )
    .toBe(true);
  expect(
    (await analyticsCalls(page)).filter((c) => c.path.includes("/members")),
  ).toHaveLength(before);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(
    page.getByLabel("Dashboard branch", { exact: true }),
  ).toHaveValue("");
  await expect(page.getByLabel("Dashboard giving currency")).toHaveValue("NGN");
  await expect(page.getByLabel("Start date")).not.toHaveValue("");
});

test("branch viewer sends own scope from the first request and blocks reversed dates", async ({
  page,
  context,
}) => {
  await setup(context, { hq: false });
  await page.goto("/dashboard");
  await expect(
    page.getByLabel("Dashboard branch", { exact: true }),
  ).toBeDisabled();
  await expect.poll(async () => (await analyticsCalls(page)).length).toBe(3);
  expect(
    (await analyticsCalls(page)).every((c) =>
      c.path.includes("branchId=branch-a"),
    ),
  ).toBe(true);
  await page.getByLabel("Start date").fill("2099-01-01");
  await expect(
    page.getByText("Start date must be on or before end date."),
  ).toBeVisible();
  expect(
    (await analyticsCalls(page)).some((c) => c.path.includes("2099")),
  ).toBe(false);
  await expect(page.getByText("Choose a valid date range.")).toHaveCount(3);
});

for (const mode of ["no grants", "no plan"] as const) {
  test(`${mode}: preserves tasks, giving summary, profile and notifications without analytics requests`, async ({
    page,
    context,
  }) => {
    await setup(
      context,
      mode === "no grants"
        ? { analytics: false }
        : { features: ["giving", "events", "forms"] },
    );
    await page.goto("/dashboard");
    await expect(
      page.getByText("Giving overview", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Dashboard filters" }),
    ).toHaveCount(0);
    const nav = page.getByRole("navigation", { name: "Common tasks" });
    for (const [label, href] of [
      ["Find a member", "/members"],
      ["Check in", "/attendance/check-in"],
      ["Follow up", "/visitors"],
      ["Events", "/events/list"],
      ["Forms", "/forms"],
    ]) {
      await expect(
        nav.getByRole("link", { name: label, exact: true }),
      ).toHaveAttribute("href", href);
    }
    await expect(
      page.getByRole("link", { name: "View profile", exact: true }),
    ).toHaveAttribute("href", "/profile");
    await page
      .getByRole("button", { name: /Dashboard fixture notice/ })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Existing notification details",
    );
    await expect
      .poll(async () =>
        page.evaluate(() =>
          window.dashboardCalls.some(
            (c) =>
              c.path.endsWith("/notifications/notice-a/read") &&
              c.method === "PATCH",
          ),
        ),
      )
      .toBe(true);
    await page.keyboard.press("Escape");
    const notifications = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Recent Notifications", { exact: true }) });
    await notifications.getByRole("button", { name: "View all" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await analyticsCalls(page)).toEqual([]);
  });
}

test("failed giving charts recover independently while other charts and tasks remain available", async ({
  page,
  context,
}) => {
  await setup(context, { failGiving: true });
  await page.goto("/dashboard");
  await expect(
    page.getByText("Unable to load giving analytics", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByText("Member composition", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Common tasks" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.failDashboardGiving = false;
  });
  await page
    .getByRole("alert")
    .filter({ hasText: "Unable to load giving analytics" })
    .getByRole("button", { name: "Try again" })
    .click();
  await expect(
    page.getByText("Unable to load giving analytics", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".recharts-surface")).toHaveCount(6);
});

test("empty dashboard stacks on mobile without overflow", async ({
  page,
  context,
}) => {
  await setup(context, { empty: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByText("No data in the selected range.")).toHaveCount(4);
  await expect(page.getByText("No data yet.")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("populated charts fit the mobile dashboard", async ({ page, context }) => {
  await setup(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.locator(".recharts-surface")).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("dashboard-mobile.png"),
    fullPage: true,
  });
});
