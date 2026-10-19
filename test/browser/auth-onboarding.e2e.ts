import { test, expect, type BrowserContext, type Page } from "@playwright/test";
const reference = "COSUB_" + "a".repeat(32);
async function publicSession(context: BrowserContext) {
  await context.route("**/api/session", (r) =>
    r.fulfill({ json: { hasSession: false } }),
  );
}
async function churchStep(page: Page) {
  await page
    .getByLabel("Church Name", { exact: true })
    .fill("Grace Community Church");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
async function accountStep(page: Page) {
  await page.getByLabel("First Name", { exact: true }).fill("Grace");
  await page.getByLabel("Last Name", { exact: true }).fill("Admin");
  await page
    .getByLabel("Email Address", { exact: true })
    .fill("grace@example.org");
  await page
    .getByLabel("Password", { exact: true })
    .fill("LongUniquePassword!27");
  await page
    .getByLabel("Confirm Password", { exact: true })
    .fill("LongUniquePassword!27");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});
test("registration validates each step, preserves edits, submits plan and clears password", async ({
  page,
  context,
}) => {
  await publicSession(context);
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/backend/auth/register", (r) => {
    payload = r.request().postDataJSON();
    return r.fulfill({
      json: {
        success: true,
        data: { userId: "u", churchId: "c", email: "grace@example.org" },
      },
    });
  });
  await page.goto("/register?plan=network&cycle=annual");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Church Name", { exact: true })).toBeFocused();
  await churchStep(page);
  await accountStep(page);
  await expect(page.getByRole("radio", { name: /Network/ })).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Yearly · save 10%", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("USD 432", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit church", exact: true }).click();
  await expect(page.getByLabel("Church Name", { exact: true })).toHaveValue(
    "Grace Community Church",
  );
  await page
    .getByLabel("Church Name", { exact: true })
    .fill("Grace Church Updated");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Email Address", { exact: true })).toHaveValue(
    "grace@example.org",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Create account & continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your church has a home.", exact: true }),
  ).toBeVisible();
  expect(payload).toMatchObject({
    churchName: "Grace Church Updated",
    plan: "network",
    billingCycle: "annual",
    email: "grace@example.org",
  });
  expect(payload).not.toHaveProperty("amount");
  await expect(
    page.getByRole("link", {
      name: "Continue to secure checkout",
      exact: true,
    }),
  ).toHaveAttribute("href", "/login?returnTo=%2Fsubscription");
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("LongUniquePassword");
});
test("mismatched passwords block account progress", async ({
  page,
  context,
}) => {
  await publicSession(context);
  await page.goto("/register");
  await churchStep(page);
  await page.getByLabel("First Name", { exact: true }).fill("A");
  await page.getByLabel("Last Name", { exact: true }).fill("B");
  await page.getByLabel("Email Address", { exact: true }).fill("a@example.org");
  await page.getByLabel("Password", { exact: true }).fill("LongPassword1!");
  await page
    .getByLabel("Confirm Password", { exact: true })
    .fill("DifferentPassword2!");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Passwords do not match." }),
  ).toHaveText("Passwords do not match.");
  await expect(page.getByLabel("Email Address", { exact: true })).toBeVisible();
});
test("registration failure retains data for a safe retry", async ({
  page,
  context,
}) => {
  await publicSession(context);
  await page.route("**/api/backend/auth/register", (r) =>
    r.fulfill({
      status: 503,
      json: { success: false, error: { message: "Unavailable" } },
    }),
  );
  await page.goto("/register");
  await churchStep(page);
  await accountStep(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Create account & continue", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "unavailable" }),
  ).toContainText("unavailable");
  await expect(
    page.getByText("Grace Community Church", { exact: true }),
  ).toBeVisible();
});
async function billingSession(
  context: BrowserContext,
  options: {
    active?: boolean;
    grants?: string[];
    gateways?: string[];
    pending?: boolean;
  } = {},
) {
  await context.addInitScript(
    ({ reference, options }) => {
      const original = window.fetch;
      let active = options.active ?? false;
      const calls: { path: string; body: unknown }[] = [];
      Object.assign(window, { billingCalls: calls });
      window.fetch = async (input, init) => {
        const path = new URL(
          input instanceof Request ? input.url : String(input),
          location.origin,
        ).pathname;
        if (!path.startsWith("/api/")) return original(input, init);
        if (path === "/api/session")
          return new Response(JSON.stringify({ hasSession: true }));
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ path, body });
        let data: unknown = {};
        const status = () => ({
          active,
          subscription: {
            plan: "essentials",
            cycle: "monthly",
            paid_until: active ? "2027-01-18T00:00:00Z" : null,
          },
          gateways: options.gateways ?? ["paystack", "flutterwave"],
          latestPayment:
            options.pending && !active
              ? {
                  reference,
                  gateway: "paystack",
                  plan: "essentials",
                  cycle: "monthly",
                  amount: 10000,
                  currency: "NGN",
                }
              : null,
        });
        if (path.endsWith("/auth/session"))
          data = { userId: "u", email: "admin@example.org" };
        else if (path.endsWith("/profiles/me"))
          data = {
            profileId: "p",
            userId: "u",
            churchId: "c",
            firstName: "Admin",
            lastName: "User",
            status: "active",
            role: ["church_admin"],
            isAdminHq: true,
            permissions: options.grants ?? ["billing:read", "billing:update"],
          };
        else if (path.endsWith("/billing/subscription")) data = status();
        else if (path.endsWith("/billing/quote")) data = {
          quoteId: 'COSQ_' + 'b'.repeat(32), currency: body.currency,
          amount: ({ essentials: 10, community: 20, network: 40 }[body.plan as 'essentials' | 'community' | 'network'] || 10) * (body.cycle === 'annual' ? 10.8 : 1) * 1000,
          expiresAt: new Date(Date.now() + 900000).toISOString(), intent: 'renewal', renewBy: '2027-01-18T00:00:00Z',
        };
        else if (path.endsWith("/billing/verify")) {
          active = true;
          data = status();
        } else if (path.endsWith("/billing/checkout"))
          return new Response(
            JSON.stringify({
              success: false,
              error: { message: "Provider temporarily unavailable" },
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { "Content-Type": "application/json" },
        });
      };
    },
    { reference, options },
  );
}
test("gateway return is verified server-side before showing activation", async ({
  page,
  context,
}) => {
  await billingSession(context);
  await page.goto(`/subscription?reference=${reference}&status=success`);
  await expect(
    page.getByText("Payment verified. Your subscription is active.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to workspace", exact: true }),
  ).toHaveAttribute("href", "/dashboard");
  const calls = await page.evaluate(
    () =>
      (window as unknown as { billingCalls: { path: string; body: unknown }[] })
        .billingCalls,
  );
  expect(calls.filter((c) => c.path.endsWith("/billing/verify"))).toEqual([
    { path: "/api/backend/billing/verify", body: { reference } },
  ]);
  await expect(page).toHaveURL(/\/subscription$/);
});
test("checkout shows a recoverable error without losing the account", async ({
  page,
  context,
}) => {
  await billingSession(context);
  await page.goto("/subscription");
  await page.getByRole("button", { name: "Choose Network", exact: true }).click();
  await page.getByLabel("Billing period").selectOption("annual");
  await expect(page.getByText("USD 432", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Continue to payment", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("unavailable");
  await expect(
    page.getByRole("button", { name: "Continue to payment", exact: true }),
  ).toBeEnabled();
});
test("pending checkout can be checked after returning without a callback", async ({
  page,
  context,
}) => {
  await billingSession(context, { pending: true });
  await page.goto("/subscription");
  await expect(
    page.getByRole("button", { name: "Resume secure checkout", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "I’ve paid — check payment", exact: true })
    .click();
  await expect(
    page.getByText("Payment verified. Your subscription is active.", { exact: true }),
  ).toBeVisible();
});
test("unconfigured platform gateway never offers payment", async ({
  page,
  context,
}) => {
  await billingSession(context, { gateways: [] });
  await page.goto("/subscription");
  await expect(page.getByText(/Checkout is being configured/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to payment", exact: true }),
  ).toBeDisabled();
});
test("non-billing roles cannot initialize checkout", async ({
  page,
  context,
}) => {
  await billingSession(context, { grants: [] });
  await page.goto("/subscription");
  await expect(
    page.getByText(/Your church administrator manages the ChurchOS subscription/),
  ).toContainText("church administrator manages");
  await expect(
    page.getByRole("button", { name: "Continue to payment", exact: true }),
  ).toHaveCount(0);
});
for (const route of [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
])
  test(`mobile ${route} has no overflow and retains navigation`, async ({
    page,
    context,
  }) => {
    await publicSession(context);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("link", { name: "← Back to ChurchOS", exact: true }),
    ).toHaveAttribute("href", "/");
    if (route === "/login")
      await expect(
        page.getByText("Quick sign-in (seeded accounts)", { exact: true }),
      ).toBeVisible();
  });
test("auth desktop design preview", async ({ page, context }) => {
  await publicSession(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/register");
  await expect(page.getByLabel("Church Name", { exact: true })).toBeVisible();
  await expect(
    page.locator('[aria-label="Illustration of a connected church workspace"]'),
  ).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("heading", { level: 1 }).locator("../.."),
  ).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "/tmp/churchos-auth-registration-desktop.png",
    fullPage: true,
  });
  await page.goto("/login");
  await expect(page.getByLabel("Email Address", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1 }).locator("../.."),
  ).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "/tmp/churchos-auth-login-desktop.png",
    fullPage: true,
  });
});

