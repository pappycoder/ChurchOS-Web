import { test, expect, type BrowserContext } from "@playwright/test";
import { COARSE_RESOURCES, EXTRA_PERMISSIONS, PERMISSION_ACTIONS, SURFACE_RESOURCES } from "../../src/lib/menu-catalog";
import { mockTawkWidget } from "../fixtures/tawk-widget";

test.use({ actionTimeout: 15000 });

const grants = new Set<string>(EXTRA_PERMISSIONS);
for (const resource of [...COARSE_RESOURCES, ...Object.keys(SURFACE_RESOURCES)])
  for (const action of PERMISSION_ACTIONS) grants.add(`${resource}:${action}`);
for (const [resource, surfaces] of Object.entries(SURFACE_RESOURCES))
  for (const surface of surfaces)
    for (const action of PERMISSION_ACTIONS) grants.add(`${resource}:${surface}:${action}`);
const stamp = "2026-10-28T08:00:00Z";
const primary = { memberId: "member-a", churchId: "church-a", branchId: "branch-a", firstName: "Ada", lastName: "Chidimma Nwankwo-Okafor", email: "ada.long.contact.address@example.test", phone: "+2348012345678", whatsappNumber: "+2348012345678", gender: "female", dateOfBirth: "1990-06-12", address: "24 Community Fellowship Avenue", city: "Lagos", state: "Lagos", status: "active", memberSince: stamp, notes: "Welcomes new visitors and serves with the community care team.", customFields: { Occupation: "Community programme coordinator", Ministry: "Welcome team" }, createdAt: stamp, updatedAt: stamp, archivedAt: undefined as string | undefined };
const familyName = "Nwankwo-Okafor Community Household";

