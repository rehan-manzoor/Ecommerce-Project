import { test, expect } from "@playwright/test";

test.describe.serial("Admin dashboard", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD before running admin E2E tests.");
    }

    context = await browser.newContext();
    page = await context.newPage();

    await page.goto("/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/users/login") && response.request().method() === "POST"
    );

    await page
      .getByRole("button", {
        name: "Sign in",
        exact: true,
      })
      .click();

    const response = await responsePromise;

    if (!response.ok()) {
      const body = await response.text();

      throw new Error(`Admin login failed: ${response.status()} ${response.statusText()}\n${body}`);
    }

    await expect(page).not.toHaveURL(/\/login$/);

    /*
     * Navigate to /admin without doing a hard browser reload.
     * This keeps the authenticated React session alive.
     */
    await page.evaluate(() => {
      window.history.pushState({}, "", "/admin");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(page).toHaveURL(/\/admin/, {
      timeout: 10_000,
    });

    await expect(
      page.getByRole("heading", {
        name: "Marketplace overview",
        exact: true,
      })
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("admin dashboard overview loads", async () => {
    await expect(page).toHaveURL(/\/admin/);

    await expect(
      page.getByRole("heading", {
        name: "Marketplace overview",
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "Control Center",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin vendors tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Vendors",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Vendor applications",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin products tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Products",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Product moderation",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin orders tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Orders",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Vendor fulfillment",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin reviews tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Reviews",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Review moderation",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin categories tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Categories",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Categories",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin coupons tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Coupons",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Coupons",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin users tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Users",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Users",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin returns tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Returns",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Returns and refunds",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin shipping tab loads", async () => {
    await page
      .getByRole("button", {
        name: "Shipping",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Shipping methods",
        exact: true,
      })
    ).toBeVisible();
  });

  test("admin cannot open vendor-only dashboard", async () => {
    await page.goto("/vendor");

    await expect(page).toHaveURL(/\/become-vendor$/);
  });
});
