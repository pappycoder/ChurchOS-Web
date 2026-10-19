import { expect, test, type BrowserContext } from "@playwright/test";

async function session(context: BrowserContext, review = true, readSubmissions = true) {
  await context.addCookies([
    { name: "churchos_token", value: "forms-tables", url: "http://127.0.0.1:3107" },
  ]);
  await context.addInitScript(
    ({ review, readSubmissions }) => {
      const native = window.fetch.bind(window);
      const date = "2026-10-19T10:00:00Z";
      const forms = [
        {
          id: "form-a",
          title: "Volunteer application",
          description: "Choose where you would like to serve on Sundays.",
          fields: [
            { key: "name", label: "Full name", type: "text", required: true },
            { key: "email", label: "Email address", type: "email", required: true },
            {
              key: "team",
              label: "Preferred teams",
              type: "checkbox",
              options: ["Welcome", "Music"],
            },
            { key: "experience", label: "Experience", type: "textarea" },
          ],
        },
        {
          id: "form-b",
          title: "Equipment request",
          description: "Request equipment for your ministry.",
          uniqueField: "equipment",
          fields: [
            { key: "equipment", label: "Equipment name", type: "text", required: true },
            { key: "quantity", label: "Quantity", type: "number" },
          ],
        },
      ].map((form) => ({
        ...form,
        churchId: "church-a",
        status: "published",
        isTemplate: false,
        isPublic: false,
        submissionCount: 2,
        submissionLimit: 20,
        createdAt: date,
        updatedAt: date,
      }));
      const responses = [
        {
          id: "11111111-1111-4111-8111-111111111111",
          formId: "form-a",
          data: {
            name: "Grace Adeyemi",
            email: "grace@example.test",
            team: ["Welcome", "Music"],
            experience: "I have served on the welcome team for three years.",
          },
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          formId: "form-a",
          data: {
            name: "David Okoro",
            email: "david@example.test",
            team: ["Music"],
            experience: "Piano and singing.",
          },
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          formId: "form-b",
          data: { equipment: "Keyboard", quantity: 0 },
        },
      ].map((item) => ({ ...item, status: "pending", attachments: [], createdAt: date }));
      Object.assign(window, { formRequests: [] as string[] });
      window.fetch = async (input, options) => {
        const path = new URL(input instanceof Request ? input.url : String(input), location.origin)
          .pathname;
        if (!path.startsWith("/api/")) return native(input, options);
        (window as unknown as { formRequests: string[] }).formRequests.push(
          `${options?.method || "GET"} ${path}`,
        );
        if (path === "/api/session") return Response.json({ hasSession: true });
        let data: unknown = {
          data: [],
          total: 0,
          meta: { total: 0, page: 1, limit: 15, totalPages: 0 },
        };
        if (path.endsWith("/auth/session"))
          data = { userId: "user-a", email: "reader@example.test" };
        else if (path.endsWith("/profiles/me"))
          data = {
            profileId: "profile-a",
            userId: "user-a",
            churchId: "church-a",
            role: ["custom_reader"],
            status: "active",
            firstName: "Grace",
            lastName: "Reader",
            permissions: [
              "forms:list:read",
              "members:all:read",
              ...(readSubmissions ? ["forms:submissions:read"] : []),
              ...(review ? ["forms:submissions:update", "forms:list:update"] : []),
            ],
          };
        else if (path.endsWith("/members"))
          data = {
            data: [
              {
                memberId: "member-a",
                churchId: "church-a",
                firstName: "Grace",
                lastName: "Adeyemi",
                email: "grace@example.test",
                phone: "+2348000000000",
                status: "active",
                memberSince: date,
                createdAt: date,
                updatedAt: date,
              },
            ],
            meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
          };
        else if (path.endsWith("/forms"))
          data = { data: forms, meta: { total: 2, page: 1, limit: 15, totalPages: 1 } };
        else {
          const form = forms.find((item) => path.endsWith(`/forms/${item.id}`));
          if (form) data = form;
          const formId = path.match(/\/forms\/(form-[ab])\/submissions/)?.[1];
          if (formId) {
            const rows = responses.filter((item) => item.formId === formId);
            data = { data: rows, meta: { total: rows.length, page: 1, limit: 15, totalPages: 1 } };
          }
        }
        return Response.json({ success: true, data });
      };
    },
    { review, readSubmissions },
  );
}

const responseId = "11111111-1111-4111-8111-111111111111";

