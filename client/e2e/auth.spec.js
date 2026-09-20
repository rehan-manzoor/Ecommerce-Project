import { test, expect } from "@playwright/test";

test.describe.serial("Authenticated customer flow", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    const email = process.env.E2E_CUSTOMER_EMAIL;
    const password = process.env.E2E_CUSTOMER_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD must be set."
      );
    }

    context = await browser.newContext();
    page = await context.newPage();

    await page.goto("/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);

    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/users/login") &&
        response.request().method() === "POST"
    );

    await page.getByRole("button", { name: "Sign in" }).click();

    const loginResponse = await loginResponsePromise;

    if (!loginResponse.ok()) {
      const body = await loginResponse.text();

      throw new Error(
        `Login failed: ${loginResponse.status()} ${loginResponse.statusText()}\n${body}`
      );
    }

    await expect(page).not.toHaveURL(/\/login$/);

    await expect(
      page.getByRole("link", {
        name: "My Orders",
        exact: true,
      }).first()
    ).toBeVisible();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("customer can sign in", async () => {
    await page.goto("/");

    await expect(
      page.getByRole("link", {
        name: "My Orders",
        exact: true,
      }).first()
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "Wishlist",
        exact: true,
      }).first()
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "My Account",
        exact: true,
      }).first()
    ).toBeVisible();
  });

  test("session survives a full page reload", async () => {
    await page.goto("/");

    await page.reload();

    await expect(
      page.getByRole("link", {
        name: "My Orders",
        exact: true,
      }).first()
    ).toBeVisible();
  });

  test("customer cannot access admin dashboard", async () => {
    await page.goto("/admin");

    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test("customer is redirected away from vendor dashboard", async () => {
    await page.goto("/vendor");

    await expect(page).not.toHaveURL(/\/vendor$/);
  });

  test("customer can open protected account pages", async () => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/orders$/);

    await page.goto("/wishlist");
    await expect(page).toHaveURL(/\/wishlist$/);

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);
  });

  test("customer can log out", async () => {
  await page.goto("/");

  await page.getByRole("button", { name: "Logout" }).click();

  await expect(page).toHaveURL("http://localhost:5173/");

  await expect(
    page.getByRole("button", { name: "Logout" })
  ).not.toBeVisible();

  await page.goto("/orders");

  await expect(page).toHaveURL(/\/login$/);
});
});