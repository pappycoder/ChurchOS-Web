import { expect, test, type BrowserContext } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test.use({ serviceWorkers: "block" });
const allPermissions = [
  "events:calendar:read",
  "events:list:read",
  "events:all:read",
  "events:create",
  "events:update",
  "events:delete",
  "events:registrations:read",
  "events:registrations:create",
  "events:checkin:read",
  "events:checkin:create",
  "events:tickets:read",
  "events:tickets:create",
  "events:tickets:update",
  "events:tickets:delete",
  "attendance:services:read",
  "branches:read",
];
async function fixture(
  context: BrowserContext,
  options: {
    permissions?: string[];
    failServices?: boolean;
    failTiers?: boolean;
    failTickets?: boolean;
    empty?: boolean;
    hq?: boolean;
    dark?: boolean;
  } = {},
) {
  const state = {
    reads: [] as string[],
    writes: [] as string[],
    failServices: !!options.failServices,
  };
  const event = {
    eventId: "gathering",
    churchId: "church",
    branchId: "west",
    branchName: "West Branch",
    title: "Community Gathering",
    description: "A welcoming community event.",
    type: "conference",
    isFree: true,
    startDate: "2026-11-01T08:00:00Z",
    capacity: 100,
    registrationCount: 5,
    createdAt: "2026-10-20T08:00:00Z",
    updatedAt: "2026-10-20T08:00:00Z",
  };
  const events = options.empty
    ? []
    : [
        event,
        ...Array.from({ length: 4 }, (_, i) => ({
          ...event,
          eventId: `event-${i}`,
          title: `Community session ${i + 1}`,
          type: i % 2 ? "training" : "lifecycle",
          startDate: `2026-11-01T${10 + i}:00:00Z`,
        })),
      ];
  await context.addCookies([
    {
      name: "churchos_token",
      value: "events-visual",
      url: "http://127.0.0.1:3107",
    },
  ]);
  await context.addInitScript(
    ({ dark }) => {
      // Mocked API tests opt out of generated PWA registration as well as SW traffic.
      // Playwright's block mode resolves register() without a registration object.
      delete (Navigator.prototype as { serviceWorker?: ServiceWorkerContainer })
        .serviceWorker;
      localStorage.setItem("theme", dark ? "dark" : "light");
      localStorage.setItem(
        "churchos:appearance:v1:profile:church",
        JSON.stringify({ accent: "#7c3aed" }),
      );
    },
    { dark: options.dark },
  );
  await context.route("https://**", (route) => route.abort());
  await context.route("https://embed.tawk.to/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "Object.assign(window.Tawk_API,{showWidget(){},hideWidget(){},maximize(){},shutdown(){}});window.Tawk_API?.onLoad?.();",
    }),
  );
  await context.route("**/api/session", (route) =>
    route.fulfill({ json: { hasSession: true } }),
  );
  await context.route("**/api/backend/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (request.method() === "GET") state.reads.push(url.pathname + url.search);
    else state.writes.push(path);
    if (
      (options.failTiers && path.endsWith("/tiers")) ||
      (options.failTickets && path.endsWith("/tickets"))
    )
      return route.fulfill({
        status: 500,
        json: { success: false, error: { message: "Unavailable" } },
      });
    let data: unknown = [];
    if (path.endsWith("/auth/session"))
      data = { userId: "user", email: "events@example.test" };
    else if (path.endsWith("/profiles/me"))
      data = {
        profileId: "profile",
        userId: "user",
        churchId: "church",
        branchId: "west",
        branch: { name: "West Branch" },
        firstName: "Event",
        lastName: "Staff",
        role: ["church_admin"],
        status: "active",
        isAdminHq: !!options.hq,
        planFeatures: ["events", "tickets", "attendance", "reports"],
        permissions: options.permissions ?? allPermissions,
      };
    else if (path.endsWith("/services")) {
      if (state.failServices)
        return route.fulfill({
          status: 500,
          json: { success: false, error: { message: "Unavailable" } },
        });
      data = {
        data: options.empty
          ? []
          : [
              {
                serviceId: "sunday",
                name: "Sunday Worship",
                dayOfWeek: 0,
                isActive: true,
                startTime: "09:00",
                endTime: "10:30",
                churchId: "church",
                branchId: "west",
              },
            ],
        meta: { total: 1, totalPages: 1, page: 1, limit: 100 },
      };
    } else if (path.endsWith("/branches"))
      data = {
        data: [
          { branchId: "west", name: "West Branch" },
          { branchId: "east", name: "East Branch" },
        ],
        meta: { total: 2 },
      };
    else if (path.endsWith("/events/gathering/tiers"))
      data = [
        {
          id: "tier",
          name: "General Admission",
          price: 2500,
          capacity: 100,
          description: "Standard seating",
        },
      ];
    else if (path.endsWith("/events/gathering/registrations"))
      data = [
        {
          registrationId: "reg",
          memberId: "member",
          memberName: "Grace Member",
          paymentStatus: "paid",
          quantity: 1,
          checkedIn: false,
          createdAt: "2026-10-28T09:00:00Z",
        },
      ];
    else if (path.endsWith("/events/gathering")) data = event;
    else if (path.endsWith("/events"))
      data = { data: events, total: events.length };
    else if (path.endsWith("/unread-count")) data = { count: 0 };
    else if (
      path.endsWith("/notifications") ||
      path.endsWith("/tickets") ||
      path.endsWith("/attendance-sessions")
    )
      data = {
        data: [],
        total: 0,
        meta: { total: 0, totalPages: 0, page: 1, limit: 20 },
      };
    await route.fulfill({ json: { success: true, data } });
  });
  return state;
}

