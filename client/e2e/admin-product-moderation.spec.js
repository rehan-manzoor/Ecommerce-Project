import { test, expect } from "@playwright/test";

test.describe.serial("Admin product moderation mutation flow", () => {
  let vendorContext;
  let vendorPage;

  let adminContext;
  let adminPage;

  const unique = Date.now();
  const productName = `E2E Moderation Product ${unique}`;
  const sku = `E2E-MOD-${unique}`;

  async function login(page, email, password, roleName) {
    await page.goto("/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);

    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/users/login") &&
        response.request().method() === "POST"
    );

    await page
      .getByRole("button", {
        name: "Sign in",
        exact: true,
      })
      .click();

    const response = await loginResponsePromise;

    if (!response.ok()) {
      const body = await response.text();

      throw new Error(
        `${roleName} login failed: ${response.status()} ${response.statusText()}\n${body}`
      );
    }

    await expect(page).not.toHaveURL(/\/login$/);
  }

  test.beforeAll(async ({ browser }) => {
    const vendorEmail = process.env.E2E_VENDOR_EMAIL;
    const vendorPassword = process.env.E2E_VENDOR_PASSWORD;

    const adminEmail = process.env.E2E_ADMIN_EMAIL;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;

    if (!vendorEmail || !vendorPassword) {
      throw new Error(
        "Set E2E_VENDOR_EMAIL and E2E_VENDOR_PASSWORD before running this test."
      );
    }

    if (!adminEmail || !adminPassword) {
      throw new Error(
        "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD before running this test."
      );
    }

    vendorContext = await browser.newContext();
    vendorPage = await vendorContext.newPage();

    await login(
      vendorPage,
      vendorEmail,
      vendorPassword,
      "Vendor"
    );

    adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();

    await login(
      adminPage,
      adminEmail,
      adminPassword,
      "Admin"
    );
  });

  test.afterAll(async () => {
  try {
    await adminPage?.request.post(
      "http://localhost:5000/api/users/logout"
    );
  } catch {
    // Ignore cleanup failures.
  }

  try {
    await vendorPage?.request.post(
      "http://localhost:5000/api/users/logout"
    );
  } catch {
    // Ignore cleanup failures.
  }

  await adminContext?.close();
  await vendorContext?.close();
});

  test("vendor creates a product pending admin approval", async () => {
    await vendorPage.goto("/vendor");

    await expect(vendorPage).toHaveURL(/\/vendor/);

    await vendorPage
      .getByRole("button", {
        name: "Products",
        exact: true,
      })
      .click();

    await expect(
      vendorPage.getByRole("heading", {
        name: "My products",
        exact: true,
      })
    ).toBeVisible();

    await expect(
      vendorPage.getByRole("heading", {
        name: "New product",
        exact: true,
      })
    ).toBeVisible();

    await vendorPage
      .getByLabel("Name")
      .fill(productName);

    await vendorPage
      .getByLabel("Brand")
      .fill("E2E Moderation Brand");

    await vendorPage
      .getByLabel("Description")
      .fill(
        "Temporary Playwright product created to test the complete admin moderation workflow."
      );

    await vendorPage
      .getByRole("spinbutton", {
        name: "Price",
        exact: true,
      })
      .fill("3499");

    await vendorPage
      .getByRole("spinbutton", {
        name: "Stock",
        exact: true,
      })
      .fill("20");

    await vendorPage
      .getByLabel("SKU", {
        exact: true,
      })
      .first()
      .fill(sku);

    await vendorPage
      .getByRole("spinbutton", {
        name: "Sale price",
        exact: true,
      })
      .fill("3199");

    await vendorPage
      .getByRole("spinbutton", {
        name: "Low stock threshold",
        exact: true,
      })
      .fill("5");

    const categorySelect =
      vendorPage.getByLabel("Category");

    await expect(categorySelect).toBeVisible();

    const categoryOptions =
      categorySelect.locator("option");

    const categoryCount =
      await categoryOptions.count();

    if (categoryCount <= 1) {
      throw new Error(
        "No categories available. Seed/create at least one category before running this test."
      );
    }

    await categorySelect.selectOption({
      index: 1,
    });

    await vendorPage
      .getByLabel("Listing status")
      .selectOption("active");

    const createResponsePromise =
      vendorPage.waitForResponse(
        (response) =>
          response.url().includes("/api/products") &&
          response.request().method() === "POST"
      );

    await vendorPage
      .getByRole("button", {
        name: "Create product",
        exact: true,
      })
      .click();

    const createResponse =
      await createResponsePromise;

    if (!createResponse.ok()) {
      const body =
        await createResponse.text();

      throw new Error(
        `Product creation failed: ${createResponse.status()} ${createResponse.statusText()}\n${body}`
      );
    }

    const productCard = vendorPage
      .locator(".management-card")
      .filter({
        has: vendorPage.getByText(productName, {
          exact: true,
        }),
      })
      .first();

    await expect(productCard).toBeVisible();

    await expect(
      productCard.getByText(/pending/i)
    ).toBeVisible();
  });

  test("admin can find and approve the pending product", async () => {
    await adminPage.goto("/admin");

    await expect(adminPage).toHaveURL(/\/admin/);

    await adminPage
      .getByRole("button", {
        name: "Products",
        exact: true,
      })
      .click();

    await expect(
      adminPage.getByRole("heading", {
        name: "Product moderation",
        exact: true,
      })
    ).toBeVisible();

    const productCard = adminPage
      .locator(".management-card")
      .filter({
        has: adminPage.getByText(productName, {
          exact: true,
        }),
      })
      .first();

    await expect(productCard).toBeVisible();

    const approveButton = productCard.getByRole(
      "button",
      {
        name: /approve/i,
      }
    );

    await expect(approveButton).toBeVisible();

    const approvalResponsePromise =
      adminPage.waitForResponse(
        (response) =>
          response.url().includes("/api/") &&
          response.request().method() !== "GET" &&
          response.ok()
      );

    await approveButton.click();

    await approvalResponsePromise;

    await expect(
      productCard.getByText(/approved/i)
    ).toBeVisible();
  });

  test("approved product becomes visible in public catalog", async ({
    browser,
  }) => {
    const publicContext =
      await browser.newContext();

    const publicPage =
      await publicContext.newPage();

    try {
      await publicPage.goto("/products");

      await publicPage.waitForLoadState(
        "networkidle"
      );

      const searchInput =
        publicPage.getByPlaceholder(
          "Search products or brands..."
        );

      if (
        await searchInput
          .isVisible()
          .catch(() => false)
      ) {
        await searchInput.fill(productName);
      }

      await expect(
        publicPage.getByText(productName, {
          exact: true,
        }).first()
      ).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await publicContext.close();
    }
  });

  test("vendor can remove the temporary approved product", async () => {
    await vendorPage.goto("/vendor");

    await vendorPage
      .getByRole("button", {
        name: "Products",
        exact: true,
      })
      .click();

    const productCard = vendorPage
      .locator(".management-card")
      .filter({
        has: vendorPage.getByText(productName, {
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

    const dialog =
      vendorPage.getByRole("dialog");

    await expect(dialog).toBeVisible();

    const deleteResponsePromise =
      vendorPage.waitForResponse(
        (response) =>
          response.url().includes("/api/products/") &&
          response.request().method() === "DELETE"
      );

    await dialog
      .getByRole("button", {
        name: "Delete product",
        exact: true,
      })
      .click();

    const deleteResponse =
      await deleteResponsePromise;

    if (!deleteResponse.ok()) {
      const body =
        await deleteResponse.text();

      throw new Error(
        `Cleanup deletion failed: ${deleteResponse.status()} ${deleteResponse.statusText()}\n${body}`
      );
    }

    await expect(
      vendorPage.getByText(productName, {
        exact: true,
      })
    ).not.toBeVisible();
  });
});