type Options = { readonly?: boolean; branch?: boolean; empty?: boolean; failDirectory?: boolean; failMetrics?: boolean; waitMetrics?: Promise<void>; paginated?: boolean; largeHousehold?: boolean };
async function fixture(context: BrowserContext, options: Options = {}) {
  const calls: { method: string; path: string; query: string; body?: Record<string, unknown> }[] = [];
  const members = [
    { ...primary },
    { ...primary, memberId: "member-b", firstName: "Chidi", lastName: "Nwankwo", email: "chidi@example.test" },
    { ...primary, memberId: "member-c", firstName: "Bola", lastName: "Adeyemi", email: "bola@example.test", branchId: "branch-b" },
  ];
  if (options.paginated) for (let index = 3; index < 32; index++) members.push({ ...primary, memberId: `member-${index}`, firstName: `Member${index}`, email: `member${index}@example.test` });
  const families = [
    { familyId: "family-a", churchId: "church-a", name: familyName, headId: "member-a", members: [
      { id: "link-a", memberId: "member-a", firstName: primary.firstName, lastName: primary.lastName, relationship: "other", isHead: true },
      { id: "link-b", memberId: "member-b", firstName: "Chidi", lastName: "Nwankwo", relationship: "spouse", isHead: false },
    ], createdAt: stamp, archivedAt: undefined as string | undefined },
    { familyId: "family-b", churchId: "church-a", name: "Adeyemi Family", headId: "", members: [] as { id: string; memberId: string; firstName: string; lastName: string; relationship: string; isHead: boolean }[], createdAt: stamp, archivedAt: undefined as string | undefined },
  ];
  if (options.largeHousehold) for (let index = 2; index < 20; index++) families[0].members.push({ id: `large-link-${index}`, memberId: `large-member-${index}`, firstName: `Household member ${index}`, lastName: "Nwankwo-Okafor", relationship: "other", isHead: false });
  await context.addCookies([{ name: "churchos_token", value: "members-ui-fixture", url: "http://127.0.0.1:3107" }]);
  await context.route("https://**", route => route.abort());
  await context.route("https://embed.tawk.to/**", route => route.fulfill({ contentType: "application/javascript", body: mockTawkWidget.replaceAll("bubble.hidden = false;", "bubble.hidden = true;") }));
  await context.route("**/api/session", route => route.fulfill({ json: { hasSession: true } }));
  await context.route("**/api/backend/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/backend", "");
    const method = request.method();
    const body = request.headers()["content-type"]?.includes("application/json") ? request.postDataJSON() as Record<string, unknown> : undefined;
    calls.push({ method, path, query: url.search, body });
    let data: unknown = { data: [], meta: { page: 1, limit: 15, total: 0, totalPages: 0 } };
    if (path === "/profiles/me") data = { profileId: "profile-a", userId: "user-a", churchId: "church-a", branchId: "branch-a", church: { name: "ChurchOS Community Fellowship" }, branch: { name: "Main Branch" }, firstName: "Grace", lastName: "Reviewer", email: "grace@example.test", role: [options.readonly ? "member" : "church_admin"], status: "active", isAdminHq: !options.branch, permissions: options.readonly ? ["members:all:read", "families:read", "branches:read"] : [...grants], planFeatures: ["staff_roles", "giving", "events", "groups", "forms", "reports", "email", "media", "tickets", "pastoral", "assets", "analytics", "calls", "sms", "whatsapp"] };
    else if (path === "/auth/session") data = { userId: "user-a", email: "grace@example.test" };
    else if (path.endsWith("/unread") || path.endsWith("/unread-count")) data = { count: 0 };
    else if (path === "/church/roles") data = { roles: [] };
    else if (path === "/church") data = { churchId: "church-a", name: "ChurchOS Community Fellowship" };
    else if (path === "/billing/subscription") data = { limits: {}, usage: {}, subscription: { paid_until: "2099-01-01T00:00:00Z" } };
    else if (path === "/branches") data = { data: [{ branchId: "branch-a", name: "Main Branch", isActive: true }, { branchId: "branch-b", name: "West Branch", isActive: true }], meta: { total: 2, page: 1, limit: 100, totalPages: 1 } };
    else if (path === "/members/bulk-import") {
      const rows = body?.members as Record<string, unknown>[];
      data = { created: rows.length, errors: [] };
    } else if (path === "/media/upload/image") data = { url: "/brand/churchos-emblem.png" };
    else if ((path === "/members" || path === "/families") && method === "GET") {
      const limit = Number(url.searchParams.get("limit") || 15);
      const metric = limit === 1 || (path === "/families" && limit === 100);
      if (metric) await options.waitMetrics;
      if ((metric && options.failMetrics) || (!metric && options.failDirectory)) return route.fulfill({ status: 503, json: { success: false, error: { message: "Directory temporarily unavailable" } } });
      const search = (url.searchParams.get("search") || "").toLowerCase();
      let rows = options.empty ? [] : (path === "/members" ? members : families).filter(row => !!row.archivedAt === (url.searchParams.get("archived") === "true"));
      rows = rows.filter(row => JSON.stringify(row).toLowerCase().includes(search));
      if (path === "/members") {
        const branchId = url.searchParams.get("branchId");
        const status = url.searchParams.get("status");
        rows = rows.filter(row => (!branchId || (row as typeof primary).branchId === branchId) && (!status || (row as typeof primary).status === status));
      }
      const page = Number(url.searchParams.get("page") || 1);
      data = { data: rows.slice((page - 1) * limit, page * limit), meta: { total: rows.length, page, limit, totalPages: Math.ceil(rows.length / limit) } };
    } else if (path === "/members/search") data = { data: members.filter(member => `${member.firstName} ${member.lastName}`.toLowerCase().includes((url.searchParams.get("q") || "").toLowerCase())) };
    else if (path === "/members" && method === "POST") {
      const created = { ...primary, ...body, memberId: "member-new" };
      members.push(created as typeof primary); data = created;
    } else if (path.match(/^\/members\/[^/]+$/)) {
      const member = members.find(item => item.memberId === path.split("/")[2]) || members[0];
      if (method === "PATCH") Object.assign(member, body);
      data = member;
    } else if (path === "/members/member-a/notes") {
      members[0].notes += `\n${body?.note}`; data = { success: true };
    } else if (path === "/members/member-a/archive" || path === "/members/member-a/restore-archive") {
      members[0].archivedAt = path.endsWith("/archive") ? stamp : undefined; data = members[0];
    } else if (path.endsWith("/giving") || path.endsWith("/attendance")) data = { data: [] };
    else if (path === "/families" && method === "POST") { const created = { ...families[1], ...body, familyId: "family-new" }; families.push(created as typeof families[0]); data = created; }
    else if (path === "/families/family-a/members" && method === "POST") {
      const member = members.find(item => item.memberId === body?.memberId)!;
      families[0].members.push({ id: "link-new", memberId: member.memberId, firstName: member.firstName, lastName: member.lastName, relationship: String(body?.relationship || "other"), isHead: !!body?.isHead }); data = families[0];
    } else if (path.startsWith("/families/family-a/members/") && method === "DELETE") { families[0].members = families[0].members.filter(item => item.memberId !== path.split("/")[4]); data = families[0]; }
    else if (path.match(/^\/families\/[^/]+$/)) { const family = families.find(item => item.familyId === path.split("/")[2]) || families[0]; if (method === "PATCH") Object.assign(family, body); data = family; }
    return route.fulfill({ json: { success: true, data } });
  });
  return calls;
}

