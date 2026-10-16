import { expect, test, type BrowserContext } from "@playwright/test";

async function session(context: BrowserContext, integrationGrants: string[]) {
  await context.addCookies([{ name: "churchos_token", value: "messaging-browser-test", url: "http://127.0.0.1:3107" }]);
  await context.addInitScript(({ grants }) => {
    const original = window.fetch.bind(window);
    let status = [
      { provider: "resend", mode: "platform", configured: true, updatedAt: null as string | null },
      { provider: "termii", mode: "platform", configured: true, updatedAt: null as string | null },
    ];
    const requests: { path: string; method: string; body?: Record<string, string> }[] = [];
    Object.assign(window, { messagingRequests: requests });
    window.fetch = async (input, options) => {
      const path = new URL(input instanceof Request ? input.url : String(input), location.origin).pathname;
      if (!path.startsWith("/api/")) return original(input, options);
      if (path === "/api/session") return new Response(JSON.stringify({ hasSession: true }));
      const method = options?.method ?? "GET";
      const body = options?.body ? JSON.parse(String(options.body)) : undefined;
      requests.push({ path, method, body });
      let data: unknown = { data: [], total: 0 };
      if (path.endsWith("/auth/session")) data = { userId: "test-user", email: "admin@example.org" };
      else if (path.endsWith("/profiles/me")) data = { userId: "test-user", profileId: "profile-a", churchId: "11111111-1111-4111-8111-111111111111", role: ["church_admin"], status: "active", isAdminHq: true, permissions: ["church:read", "church_settings:update", ...grants] };
      else if (path.endsWith("/church")) data = { churchId: "11111111-1111-4111-8111-111111111111", name: "Test church", country: "Nigeria", memberCount: 1, branchCount: 1 };
      else if (path.endsWith("/church/config")) data = { config: {} };
      else if (path.endsWith("/messaging-integrations")) data = status;
      else if (path.endsWith("/test")) data = { message: "Provider accepted the test. Confirm receipt on the destination device." };
      else if (path.includes("/messaging-integrations/") && method === "PUT") {
        const provider = path.split("/").at(-1);
        if (body.apiKey === "reject-this-key") return new Response(JSON.stringify({ success: false, error: { message: "Invalid account" } }), { status: 400, headers: { "Content-Type": "application/json" } });
        status = status.map(item => item.provider === provider ? { ...item, mode: body.mode, configured: body.mode !== "disabled", updatedAt: new Date().toISOString() } : item);
        data = status;
      }
      else if (path.endsWith("/unread-count")) data = { count: 0 };
      else if (path.endsWith("/roles") || path.endsWith("/roles/labels")) data = [];
      return new Response(JSON.stringify({ success: true, data }), { headers: { "Content-Type": "application/json" } });
    };
  }, { grants: integrationGrants });
}

test("admins can save encrypted-account inputs, send a deliberate test and disable sending", async ({ page, context }) => {
  await session(context, ["messaging_integrations:read", "messaging_integrations:update"]);
  await page.goto("/admin/settings");
  await page.getByRole("tab", { name: "Messaging", exact: true }).click();
  const email = page.locator("section#resend");
  await email.getByLabel("Sending account").selectOption("custom");
  await email.getByLabel("API key", { exact: true }).fill("browser-test-private-key");
  await email.getByLabel("Verified sender email").fill("church@example.org");
  await email.getByRole("button", { name: "Save account settings" }).click();
  await expect(email.getByLabel("API key", { exact: true })).toHaveValue("");
  await expect(email.getByText(/Saved account: custom/)).toBeVisible();
  await email.getByLabel("Test email address").fill("test@example.org");
  await email.getByRole("button", { name: "Send test message" }).click();
  await expect(email.getByRole("status")).toContainText("Provider accepted");
  const requests = await page.evaluate(() => (window as unknown as { messagingRequests: { path: string; method: string; body?: Record<string, string> }[] }).messagingRequests);
  expect(requests.find(row => row.method === "PUT")?.body).toEqual({ mode: "custom", apiKey: "browser-test-private-key", from: "church@example.org" });
  expect(requests.find(row => row.path.endsWith("/test"))?.body).toEqual({ channel: "email", recipient: "test@example.org" });
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain("browser-test-private-key");
  await email.getByLabel("Sending account").selectOption("disabled");
  await email.getByRole("button", { name: "Save account settings" }).click();
  await expect(email.getByText(/Saved account: disabled/)).toBeVisible();
  await expect(email.getByRole("button", { name: "Send test message" })).toHaveCount(0);
});

test("clears secrets after a rejected save and includes church-specific WhatsApp setup", async ({ page, context }) => {
  await session(context, ["messaging_integrations:read", "messaging_integrations:update"]);
  await page.goto("/admin/settings");
  await page.getByRole("tab", { name: "Messaging", exact: true }).click();
  const termii = page.locator("section#termii");
  await termii.getByLabel("Sending account").selectOption("custom");
  await termii.getByLabel("API key", { exact: true }).fill("reject-this-key");
  await termii.getByLabel("Approved SMS sender ID").fill("Church");
  await termii.getByRole("button", { name: "Save account settings" }).click();
  await expect(termii.getByLabel("API key", { exact: true })).toHaveValue("");
  await expect(termii.locator("code")).toContainText("/api/v1/whatsapp/webhook/11111111-1111-4111-8111-111111111111");
  await expect(termii.getByText(/Saved account: platform/)).toBeVisible();
});

test("read-only integration access exposes status without save or test actions", async ({ page, context }) => {
  await session(context, ["messaging_integrations:read"]);
  await page.goto("/admin/settings");
  await page.getByRole("tab", { name: "Messaging", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Email — Resend" })).toBeVisible();
  await expect(page.locator("#resend-mode")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save account settings" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send test message" })).toHaveCount(0);
});

test("users without integration permission never fetch credential status", async ({ page, context }) => {
  await session(context, []);
  await page.goto("/admin/settings");
  await expect(page.getByRole("tab", { name: "Security", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Messaging", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { messagingRequests: { path: string }[] }).messagingRequests.some(row => row.path.includes("messaging-integrations")))).toBe(false);
});