test("password recovery sends the email and gives a non-enumerating confirmation", async ({
  page,
  context,
}) => {
  await publicSession(context);
  let body: unknown;
  await page.route("**/api/backend/auth/forgot-password", (route) => {
    body = route.request().postDataJSON();
    return route.fulfill({ json: { success: true, data: { success: true } } });
  });
  await page.goto("/forgot-password");
  await page
    .getByLabel("Email Address", { exact: true })
    .fill("recover@example.org");
  await page
    .getByRole("button", { name: "Send reset link", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your email", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/If an account exists/)).toBeVisible();
  expect(body).toEqual({ email: "recover@example.org" });
});
test("reset password preserves the recovery token in memory and removes it from the URL", async ({
  page,
  context,
}) => {
  await publicSession(context);
  let body: unknown;
  await page.route("**/api/backend/auth/reset-password", (route) => {
    body = route.request().postDataJSON();
    return route.fulfill({ json: { success: true, data: { success: true } } });
  });
  await page.goto("/reset-password?token_hash=test-recovery-token");
  await expect(page).toHaveURL(/\/reset-password$/);
  await page
    .getByLabel("New Password", { exact: true })
    .fill("LongNewPassword!29");
  await page
    .getByLabel("Confirm Password", { exact: true })
    .fill("LongNewPassword!29");
  await page
    .getByRole("button", { name: "Save new password", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Password Reset Complete", exact: true }),
  ).toBeVisible();
  expect(body).toEqual({
    token: "test-recovery-token",
    newPassword: "LongNewPassword!29",
  });
});
test("redesigned sign-in retains the authenticator and recovery-code flow", async ({
  page,
  context,
}) => {
  await publicSession(context);
  await page.route("**/api/backend/auth/login", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          requiresTwoFactor: true,
          twoFactorMethod: "authenticator",
          challengeToken: "test-challenge",
          userId: "u",
          twoFactorEmail: "admin@example.org",
        },
      },
    }),
  );
  await page.goto("/login");
  await page
    .getByLabel("Email Address", { exact: true })
    .fill("admin@example.org");
  await page
    .getByLabel("Password", { exact: true })
    .fill("LongUniquePassword!29");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Verify Your Identity", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Verification Code", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use a recovery code", exact: true })
    .click();
  await expect(page.getByLabel("Recovery Code", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("test-challenge");
});

test("cancelled checkout keeps the account available for another attempt", async ({
  page,
  context,
}) => {
  await billingSession(context);
  await page.goto("/subscription?status=cancelled");
  await expect(
    page.getByRole("status").filter({ hasText: "Payment was cancelled" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to payment", exact: true }),
  ).toBeEnabled();
});