const pages = [
  { path: "/members", name: "members", heading: "Members" },
  { path: "/members/new", name: "registration", heading: "Add Member" },
  { path: "/members/member-a", name: "member-detail", heading: "Ada Chidimma Nwankwo-Okafor" },
  { path: "/members/import", name: "import", heading: "Import Members" },
  { path: "/members/families", name: "families", heading: "Families" },
  { path: "/members/families/family-a", name: "family-detail", heading: familyName },
];

for (const width of [375, 768, 1024, 1440]) {
  test(`six member pages fit and support both themes at ${width}px`, async ({ page, context }, info) => {
    test.setTimeout(180000);
    await fixture(context);
    await page.setViewportSize({ width, height: 1000 });
    for (const screen of pages) {
      await page.goto(screen.path);
      await expect(page.getByRole("heading", { level: 1, name: screen.heading, exact: true })).toBeVisible();
      if (screen.name === "member-detail") await expect(page.getByRole("heading", { name: "Contact Information", exact: true })).toBeVisible();
      if (screen.name === "members") await expect(page.getByRole("link", { name: "Ada Chidimma Nwankwo-Okafor", exact: true })).toBeVisible();
      if (screen.name === "families") await expect(page.getByText(familyName, { exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const theme of ["light", "dark"]) {
        if (await page.locator("html").evaluate(element => element.classList.contains("dark")) !== (theme === "dark")) await page.getByRole("button", { name: `Switch to ${theme} mode`, exact: true }).click();
        await page.mouse.move(0, 0);
        await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
        await page.screenshot({ path: info.outputPath(`${screen.name}-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
      }
    }
  });
}

test("member directory filters, sort, selection and CSV exports retain their scope", async ({ page, context }) => {
  const calls = await fixture(context);
  await page.goto("/members");
  await page.getByRole("searchbox", { name: "Search name, email, phone..." }).fill("Ada");
  await expect.poll(() => calls.some(call => call.path === "/members" && call.query.includes("search=Ada"))).toBe(true);
  await page.getByRole("combobox", { name: "Member status", exact: true }).click();
  await page.getByRole("option", { name: "Active", exact: true }).click();
  await page.getByRole("combobox", { name: "Sort members by" }).click();
  await page.getByRole("option", { name: "Last Name", exact: true }).click();
  await expect.poll(() => calls.some(call => call.query.includes("search=Ada") && call.query.includes("sortBy=last_name") && call.query.includes("status=active"))).toBe(true);
  await page.getByRole("checkbox", { name: "Select Ada Chidimma Nwankwo-Okafor", exact: true }).check();
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export as CSV" }).click();
  expect((await download).suggestedFilename()).toContain("members-export");
  expect(calls.filter(call => call.method !== "GET")).toHaveLength(0);
});

test("directory pagination and branch scope keep using existing query parameters", async ({ page, context }) => {
  const calls = await fixture(context, { paginated: true });
  await page.goto("/members");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect.poll(() => calls.some(call => call.path === "/members" && call.query.includes("page=2"))).toBe(true);
  await page.getByRole("combobox", { name: "Branch filter", exact: true }).click();
  await page.getByRole("option", { name: "West Branch", exact: true }).click();
  await expect.poll(() => calls.some(call => call.path === "/members" && call.query.includes("page=1") && call.query.includes("branchId=branch-b"))).toBe(true);
});

test("failed statistics are unavailable and directory errors preserve filters for recovery", async ({ page, context }) => {
  const options = { failMetrics: true, failDirectory: true };
  await fixture(context, options);
  await page.goto("/members");
  await expect(page.getByRole("heading", { level: 3, name: "—", exact: true })).toHaveCount(3);
  await expect(page.getByRole("searchbox", { name: "Search name, email, phone..." })).toBeVisible();
  options.failDirectory = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ada Chidimma Nwankwo-Okafor", exact: true })).toBeVisible();
  await expect(page.getByText("Count unavailable", { exact: true })).toHaveCount(3);
});

test("loading and empty count states are distinct", async ({ page, context }) => {
  let release!: () => void;
  const waitMetrics = new Promise<void>(resolve => { release = resolve; });
  await fixture(context, { empty: true, waitMetrics });
  try {
    await page.goto("/members");
    await expect(page.getByRole("status", { name: "Loading Total Members", exact: true })).toBeVisible();
  } finally { release(); }
  await expect(page.getByRole("heading", { level: 3, name: "0", exact: true })).toHaveCount(3);
  await expect(page.getByText("No members found", { exact: true })).toBeVisible();
});

test("quick add and editing retain validation and mutation payloads", async ({ page, context }) => {
  const calls = await fixture(context);
  await page.goto("/members");
  await page.getByRole("button", { name: "Quick Add (basic details)", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Add Member", exact: true });
  await dialog.getByRole("button", { name: "Add Member", exact: true }).click();
  await expect(dialog.getByText("First name is required")).toBeVisible();
  await dialog.getByLabel("First Name", { exact: false }).fill("Amina");
  await dialog.getByLabel("Last Name", { exact: false }).fill("Bello");
  await dialog.getByRole("button", { name: "Add Member", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(calls.find(call => call.method === "POST" && call.path === "/members")?.body).toMatchObject({ firstName: "Amina", lastName: "Bello" });
  await page.goto("/members/member-a");
  await page.getByText("Manage record", { exact: true }).click();
  await page.getByRole("button", { name: "Edit Member", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Edit Member", exact: true });
  await dialog.getByLabel("First Name", { exact: false }).fill("Adaora");
  await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(calls.find(call => call.method === "PATCH" && call.path === "/members/member-a")?.body).toMatchObject({ firstName: "Adaora", status: "active", customFields: primary.customFields });
});

test("registration keeps custom fields and dirty-cancel protection", async ({ page, context }) => {
  const calls = await fixture(context);
  await page.goto("/members/new");
  await page.getByLabel("First Name", { exact: false }).fill("Zainab");
  await page.getByLabel("Last Name", { exact: false }).fill("Ahmed");
  await page.locator('input[type="file"]').setInputFiles("public/brand/churchos-emblem.png");
  await page.getByRole("button", { name: "Search families...", exact: true }).click();
  await page.getByRole("option", { name: new RegExp(familyName) }).click();
  await page.getByRole("button", { name: /Add.*field/i }).click();
  await page.getByPlaceholder("e.g. Occupation").fill("Occupation");
  await page.getByPlaceholder("e.g. Engineer").fill("Teacher");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(/\/members\/new$/);
  await expect(page.getByLabel("First Name", { exact: false })).toHaveValue("Zainab");
  await page.getByRole("button", { name: "Add Member", exact: true }).click();
  await expect.poll(() => calls.some(call => call.method === "POST" && call.path === "/members")).toBe(true);
  expect(calls.find(call => call.method === "POST" && call.path === "/members")?.body).toMatchObject({ firstName: "Zainab", lastName: "Ahmed", customFields: { Occupation: "Teacher" } });
  await expect.poll(() => calls.some(call => call.path === "/families/family-a/members" && call.body?.memberId === "member-new")).toBe(true);
  expect(calls.some(call => call.path === "/media/upload/image")).toBe(true);
  expect(calls.find(call => call.method === "PATCH" && call.path === "/members/member-new")?.body).toEqual({ photoUrl: "/brand/churchos-emblem.png" });
});

test("member tabs retain note drafts and archive confirmation stays explicit", async ({ page, context }) => {
  const calls = await fixture(context);
  await page.goto("/members/member-a");
  await page.getByPlaceholder("Add an admin note for this member...").fill("Arrange a follow-up visit");
  await page.getByRole("tab", { name: "Attendance", exact: true }).click();
  await expect(page).toHaveURL(/tab=attendance/);
  await page.getByRole("tab", { name: "Giving", exact: true }).click();
  await page.getByRole("tab", { name: "Overview & notes", exact: true }).click();
  await expect(page.getByPlaceholder("Add an admin note for this member...")).toHaveValue("Arrange a follow-up visit");
  await page.getByRole("button", { name: "Add Note", exact: true }).click();
  await expect.poll(() => calls.some(call => call.path === "/members/member-a/notes" && call.body?.note === "Arrange a follow-up visit")).toBe(true);
  await page.getByText("Manage record", { exact: true }).click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /Archive Ada/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(calls.filter(call => call.path.endsWith("/archive"))).toHaveLength(0);
});

test("read-only and branch-scoped screens preserve action and field gates", async ({ page, context }) => {
  await fixture(context, { readonly: true, branch: true });
  await page.goto("/members");
  await expect(page.getByRole("button", { name: "Add Member", exact: true })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Branch filter locked to your branch" })).toBeDisabled();
  await page.goto("/members/member-a");
  await expect(page.getByRole("tab", { name: "Giving", exact: true })).toHaveCount(0);
  await expect(page.getByText("Manage record", { exact: true })).toHaveCount(0);
  await expect(page.getByPlaceholder("Add an admin note for this member...")).toHaveCount(0);
  await page.goto("/members/families/family-a");
  await expect(page.getByRole("button", { name: "Add Member", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove", exact: true })).toHaveCount(0);
});

test("family forms and linking preserve household relationships", async ({ page, context }) => {
  const calls = await fixture(context);
  await page.goto("/members/families");
  await page.getByRole("button", { name: "Add Family", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Add Family", exact: true });
  await form.getByLabel("Family Name", { exact: false }).fill("Bello Household");
  await form.getByRole("button", { name: "Add Family", exact: true }).click();
  await expect(form).toBeHidden();
  expect(calls.find(call => call.method === "POST" && call.path === "/families")?.body).toMatchObject({ name: "Bello Household" });
  await page.goto("/members/families/family-a");
  await page.getByText("Manage record", { exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit Family", exact: true });
  await edit.getByLabel("Family Name", { exact: false }).fill(`${familyName} Updated`);
  await edit.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(edit).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: `${familyName} Updated`, exact: true })).toBeVisible();
  expect(calls.find(call => call.method === "PATCH" && call.path === "/families/family-a")?.body).toMatchObject({ name: `${familyName} Updated` });
  await page.getByRole("button", { name: "Add Member", exact: true }).click();
  const add = page.getByRole("dialog", { name: `Add Member to ${familyName} Updated`, exact: true });
  await add.getByRole("button", { name: "Search members...", exact: true }).click();
  await page.getByRole("option", { name: /Bola Adeyemi/ }).click();
  await add.getByRole("combobox", { name: "Relationship", exact: false }).click();
  await page.getByRole("option", { name: "Other", exact: true }).click();
  await add.getByRole("button", { name: "Add Member", exact: true }).click();
  await expect(add).toBeHidden();
  expect(calls.find(call => call.method === "POST" && call.path === "/families/family-a/members")?.body).toMatchObject({ memberId: "member-c" });
  const row = page.getByRole("row").filter({ has: page.getByRole("link", { name: /Bola Adeyemi/ }) });
  await row.getByRole("button", { name: "Remove", exact: true }).click();
  const remove = page.getByRole("dialog", { name: "Remove Family Member", exact: true });
  await expect(remove.getByText(/Their member record is kept/)).toBeVisible();
  await remove.getByRole("button", { name: "Remove Member", exact: true }).click();
  await expect(remove).toBeHidden();
  expect(calls.some(call => call.method === "DELETE" && call.path === "/families/family-a/members/member-c")).toBe(true);
});

test("member import progress is scoped and preserves preview and confirmation", async ({ page, context }) => {
  const calls = await fixture(context);
  await page.goto("/members/import");
  const progress = page.getByRole("list", { name: "Import progress" });
  await expect(progress.locator('[aria-current="step"]')).toHaveText(/Upload/);
  await page.locator('input[type="file"]').setInputFiles({ name: "members.csv", mimeType: "text/csv", buffer: Buffer.from("First Name,Last Name,Email\nZainab,Ahmed,zainab@example.test") });
  await expect(progress.locator('[aria-current="step"]')).toHaveText(/Map/);
  await page.getByRole("button", { name: "Preview Import", exact: true }).click();
  await expect(progress.locator('[aria-current="step"]')).toHaveText(/Review/);
  await page.getByRole("button", { name: "Import Members", exact: true }).click();
  await expect(progress.locator('[aria-current="step"]')).toHaveText(/Done/);
  expect(calls.filter(call => call.path === "/members/bulk-import").map(call => call.body?.dryRun)).toEqual([true, false]);
  await page.goto("/visitors/import");
  await expect(page.getByRole("list", { name: "Import progress" })).toHaveCount(0);
  const visitorCard = page.locator('[data-slot="card"]').first();
  await expect(visitorCard).toBeVisible();
  expect(await visitorCard.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(await page.evaluate(() => { const probe = document.createElement("div"); probe.style.backgroundColor = "var(--card)"; document.body.append(probe); const value = getComputedStyle(probe).backgroundColor; probe.remove(); return value; }));
});


test("large households retain every linked member without page overflow", async ({ page, context }) => {
  await fixture(context, { largeHousehold: true });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/members/families/family-a");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(21);
  await expect(page.getByRole("link", { name: /Household member 19 Nwankwo-Okafor/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


test("directory table density and column visibility controls remain available", async ({ page, context }) => {
  await fixture(context);
  await page.goto("/members");
  await page.getByRole("button", { name: "Table options", exact: true }).click();
  await page.getByRole("button", { name: "Table view", exact: true }).click();
  await page.getByRole("button", { name: "Compact rows", exact: true }).click();
  await page.getByRole("button", { name: "Compact columns", exact: true }).click();
  await expect(page.getByRole("table")).toHaveAttribute("data-compact-rows", "true");
  await expect(page.getByRole("table")).toHaveAttribute("data-compact-columns", "true");
  await page.getByRole("button", { name: "Expand columns", exact: true }).click();
  await expect(page.getByRole("table")).toHaveAttribute("data-compact-columns", "false");
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { level: 1, name: "Members", exact: true }).click();
  await page.getByRole("button", { name: "Table options", exact: true }).click();
  await page.getByRole("button", { name: "Choose visible columns", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Status", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Status", exact: true })).toHaveCount(0);
});