for (const width of [390, 768, 1440])
  for (const dark of [false, true]) {
    test(`Events surfaces at ${width}px in ${dark ? "dark" : "light"} mode`, async ({
      context,
      page,
    }) => {
      await fixture(context, { dark });
      await page.clock.setFixedTime(new Date("2026-11-01T08:00:00Z"));
      await page.setViewportSize({ width, height: 1000 });
      await mkdir("/tmp/churchos-events-previews", { recursive: true });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const [path, name] of [
        ["/events", "calendar"],
        ["/events/list", "directory"],
        ["/events/gathering", "details"],
        ["/events/new", "form"],
        ["/events/registrations?eventId=gathering", "registrations"],
        ["/events/check-in?eventId=gathering", "check-in"],
        ["/events/gathering/tiers", "tiers"],
        ["/events/management", "tickets"],
      ]) {
        await page.goto(path);
        await expect(page.locator("h1"), path).toBeVisible();
        if (name === "calendar")
          await expect(
            page.getByLabel("Selected day agenda").getByText("Sunday Worship"),
          ).toBeVisible();
        if (name === "directory")
          await expect(
            page.getByRole("cell", {
              name: "Community Gathering",
              exact: true,
            }),
          ).toBeVisible();
        if (name === "details")
          await expect(
            page.getByRole("heading", {
              name: "Community Gathering",
              level: 1,
            }),
          ).toBeVisible();
        if (name === "registrations")
          await expect(
            page.getByRole("cell", { name: "Grace Member" }),
          ).toBeVisible();
        if (name === "tiers")
          await expect(
            page.getByRole("cell", { name: "General Admission", exact: true }),
          ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          path,
        ).toBe(true);
        await page.screenshot({
          path: `/tmp/churchos-events-previews/${name}-${width}-${dark ? "dark" : "light"}.png`,
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });
  }

test("calendar navigation, overflow, Sunday services, date defaults and preview management", async ({
  context,
  page,
}) => {
  await fixture(context);
  await page.clock.setFixedTime(new Date("2026-11-01T08:00:00Z"));
  await page.goto("/events");
  const agenda = page.getByLabel("Selected day agenda");
  await expect(
    page.getByRole("combobox", { name: "Branch", exact: true }),
  ).toBeDisabled();
  await expect(agenda.getByText("Sunday Worship")).toBeVisible();
  await page.getByRole("button", { name: "3 more on November 1" }).click();
  await expect(agenda).toBeFocused();
  await expect(agenda.getByText("Community session 4")).toBeVisible();
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(agenda.getByText("Tuesday, Dec 1")).toBeVisible();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(agenda.getByText("Sunday, Nov 1")).toBeVisible();
  await page.getByLabel("Jump to date").fill("2026-11-08");
  await expect(agenda.getByText("Sunday Worship")).toBeVisible();
  await page
    .getByRole("button", { name: "Create event on selected day" })
    .click();
  await expect(page.getByLabel("Event Date *", { exact: true })).toHaveValue(
    "2026-11-08",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByLabel("Jump to date").fill("2026-11-01");
  await agenda.getByRole("button", { name: /Community Gathering/ }).click();
  await page.getByRole("button", { name: "Event preview management" }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Event preview management" }),
  ).toBeFocused();
});

test("calendar keeps events during service failure and retries independently", async ({
  context,
  page,
}) => {
  const state = await fixture(context, { failServices: true });
  await page.clock.setFixedTime(new Date("2026-11-01T08:00:00Z"));
  await page.goto("/events");
  await expect(
    page.getByRole("heading", { name: "Unable to load calendar services" }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByLabel("Selected day agenda").getByText("Community Gathering"),
  ).toBeVisible();
  const previous = state.reads.filter((url) =>
    url.startsWith("/api/backend/events?"),
  ).length;
  state.failServices = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByLabel("Selected day agenda").getByText("Sunday Worship"),
  ).toBeVisible();
  expect(
    state.reads.filter((url) => url.startsWith("/api/backend/events?")).length,
  ).toBe(previous);
});

test("calendar-only readers do not request unavailable modules or see write shortcuts", async ({
  context,
  page,
}) => {
  const state = await fixture(context, {
    permissions: ["events:calendar:read"],
  });
  await page.goto("/events");
  await expect(
    page.getByRole("heading", { name: "Events", exact: true, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create Event", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Tickets", exact: true }),
  ).toHaveCount(0);
  expect(state.reads.some((url) => /\/events\?|\/services\?/.test(url))).toBe(
    false,
  );
});

test("directory removes statistics reads and preserves secondary filters", async ({
  context,
  page,
}) => {
  const state = await fixture(context);
  await page.goto("/events/list");
  await expect(
    page.getByRole("cell", { name: "Community Gathering", exact: true }),
  ).toBeVisible();
  expect(
    state.reads.some(
      (url) => new URL(url, "http://test").searchParams.get("limit") === "1",
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "More filters" }).click();
  await page.getByLabel("Sort events").selectOption("title");
  await expect
    .poll(() => state.reads.some((url) => url.includes("sortBy=title")))
    .toBe(true);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByLabel("Sort events")).toHaveValue("startDate");
});

test("HQ branch selection forwards the same scope to both calendar sources", async ({
  context,
  page,
}) => {
  const state = await fixture(context, { hq: true });
  await page.goto("/events");
  await page.getByRole("combobox", { name: "Filter by branch" }).click();
  await page.getByRole("option", { name: "East Branch" }).click();
  await expect
    .poll(() =>
      state.reads.some(
        (url) => url.includes("/events?") && url.includes("branchId=east"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      state.reads.some(
        (url) => url.includes("/services?") && url.includes("branchId=east"),
      ),
    )
    .toBe(true);
});

test("tier management dialogs return keyboard focus without changing data", async ({
  context,
  page,
}) => {
  const state = await fixture(context);
  await page.goto("/events/gathering/tiers");
  const trigger = page.getByRole("button", {
    name: "Manage General Admission",
    exact: true,
  });
  await trigger.click();
  await page.getByRole("menuitem", { name: "Edit tier", exact: true }).click();
  await expect(page.getByLabel("Name *", { exact: true })).toHaveValue(
    "General Admission",
  );
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole("menuitem", { name: "Delete tier", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect(state.writes).toEqual([]);
});

test("empty calendar explains loaded coverage and retains date navigation", async ({
  context,
  page,
}) => {
  await fixture(context, { empty: true });
  await page.goto("/events");
  await expect(
    page.getByText("No loaded events or services on this day."),
  ).toBeVisible();
  await expect(page.getByText(/up to 100 of each/)).toBeVisible();
  await page.getByRole("button", { name: "week", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "week", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "day", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "day", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

for (const [path, title] of [
  ["/events/gathering/tiers", "Unable to load ticket tiers"],
  ["/events/management?tab=assigned", "Unable to load tickets"],
]) {
  test(`ticket errors stay distinct from empty results: ${path}`, async ({
    context,
    page,
  }) => {
    await fixture(context, { failTiers: true, failTickets: true });
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByRole("button", { name: "Try again", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("No tickets found.", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("No ticket tiers yet.", { exact: true }),
    ).toHaveCount(0);
  });
}
