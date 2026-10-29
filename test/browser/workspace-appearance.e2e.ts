import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import fs from "node:fs/promises";

test.use({ serviceWorkers: "block" });
const key = "churchos:appearance:v1:profile-a:church-a";
const stamp = "2026-10-01T10:00:00Z";
async function fixture(
  context: BrowserContext,
  options: { readOnly?: boolean; archived?: boolean } = {},
) {
  const scope = { profileId: "profile-a", churchId: "church-a" };
  const calls: { path: string; method: string }[] = [];
  await context.addCookies([
    {
      name: "churchos_token",
      value: "appearance-test",
      url: "http://127.0.0.1:3107",
    },
  ]);
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
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/backend", "");
    calls.push({ path, method: route.request().method() });
    const member = {
      memberId: "member-a",
      firstName: "Grace",
      lastName: "Adeyemi",
      email: "grace@example.test",
      phone: "+2348012345678",
      gender: "female",
      status: "active",
      branchId: "branch-a",
      memberSince: stamp,
      createdAt: stamp,
      customFields: {},
      ...(options.archived ? { archivedAt: stamp } : {}),
    };
    const family = {
      familyId: "family-a",
      name: "Adeyemi Family",
      createdAt: stamp,
      members: [
        {
          id: "link-a",
          memberId: "member-a",
          firstName: "Grace",
          lastName: "Adeyemi",
          relationship: "parent",
          isHead: true,
        },
      ],
      ...(options.archived ? { archivedAt: stamp } : {}),
    };
    const service = {
      serviceId: "service-a",
      name: "Sunday Service",
      category: "mixed",
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "11:00",
      isActive: true,
      branchId: "branch-a",
      createdAt: stamp,
      ...(options.archived ? { archivedAt: stamp } : {}),
    };
    let data: unknown = [];
    if (path === "/profiles/me")
      data = {
        ...scope,
        userId: "user-a",
        branchId: "branch-a",
        isAdminHq: true,
        status: "active",
        role: ["staff"],
        firstName: "Grace",
        lastName: "Admin",
        church: { name: "Grace Church" },
        branch: { name: "Main Branch" },
        planFeatures: ["giving"],
        permissions: [
          "members:all:read",
          "families:read",
          "attendance:services:read",
          "attendance:records:read",
          "attendance:dashboard:read",
          "branches:read",
          ...(options.readOnly
            ? []
            : [
                "members:all:update",
                "members:all:delete",
                "families:update",
                "families:delete",
                "attendance:services:update",
                "attendance:services:delete",
              ]),
        ],
      };
    else if (path === "/members/member-a") data = member;
    else if (path === "/families/family-a") data = family;
    else if (path === "/services/service-a") data = service;
    else if (path === "/members")
      data = {
        data: [member],
        meta: { page: 1, limit: 15, total: 1, totalPages: 1 },
      };
    else if (path === "/families")
      data = {
        data: [family],
        meta: { page: 1, limit: 15, total: 1, totalPages: 1 },
      };
    else if (path === "/services")
      data = {
        data: [service],
        meta: { page: 1, limit: 15, total: 1, totalPages: 1 },
      };
    else if (path === "/branches")
      data = {
        data: [{ branchId: "branch-a", name: "Main Branch" }],
        total: 1,
      };
    else if (path.includes("/summary"))
      data = {
        totalCheckIns: 0,
        memberCheckIns: 0,
        visitorCheckIns: 0,
        bySource: {},
        byCategory: {},
        byGender: {},
        reportCount: 0,
        total: 0,
        unspecifiedAgeCount: 0,
        unspecifiedGenderCount: 0,
      };
    else if (path.includes("unread")) data = { count: 0 };
    else if (
      path.includes("attendance") ||
      path.includes("giving") ||
      path === "/notifications"
    )
      data = { data: [], total: 0, meta: { page: 1, total: 0, totalPages: 0 } };
    await route.fulfill({ json: { success: true, data } });
  });
  return { scope, calls };
}
async function openAppearance(
  page: Page,
  placement: "header" | "sidebar" = "header",
) {
  await page
    .locator(placement === "header" ? "header" : "[data-sidebar=footer]")
    .getByRole("button", { name: "Account menu", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Appearance", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Appearance", exact: true }),
  ).toBeVisible();
}
async function token(page: Page, name = "--primary") {
  return page.evaluate((name) => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return /^#[0-9a-f]{3}$/i.test(value)
      ? "#" +
          value
            .slice(1)
            .split("")
            .map((c) => c + c)
            .join("")
      : value;
  }, name);
}
async function expectAccent(page: Page, color: string) {
  await expect.poll(() => token(page, "--workspace-accent")).toBe(color);
}

