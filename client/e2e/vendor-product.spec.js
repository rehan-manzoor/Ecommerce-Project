import { test, expect } from "@playwright/test";

test.describe.serial("Vendor product mutation flow", () => {
  let context;
  let page;

  const unique = Date.now();
  const productName = `E2E Product ${unique}`;
  const updatedProductName = `E2E Product Updated ${unique}`;

  test.beforeAll(async ({ browser }) => {
    const email = process.env.E2E_VENDOR_EMAIL;
    const password = process.env.E2E_VENDOR_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "Set E2E_VENDOR_EMAIL and E2E_VENDOR_PASSWORD before running vendor product E2E tests."
      );
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

    await page.getByRole("button", { name: "Sign in" }).click();

    const response = await responsePromise;

    if (!response.ok()) {
      const body = await response.text();

      throw new Error(
        `Vendor login failed: ${response.status()} ${response.statusText()}\n${body}`
      );
    }

    await expect(page).not.toHaveURL(/\/login$/);

    await page.goto("/vendor");
    await expect(page).toHaveURL(/\/vendor/);

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

  test.afterAll(async () => {
    await context?.close();
  });

  test("vendor can create a product", async () => {
    await expect(
      page.getByRole("heading", {
        name: "New product",
        exact: true,
      })
    ).toBeVisible();

    await page.getByLabel("Name").fill(productName);
    await page.getByLabel("Brand").fill("E2E Brand");

    await page
      .getByLabel("Description")
      .fill("Product created automatically by Playwright E2E testing.");

    await page
      .getByRole("spinbutton", {
        name: "Price",
        exact: true,
      })
      .fill("2499");

    await page
      .getByRole("spinbutton", {
        name: "Stock",
        exact: true,
      })
      .fill("10");

    await page.getByLabel("SKU", { exact: true }).first().fill(`E2E-${unique}`);

    await page
      .getByRole("spinbutton", {
        name: "Sale price",
        exact: true,
      })
      .fill("2299");

    await page
      .getByRole("spinbutton", {
        name: "Low stock threshold",
        exact: true,
      })
      .fill("3");

    const categorySelect = page.getByLabel("Category");

    await expect(categorySelect).toBeVisible();

    const categoryOptions = categorySelect.locator("option");

    const optionCount = await categoryOptions.count();

    if (optionCount <= 1) {
      throw new Error(
        "No product categories are available. Create/seed at least one category before running this E2E test."
      );
    }

    await categorySelect.selectOption({ index: 1 });

    await page.getByLabel("Listing status").selectOption("active");

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/products") && response.request().method() === "POST"
    );

    await page
      .getByRole("button", {
        name: "Create product",
        exact: true,
      })
      .click();

    const createResponse = await createResponsePromise;

    if (!createResponse.ok()) {
      const body = await createResponse.text();

      throw new Error(
        `Product creation failed: ${createResponse.status()} ${createResponse.statusText()}\n${body}`
      );
    }

    await expect(
      page.getByText(productName, {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page
        .getByText("pending", {
          exact: true,
        })
        .last()
    ).toBeVisible();
  });

  test("vendor can edit the newly created product", async () => {
    const productCard = page
      .locator(".management-card")
      .filter({
        has: page.getByText(productName, {
          exact: true,
        }),
      })
      .first();

    await expect(productCard).toBeVisible();

    await productCard
      .getByRole("button", {
        name: "Edit",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Edit product",
        exact: true,
      })
    ).toBeVisible();

    const nameInput = page.getByLabel("Name");

    await expect(nameInput).toHaveValue(productName);

    await nameInput.fill(updatedProductName);

    await page
      .getByRole("spinbutton", {
        name: "Stock",
        exact: true,
      })
      .fill("15");

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/products/") && response.request().method() === "PUT"
    );

    await page
      .getByRole("button", {
        name: "Update product",
        exact: true,
      })
      .click();

    const updateResponse = await updateResponsePromise;

    if (!updateResponse.ok()) {
      const body = await updateResponse.text();

      throw new Error(
        `Product update failed: ${updateResponse.status()} ${updateResponse.statusText()}\n${body}`
      );
    }

    const updatedProductCard = page
      .locator(".management-card")
      .filter({
        has: page.getByText(updatedProductName, {
          exact: true,
        }),
      })
      .first();

    await expect(updatedProductCard).toBeVisible();

    await expect(updatedProductCard.getByText(/Stock 15/i)).toBeVisible();
  });

  test("vendor can delete the E2E product", async () => {
    const productCard = page
      .locator(".management-card")
      .filter({
        has: page.getByText(updatedProductName, {
          exact: true,
        }),
      })
      .first();

    await expect(productCard).toBeVisible();

    await productCard
      .getByRole("button", {
        name: "Delete",
        exact: true,
      })
      .click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/products/") && response.request().method() === "DELETE"
    );

    await dialog
      .getByRole("button", {
        name: "Delete product",
        exact: true,
      })
      .click();

    const deleteResponse = await deleteResponsePromise;

    if (!deleteResponse.ok()) {
      const body = await deleteResponse.text();

      throw new Error(
        `Product deletion failed: ${deleteResponse.status()} ${deleteResponse.statusText()}\n${body}`
      );
    }

    await expect(
      page.getByText(updatedProductName, {
        exact: true,
      })
    ).not.toBeVisible();
  });
});
