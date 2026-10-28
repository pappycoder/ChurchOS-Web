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
    modules?: boolean;
    reports?: boolean;
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
      analytics = false,
      modules = true,
      reports = true,
      empty = false,
      failGiving = false,
      features = ["giving", "events", "forms"],
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
              ...(modules
                ? [
                    "giving:dashboard:read",
                    "members:all:read",
                    "attendance:dashboard:read",
                    ...(reports ? ["attendance:reports:read"] : []),
                  ]
                : []),
              "events:list:read",
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
        else if (path === "/members/dashboard")
          data = {
            total: empty ? 0 : total,
            byStatus: empty ? {} : { active: total - 3, inactive: 3 },
            byGender: {},
            byAgeGroup: empty ? {} : { age_18_30: total },
            growth: empty ? [] : [point],
          };
        else if (path === "/attendance/summary")
          data = {
            totalCheckIns: empty ? 0 : total,
            memberCheckIns: empty ? 0 : total - 2,
            visitorCheckIns: empty ? 0 : 2,
            bySource: {},
            byCategory: {},
            byGender: {},
          };
        else if (path === "/attendance/trends") data = empty ? [] : [point];
        else if (path === "/giving/dashboard/charts") {
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
            currency: url.searchParams.get("currency") ?? "NGN",
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

async function chartCalls(page: Page) {
  return page.evaluate(() =>
    window.dashboardCalls.filter((c) =>
      /\/(members\/dashboard|giving\/dashboard\/charts|attendance\/(summary|trends))/.test(
        c.path,
      ),
    ),
  );
}

async function assertNoAnalytics(page: Page) {
  expect(
    await page.evaluate(() =>
      window.dashboardCalls.filter((c) => c.path.includes("/analytics/")),
    ),
  ).toEqual([]);
}

test("Church Admin without Analytics entitlement sees real module charts and accessible detail links", async ({
  page,
  context,
}) => {
  await setup(context);
  await page.goto("/dashboard");
  await expect(page.locator(".recharts-surface")).toHaveCount(7);
  await expect(page.locator(".recharts-pie-sector")).not.toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Attendance breakdown", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /^View details\s*:\s*Member composition$/,
      exact: true,
    }),
  ).toHaveAttribute("href", "/members");
  await expect(
    page.getByRole("link", { name: /^View details\s*:\s*Giving trend$/, exact: true }),
  ).toHaveAttribute("href", "/giving");
  await expect(
    page.getByRole("link", {
      name: /^View details\s*:\s*Attendance trend$/,
      exact: true,
    }),
  ).toHaveAttribute("href", "/attendance/reports");
  await assertNoAnalytics(page);
  await page.getByRole("heading", { name: "Member composition", exact: true }).scrollIntoViewIfNeeded();
  await expect(page.locator(".recharts-pie-sector path").first()).toHaveAttribute("d", /A/);
  await page.screenshot({
    path: test.info().outputPath("module-dashboard.png"),
    fullPage: true,
  });
});

test("HQ filters update module charts; dates and currency leave member history unchanged", async ({
  page,
  context,
}) => {
  await setup(context);
  await page.goto("/dashboard");
  await expect(page.locator(".recharts-surface")).toHaveCount(7);
  expect(
    (await chartCalls(page)).find((c) => c.path.includes("/giving/"))?.path,
  ).toContain("currency=NGN");
  expect(
    (await chartCalls(page)).find((c) => c.path.includes("/giving/"))?.path,
  ).toContain("T23%3A59%3A59.999Z");
  await page
    .getByLabel("Dashboard branch", { exact: true })
    .selectOption("branch-b");
  await expect(
    page.getByRole("heading", { name: "Membership · Branch B" }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await chartCalls(page)).filter((c) =>
          c.path.includes("branchId=branch-b"),
        ).length,
    )
    .toBe(4);
  const before = (await chartCalls(page)).filter((c) =>
    c.path.includes("/members/"),
  ).length;
  await page.getByLabel("Dashboard giving currency").selectOption("USD");
  await expect
    .poll(async () =>
      (await chartCalls(page)).some((c) => c.path.includes("currency=USD")),
    )
    .toBe(true);
  await page.getByRole("button", { name: "All time", exact: true }).click();
  await expect
    .poll(async () =>
      (await chartCalls(page)).some(
        (c) =>
          c.path.includes("/giving/") &&
          c.path.includes("currency=USD") &&
          !c.path.includes("startDate"),
      ),
    )
    .toBe(true);
  expect(
    (await chartCalls(page)).filter((c) => c.path.includes("/members/")),
  ).toHaveLength(before);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(
    page.getByLabel("Dashboard branch", { exact: true }),
  ).toHaveValue("");
  await expect(page.getByLabel("Dashboard giving currency")).toHaveValue("NGN");
  await expect(page.getByLabel("Start date")).not.toHaveValue("");
});

