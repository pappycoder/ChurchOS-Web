import { expect, test } from "@playwright/test";

const profileId = "11111111-1111-4111-8111-111111111111";
const churchId = "22222222-2222-4222-8222-222222222222";
const branchId = "33333333-3333-4333-8333-333333333333";
const passphrase = "correct horse battery staple";

test.beforeEach(async ({ context }) => {
  // Deterministic API fixture: no real account or application database is contacted.
  await context.addInitScript(
    ({ profileId, churchId, branchId }) => {
      const original = window.fetch.bind(window);
      Object.defineProperty(window, "__offlineNativeFetch", {
        value: original,
      });
      const members: Record<string, unknown>[] = [];
      const requests: string[] = [];
      Object.defineProperty(window, "__offlineApiCalls", { value: requests });
      window.fetch = async (input, options) => {
        const path = new URL(
          input instanceof Request ? input.url : String(input),
          location.origin,
        ).pathname;
        if (!path.startsWith("/api/")) return original(input, options);
        requests.push(path);
        if (!navigator.onLine) throw new TypeError("Offline");
        let data: unknown;
        if (path === "/api/session")
          return new Response(JSON.stringify({ hasSession: true }));
        if (path.endsWith("/auth/session"))
          data = { userId: "test-user", email: "test@example.com" };
        else if (path.endsWith("/profiles/me"))
          data = {
            profileId,
            churchId,
            branchId,
            firstName: "Test",
            lastName: "Secretary",
            role: ["secretary"],
            isAdminHq: false,
            branch: { branchId, name: "Lekki" },
          };
        else if (path.endsWith("/offline/snapshot"))
          data = {
            profileId,
            churchId,
            branchId,
            branchName: "Lekki",
            permissions: [
              "members:all:read",
              "members:new:create",
              "members:all:update",
              "forms:list:read",
            ],
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
            records: { member: members, visitor: [], form: [] },
          };
        else if (path.endsWith("/offline/push")) {
          const body = JSON.parse(String(options?.body));
          if (body.profileId !== profileId || body.churchId !== churchId)
            throw new Error("Invalid owner");
          data = body.mutations.map(
            (mutation: {
              mutationId: string;
              entityId: string;
              data: { firstName: string; lastName: string };
            }) => {
              members.push({
                id: mutation.entityId,
                first_name: mutation.data.firstName,
                last_name: mutation.data.lastName,
                updated_at: new Date().toISOString(),
                branch_id: branchId,
              });
              return {
                mutationId: mutation.mutationId,
                status: "accepted",
                version: new Date().toISOString(),
              };
            },
          );
        } else throw new Error(`Unexpected API call ${path}`);
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { "Content-Type": "application/json" },
        });
      };
    },
    { profileId, churchId, branchId },
  );
});

test("prepares, reopens offline, retains queued changes and syncs on reconnect", async ({
  page,
  context,
}) => {
  await page.goto("/offline");
  await page.getByRole("button", { name: "Load available branches" }).click();
  await expect(page.getByLabel("Branch", { exact: true })).toHaveValue(
    branchId,
  );
  await expect(page.getByLabel("Branch", { exact: true })).toBeDisabled();
  await page.getByLabel("Offline passphrase").fill(passphrase);
  await page.getByRole("button", { name: "Enable on this device" }).click();
  await expect(page.getByRole("button", { name: "Add member" })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Add member" }).click();
  await page.getByLabel("First name", { exact: true }).fill("OfflineAda");
  await page.getByLabel("Last name", { exact: true }).fill("Obi");
  await page.getByRole("button", { name: "Save on device" }).click();
  await expect(page.getByText("OfflineAda Obi", { exact: true })).toBeVisible();
  await expect(
    page.getByText("1 changes waiting to sync or review", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Unlock this device", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("OfflineAda Obi", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByLabel("Offline passphrase")
    .fill("a different wrong passphrase");
  await page.getByRole("button", { name: "Unlock workspace" }).click();
  await expect(
    page.getByText("Unlock this device", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("OfflineAda Obi", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("Offline passphrase").fill(passphrase);
  await page.getByRole("button", { name: "Unlock workspace" }).click();
  await expect(page.getByText("OfflineAda Obi", { exact: true })).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByText("All changes synced", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("OfflineAda Obi", { exact: true })).toBeVisible();
  // Exercise a real same-origin API request through the service worker too.
  await page.evaluate(async () => {
    const response = await Reflect.get(
      window,
      "__offlineNativeFetch",
    )("/api/session");
    if (!response.ok) throw new Error("API route unavailable");
    await response.json();
  });
  const urls = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (request) => request.url,
          ),
        ),
      )
    ).flat(),
  );
  expect(urls.some((url) => new URL(url).pathname.startsWith("/api/"))).toBe(
    false,
  );
  await page.evaluate(() => {
    const channel = new BroadcastChannel("churchos-session");
    channel.postMessage("ended");
    channel.close();
  });
  await expect(
    page.getByText("Unlock this device", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("OfflineAda Obi", { exact: true })).toHaveCount(
    0,
  );
});

test("offline shell remains available without a session and cannot enable a new device offline", async ({
  page,
  context,
}) => {
  await page.goto("/offline");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("Enable offline access", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enable on this device" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Load available branches" }),
  ).toBeDisabled();
});

test("locks the prepared workspace after inactivity without polling the server", async ({
  page,
  context,
}) => {
  await page.clock.install();
  await page.goto("/offline");
  await page.getByRole("button", { name: "Load available branches" }).click();
  await page.getByLabel("Offline passphrase").fill(passphrase);
  await page.getByRole("button", { name: "Enable on this device" }).click();
  await expect(page.getByRole("button", { name: "Add member" })).toBeVisible();
  await context.setOffline(true);
  const calls = await page.evaluate(
    () => Reflect.get(window, "__offlineApiCalls").length,
  );
  await page.clock.runFor(16 * 60 * 1000);
  expect(
    await page.evaluate(() => Reflect.get(window, "__offlineApiCalls").length),
  ).toBe(calls);
  await expect(
    page.getByText("Unlock this device", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add member" })).toHaveCount(0);
});