// Preferences belong to the signed-in browser scope and are never sent to the API.
test("neutral workspace, live preview, validation, Cancel, Save and reload", async ({
  page,
  context,
}) => {
  const { calls } = await fixture(context);
  await page.goto("/members/member-a");
  await expect(
    page.getByRole("heading", { name: "Grace Adeyemi", exact: true }),
  ).toBeVisible();
  expect(await token(page, "--background")).toBe("#fafafa");
  expect(await token(page, "--sidebar")).toBe("#ffffff");
  await openAppearance(page);
  await page
    .getByRole("button", { name: "Violet accent", exact: true })
    .click();
  await expectAccent(page, "#7c3aed");
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--primary").trim(),
      ),
  ).toBe("#7c3aed");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expectAccent(page, "#0f766e");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
  await openAppearance(page);
  await page.getByLabel("Hex color", { exact: true }).fill("#123");
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "six-digit hex",
  );
  await page.getByLabel("Hex color", { exact: true }).fill("#AB12EF");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
  ).toEqual({ accent: "#ab12ef" });
  await page.reload();
  await expectAccent(page, "#ab12ef");
  await openAppearance(page);
  await expect(
    page.getByRole("button", { name: "Primary action", exact: true }),
  ).toHaveCSS("background-color", "rgb(171, 18, 239)");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(calls.some((call) => call.method !== "GET")).toBe(false);
});

test("sidebar entry, default reset and existing dark mode stay independent", async ({
  page,
  context,
}) => {
  await fixture(context);
  await page.goto("/members/member-a");
  await openAppearance(page, "sidebar");
  await page.getByRole("button", { name: "Blue accent", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .locator("header")
    .getByRole("button", { name: /dark mode/i })
    .click();
  await expect.poll(() => token(page, "--background")).toBe("#101012");
  expect(await token(page, "--sidebar")).toBe("#161618");
  await expectAccent(page, "#2563eb");
  await page.reload();
  await expect.poll(() => token(page, "--background")).toBe("#101012");
  await expectAccent(page, "#2563eb");
  await openAppearance(page);
  await page
    .getByRole("button", { name: "Reset to default", exact: true })
    .click();
  await expectAccent(page, "#0f766e");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).accent,
      key,
    ),
  ).toBe("#2563eb");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).accent,
      key,
    ),
  ).toBe("#0f766e");
});

test("saved colors remain isolated across churches and accounts and clear on public routes", async ({
  page,
  context,
}) => {
  const { scope } = await fixture(context);
  await page.goto("/members/member-a");
  await openAppearance(page);
  await page.getByRole("button", { name: "Rose accent", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  scope.churchId = "church-b";
  await page.reload();
  await expect(page.locator("#main-content h1")).toBeVisible();
  await expectAccent(page, "#0f766e");
  scope.churchId = "church-a";
  scope.profileId = "profile-b";
  await page.reload();
  await expect(page.locator("#main-content h1")).toBeVisible();
  await expectAccent(page, "#0f766e");
  scope.profileId = "profile-a";
  await page.reload();
  await expectAccent(page, "#e11d48");
  await page.goto("/login");
  await expect(page.locator("[data-workspace-root]")).toHaveCount(0);
  expect(await token(page, "--background")).toBe("#fcfcf9");
  expect(await token(page, "--workspace-accent")).toBe("");
});

test("invalid cache falls back and matching storage changes synchronize across tabs", async ({
  page,
  context,
}) => {
  await fixture(context);
  await context.addInitScript((key) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem(key, "broken-json");
      sessionStorage.setItem("seeded", "1");
    }
  }, key);
  await page.goto("/members/member-a");
  await expectAccent(page, "#0f766e");
  const second = await context.newPage();
  await second.goto("/members/families/family-a");
  await expect(
    second.getByRole("heading", { name: "Adeyemi Family", exact: true }),
  ).toBeVisible();
  await openAppearance(page);
  await page.getByRole("button", { name: "Amber accent", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectAccent(second, "#d97706");
  await second.evaluate(() =>
    localStorage.setItem(
      "churchos:appearance:v1:other:church-a",
      JSON.stringify({ accent: "#ff0000" }),
    ),
  );
  await expectAccent(page, "#d97706");
  await second.close();
});

test("unavailable browser storage allows a clearly labelled session-only accent", async ({
  page,
  context,
}) => {
  await fixture(context);
  await context.addInitScript(() => {
    const native = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("churchos:appearance:"))
        throw new DOMException("Unavailable", "QuotaExceededError");
      return native.call(this, key, value);
    };
  });
  await page.goto("/members/member-a");
  await openAppearance(page);
  await page
    .getByRole("button", { name: "Violet accent", exact: true })
    .click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "could not be saved",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expectAccent(page, "#7c3aed");
  await page.reload();
  await expect(page.locator("#main-content h1")).toBeVisible();
  await expectAccent(page, "#0f766e");
});