test("branch viewer sends own scope immediately and blocks reversed dates", async ({
  page,
  context,
}) => {
  await setup(context, { hq: false });
  await page.goto("/dashboard");
  await expect(
    page.getByLabel("Dashboard branch", { exact: true }),
  ).toBeDisabled();
  await expect.poll(async () => (await chartCalls(page)).length).toBe(4);
  expect(
    (await chartCalls(page)).every((c) => c.path.includes("branchId=branch-a")),
  ).toBe(true);
  await page.getByLabel("Start date").fill("2099-01-01");
  await expect(
    page.getByText("Start date must be on or before end date."),
  ).toBeVisible();
  expect((await chartCalls(page)).some((c) => c.path.includes("2099"))).toBe(
    false,
  );
  await expect(page.getByText("Choose a valid date range.")).toHaveCount(4);
});

test("missing module grants prevent chart rendering and requests", async ({
  page,
  context,
}) => {
  await setup(context, { modules: false });
  await page.goto("/dashboard");
  await expect(
    page.getByText("Welcome back, Grace!", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Dashboard filters" }),
  ).toHaveCount(0);
  await expect(page.locator(".recharts-surface")).toHaveCount(0);
  expect(await chartCalls(page)).toEqual([]);
  await assertNoAnalytics(page);
});

test("giving still requires its plan entitlement; other module charts remain", async ({
  page,
  context,
}) => {
  await setup(context, { features: ["events", "forms"] });
  await page.goto("/dashboard");
  await expect(page.locator(".recharts-surface")).toHaveCount(5);
  await expect(page.getByLabel("Dashboard giving currency")).toHaveCount(0);
  expect(
    (await chartCalls(page)).some((c) => c.path.includes("/giving/")),
  ).toBe(false);
});

test("attendance summary access gives a bar chart without report access", async ({
  page,
  context,
}) => {
  await setup(context, { reports: false });
  await page.goto("/dashboard");
  await expect(page.locator(".recharts-surface")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "Attendance breakdown", exact: true }),
  ).toBeVisible();
  expect(
    (await chartCalls(page)).some((c) => c.path.includes("/attendance/trends")),
  ).toBe(false);
});

test("shortcuts, profile and notification actions remain available without Analytics", async ({
  page,
  context,
}) => {
  await setup(context);
  await page.goto("/dashboard");
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
  await page.getByRole("button", { name: /Dashboard fixture notice/ }).click();
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
  await assertNoAnalytics(page);
});

test("failed giving charts recover independently", async ({
  page,
  context,
}) => {
  await setup(context, { failGiving: true });
  await page.goto("/dashboard");
  await expect(
    page.getByText("Unable to load giving charts", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByText("Member composition", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.failDashboardGiving = false;
  });
  await page
    .getByRole("alert")
    .filter({ hasText: "Unable to load giving charts" })
    .getByRole("button", { name: "Try again" })
    .click();
  await expect(
    page.getByText("Unable to load giving charts", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".recharts-surface")).toHaveCount(7);
});

for (const empty of [true, false])
  test(`module charts fit mobile with empty=${empty}`, async ({
    page,
    context,
  }) => {
    await setup(context, { empty });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    if (empty) {
      await expect(
        page.getByText("No data in the selected range."),
      ).toHaveCount(5);
      await expect(page.getByText("No data yet.")).toHaveCount(2);
    } else await expect(page.locator(".recharts-surface")).toHaveCount(7);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
