import { expect, test } from "@playwright/test";
import { workspaceFixture } from "../fixtures/workspace-redesign";

test.use({ serviceWorkers: "allow" });

test("area rail groups accessible modules, follows deep links, and survives collapse", async ({ page, context }) => {
  const state = await workspaceFixture(context, { navigation: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/members/families/family-a");
  const rail = page.getByRole("navigation", { name: "Workspace areas", exact: true }).filter({ visible: true });
  await expect(rail.locator("[data-area]")).toHaveCount(8);
  await expect(rail.getByRole("link", { name: "People", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(page.locator("#sidebar-menu").getByRole("link", { name: "Families", exact: true })).toHaveAttribute("aria-current", "page");
  await page.locator("header").getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  await expect(rail.getByRole("link", { name: "Giving", exact: true })).toBeVisible();
  await rail.getByRole("link", { name: "Giving", exact: true }).click();
  await expect(page).toHaveURL(/\/giving$/);
  await expect(page.locator("#sidebar-menu").getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-giving-chart]")).toHaveCount(2);
  expect(state.calls.every(call => call.method === "GET")).toBe(true);
});

test("navigation omits inaccessible areas and command search preserves dirty forms", async ({ page, context }) => {
  await workspaceFixture(context);
  await page.goto("/members/new");
  const rail = page.locator(".workspace-area-rail");
  await expect(rail.locator("[data-area=administration]")).toHaveCount(0);
  await expect(rail.locator("[data-area=resources]")).toHaveCount(0);
  await page.getByLabel("First Name", { exact: false }).fill("Unsaved");
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Search pages...").fill("families");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("option", { name: /Families/ }).click();
  await expect(page).toHaveURL(/\/members\/new$/);
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("First Name", { exact: false })).toHaveValue("Unsaved");
});

test("focused member editing protects drafts and restores management focus", async ({ page, context }, info) => {
  const state = await workspaceFixture(context);
  await page.goto("/members/member-a");
  const management = page.getByRole("button", { name: "Member management", exact: true });
  await management.click();
  await page.getByRole("menuitem", { name: "Edit Member", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Edit Member", exact: true });
  await expect(editor).toBeVisible();
  expect((await editor.boundingBox())!.width).toBe(page.viewportSize()!.width);
  await editor.getByLabel("First Name", { exact: false }).fill("Uncommitted");
  page.once("dialog", dialog => dialog.dismiss());
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor.getByLabel("First Name", { exact: false })).toHaveValue("Uncommitted");
  await page.screenshot({ path: info.outputPath("focused-member-editor.png"), fullPage: true });
  page.once("dialog", dialog => dialog.accept());
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(management).toBeFocused();
  expect(state.calls.every(call => call.method === "GET")).toBe(true);
});

for (const width of [390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`redesigned screens at ${width}px in ${theme}`, async ({ page, context }, info) => {
    await workspaceFixture(context, { navigation: true });
    await context.addInitScript(theme => localStorage.setItem("theme", theme), theme);
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const path of ["/dashboard", "/members", "/members/member-a", "/members/new", "/giving"]) {
      await page.goto(path);
      await expect(page.locator("main h1").first()).toBeVisible();
      await page.waitForTimeout(200);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
      await page.screenshot({ path: info.outputPath(`${path.replaceAll("/", "-")}-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
    }
    if (width === 390) {
      await page.locator("header").getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
      const drawer = page.getByRole("dialog");
      await expect(drawer.getByRole("navigation", { name: "Workspace areas", exact: true })).toBeVisible();
      await drawer.getByRole("link", { name: "People", exact: true }).click();
      await expect(page).toHaveURL(/\/members$/);
      await expect(drawer).toHaveCount(0);
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    }
    expect(errors).toEqual([]);
  });
}

test("workspace palette clears outside the workspace and reduced motion is honoured", async ({ page, context }) => {
  await workspaceFixture(context);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/members");
  await expect(page.locator("main h1")).toBeVisible();
  expect(await page.locator(".workspace-destination").first().evaluate(element => getComputedStyle(element).transitionDuration)).toBe("1e-05s");
  await page.goto("/");
  await expect(page.locator("[data-workspace-root]")).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--workspace-accent").trim())).toBe("");
});

test("empty and failed directories keep navigation and recoverable states", async ({ page, context }) => {
  await workspaceFixture(context, { empty: true });
  await page.goto("/members");
  await expect(page.getByText("No members found", { exact: true })).toBeVisible();
  await context.route("**/api/backend/members?**", route => route.fulfill({ status: 503, json: { message: "Unavailable" } }));
  await page.reload();
  await expect(page.getByRole("button", { name: "Try again", exact: false })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "Search navigation", exact: true })).toBeVisible();
});
