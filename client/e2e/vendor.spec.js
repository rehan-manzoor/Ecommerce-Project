import { test, expect } from "@playwright/test";

test.describe.serial("Vendor dashboard", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    const email = process.env.E2E_VENDOR_EMAIL;
    const password = process.env.E2E_VENDOR_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "Set E2E_VENDOR_EMAIL and E2E_VENDOR_PASSWORD before running vendor E2E tests."
      );
    }

    context = await browser.newContext();
    page = await context.newPage();

    await page.goto("/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/users/login") &&
        response.request().method() === "POST"
    );

    await page.getByRole("button", { name: "Sign in" }).click();

    const response = await responsePromise;

    if (!response.ok()) {
      let body;

try {
  body = await response.text();
} catch {
  body = "Unable to read response body";
}

      throw new Error(
        `Vendor login failed: ${response.status()} ${response.statusText()}\n${body}`
      );
    }

    await expect(page).not.toHaveURL(/\/login$/);

    await page.goto("/vendor");

    await expect(page).toHaveURL(/\/vendor/);

    await expect(
      page.getByRole("heading", {
        name: "Vendor overview",
        exact: true,
      })
    ).toBeVisible();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("vendor dashboard overview loads", async () => {
    await page.goto("/vendor");

    await expect(page).toHaveURL(/\/vendor/);

    await expect(
      page.getByRole("heading", {
        name: "Vendor overview",
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "Dashboard",
        exact: true,
      })
    ).toBeVisible();
  });

  test("vendor products tab loads", async () => {
    await page.goto("/vendor");

    await page
      .getByRole("button", {
        name: "Products",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "My products",
        exact: true,
      })
    ).toBeVisible();
  });

  test("vendor orders tab loads", async () => {
    await page.goto("/vendor");

    await page
      .getByRole("button", {
        name: "Orders",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: /orders/i,
      }).first()
    ).toBeVisible();
  });

  test("vendor returns tab loads", async () => {
    await page.goto("/vendor");

    await page
      .getByRole("button", {
        name: "Returns",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Store returns",
        exact: true,
      })
    ).toBeVisible();
  });

  test("vendor store settings tab loads", async () => {
    await page.goto("/vendor");

    await page
      .getByRole("button", {
        name: "Store",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Store settings",
        exact: true,
      })
    ).toBeVisible();
  });

  test("vendor cannot open admin dashboard", async () => {
    await page.goto("/admin");

    await expect(page).not.toHaveURL(/\/admin$/);
  });
});