for (const [route, label] of [
  ["/members/member-a", "Member"],
  ["/members/families/family-a", "Family"],
  ["/attendance/services/service-a", "Service"],
])
  test(`${label} management supports keyboard, confirmation focus and semantic destructive actions`, async ({
    page,
    context,
  }) => {
    const { calls } = await fixture(context);
    await page.goto(route);
    const trigger = page.getByRole("button", {
      name: `${label} management`,
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("menuitem", { name: "Archive", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Archive");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(trigger).toBeFocused();
    if (label !== "Service") {
      await trigger.click();
      await page
        .getByRole("menuitem", {
          name: label === "Member" ? "Deactivate" : "Delete",
          exact: true,
        })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    expect(calls.some((call) => call.method !== "GET")).toBe(false);
  });

test("read-only staff have personal Appearance but no management menu", async ({
  page,
  context,
}) => {
  await fixture(context, { readOnly: true });
  for (const route of [
    "/members/member-a",
    "/members/families/family-a",
    "/attendance/services/service-a",
  ]) {
    await page.goto(route);
    await expect(page.locator("#main-content h1")).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /^(Member|Family|Service) management$/,
      }),
    ).toHaveCount(0);
  }
  await openAppearance(page);
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toBeEnabled();
});

test("white and black accents retain readable buttons, neutral surfaces and mobile previews", async ({
  page,
  context,
}) => {
  await fixture(context);
  const directory = "/tmp/churchos-workspace-previews";
  await fs.mkdir(directory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [route, name] of [
    ["/members/member-a", "member"],
    ["/members/families/family-a", "family"],
    ["/attendance/services/service-a", "service"],
  ]) {
    await page.goto(route);
    await expect(page.locator("#main-content h1")).toBeVisible();
    await page.screenshot({
      path: `${directory}/${name}-light.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: /^(Member|Family|Service) management$/ })
      .click();
    await page.screenshot({
      path: `${directory}/${name}-menu.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${directory}/${name}-mobile.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page
      .locator("header")
      .getByRole("button", { name: /dark mode/i })
      .click();
    await expect.poll(() => token(page, "--background")).toBe("#101012");
    await page.screenshot({
      path: `${directory}/${name}-dark-mobile.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: `${directory}/${name}-dark.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page
      .locator("header")
      .getByRole("button", { name: /light mode/i })
      .click();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await openAppearance(page);
  await page.getByLabel("Hex color", { exact: true }).fill("#ffffff");
  const primary = page.getByRole("button", {
    name: "Primary action",
    exact: true,
  });
  await expect(primary).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(primary).toHaveCSS("color", "rgb(0, 0, 0)");
  await page.getByLabel("Hex color", { exact: true }).fill("#000000");
  await expect(primary).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.screenshot({
    path: `${directory}/appearance-dialog.png`,
    fullPage: true,
    animations: "disabled",
  });
});

test("archived details retain labelled restore and permanent-delete confirmations", async ({
  page,
  context,
}) => {
  const { calls } = await fixture(context, { archived: true });
  for (const [route, label] of [
    ["/members/member-a", "Member"],
    ["/members/families/family-a", "Family"],
    ["/attendance/services/service-a", "Service"],
  ]) {
    await page.goto(route);
    const trigger = page.getByRole("button", {
      name: `${label} management`,
      exact: true,
    });
    await trigger.click();
    await expect(
      page.getByRole("menuitem", { name: "Archive", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Edit Family", exact: true })).toHaveCount(0);
    await page.getByRole("menuitem", { name: "Restore", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Restore");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page
      .getByRole("menuitem", { name: "Delete Forever", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText("cannot be undone");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  expect(calls.some((call) => call.method !== "GET")).toBe(false);
});