test("form detail shows its own questions, metadata and distinct answer columns", async ({
  page,
  context,
}) => {
  await session(context);
  await page.goto("/forms/form-a");
  await expect(
    page.getByRole("heading", { name: "Volunteer application", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Choose where you would like to serve on Sundays.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Questions in this form" })).toBeVisible();
  const table = page.getByRole("table", { name: "Volunteer application submissions" });
  await expect(
    table.getByRole("columnheader", { name: "Submission reference", exact: true }),
  ).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Full name", exact: false })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Grace Adeyemi", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "David Okoro", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Welcome, Music", exact: true })).toBeVisible();
  await page.screenshot({ path: "/tmp/churchos-form-detail.png", fullPage: true });
  await table.getByRole("button", { name: responseId, exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("grace@example.test", { exact: true }),
  ).toBeVisible();
});

test("the first two identifiers remain aligned when scrolling, resizing and hiding columns", async ({
  page,
  context,
}) => {
  await session(context);
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto("/forms/form-a");
  const table = page.getByRole("table", { name: "Volunteer application submissions" });
  const pinned = table.locator("thead [data-pinned-column]");
  await expect(pinned).toHaveCount(2);
  const before = await pinned.evaluateAll((cells) =>
    cells.map((cell) => cell.getBoundingClientRect().x),
  );
  const scroll = table.locator("..");
  await scroll.evaluate((element) => {
    element.scrollLeft = 350;
  });
  await expect.poll(() => scroll.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect
    .poll(() =>
      pinned.evaluateAll((cells) =>
        cells.map((cell) => Math.round(cell.getBoundingClientRect().x)),
      ),
    )
    .toEqual(before.map(Math.round));
  await page.getByRole("button", { name: "Choose visible columns" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Source", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(table.getByRole("columnheader", { name: "Source", exact: true })).toBeHidden();
  await page.setViewportSize({ width: 800, height: 900 });
  await expect
    .poll(() =>
      pinned.evaluateAll((cells) =>
        cells.length === 2
          ? Math.abs(cells[1].getBoundingClientRect().left - cells[0].getBoundingClientRect().right)
          : Infinity,
      ),
    )
    .toBeLessThan(2);
  await expect
    .poll(() =>
      table.evaluate((element) => {
        const cells = Array.from(element.querySelectorAll("thead [data-pinned-column]"));
        if (cells.length !== 2) return Infinity;
        const width = cells.reduce((total, cell) => total + cell.getBoundingClientRect().width, 0);
        return width / element.parentElement!.clientWidth;
      }),
    )
    .toBeLessThan(0.72);
  const body = table.locator("tbody tr").first();
  await expect
    .poll(async () =>
      Math.abs(
        (await body.locator('[data-pinned-column="1"]').boundingBox())!.x -
          (await pinned.nth(1).boundingBox())!.x,
      ),
    )
    .toBeLessThan(2);
});

test("desktop actions appear on row hover and keyboard focus", async ({ page, context }) => {
  await session(context);
  await page.goto("/forms/form-a");
  const action = page.getByRole("button", { name: `View submission ${responseId}`, exact: true });
  await expect
    .poll(() => action.evaluate((element) => getComputedStyle(element).opacity))
    .toBe("0");
  await page.getByRole("row").filter({ hasText: "Grace Adeyemi" }).hover();
  await expect
    .poll(() => action.evaluate((element) => getComputedStyle(element).opacity))
    .toBe("1");
  await page.getByRole("heading", { name: "Volunteer application", exact: true }).hover();
  await expect
    .poll(() => action.evaluate((element) => getComputedStyle(element).opacity))
    .toBe("0");
  await action.focus();
  await expect
    .poll(() => action.evaluate((element) => getComputedStyle(element).opacity))
    .toBe("1");
});

for (const width of [390, 1024])
  test(`touch actions stay visible at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      hasTouch: true,
      isMobile: true,
      baseURL: "http://127.0.0.1:3107",
    });
    await session(context);
    const page = await context.newPage();
    await page.goto("/forms/form-a");
    const action = page.getByRole("button", { name: `View submission ${responseId}`, exact: true });
    await expect
      .poll(() => action.evaluate((element) => getComputedStyle(element).opacity))
      .toBe("1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390)
      await page.screenshot({ path: "/tmp/churchos-form-detail-mobile.png", fullPage: true });
    await context.close();
  });

test("switching forms replaces answer headers and records", async ({ page, context }) => {
  await session(context);
  await page.goto("/forms/submissions");
  await page.getByRole("combobox").filter({ hasText: "Select a form" }).click();
  await page.getByRole("option", { name: "Volunteer application" }).click();
  await expect(
    page.getByRole("table", { name: "Volunteer application submissions" }),
  ).toBeVisible();
  await page.getByRole("combobox").filter({ hasText: "Volunteer application" }).click();
  await page.getByRole("option", { name: "Equipment request" }).click();
  const table = page.getByRole("table", { name: "Equipment request submissions" });
  await expect(
    table.getByRole("columnheader", { name: "Equipment name", exact: false }),
  ).toBeVisible();
  await expect(table.getByRole("cell", { name: "Keyboard", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "0", exact: true }).first()).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Email address", exact: false }),
  ).toHaveCount(0);
  await expect(table.getByText("Grace Adeyemi")).toHaveCount(0);
});

test("form readers without submissions permission never fetch responses", async ({
  page,
  context,
}) => {
  await session(context, false, false);
  await page.goto("/forms/form-a");
  await expect(page.getByRole("heading", { name: "Questions in this form" })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  const requests = await page.evaluate(
    () => (window as unknown as { formRequests: string[] }).formRequests,
  );
  expect(requests.some((path) => path.includes("/submissions"))).toBe(false);
  await expect(page.getByRole("button", { name: "More form actions" })).toHaveCount(0);
});

test("selection checkboxes do not displace the two record identifiers", async ({
  page,
  context,
}) => {
  await session(context);
  await page.goto("/members");
  const table = page.getByRole("table").first();
  await expect(table.locator("thead [data-pinned-column]")).toHaveText(["Member", "Contact"]);
  await page.getByRole("checkbox", { name: "Select Grace Adeyemi", exact: true }).check();
  await expect(
    page.getByRole("checkbox", { name: "Select Grace Adeyemi", exact: true }),
  ).toBeChecked();
  await expect(table.locator("thead th").first()).not.toHaveAttribute("data-pinned-column");
});

test("fill view identifies the opened form and labels its questions", async ({ page, context }) => {
  await session(context, false, false);
  await page.goto("/forms/form-a/fill");
  await expect(
    page.getByRole("heading", { name: "Volunteer application", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("4 questions", { exact: true })).toBeVisible();
  await expect(page.getByText("2 required", { exact: true })).toBeVisible();
  await page.getByLabel("Full name", { exact: false }).fill("Grace Adeyemi");
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue("Grace Adeyemi");
});
