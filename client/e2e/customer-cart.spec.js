import { test, expect } from "@playwright/test";

test.describe.serial("Customer cart mutation flow", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    const email = process.env.E2E_CUSTOMER_EMAIL;
    const password = process.env.E2E_CUSTOMER_PASSWORD;

    if (!email || !password) {
      throw new Error("Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD before running this test.");
    }

    context = await browser.newContext();
    page = await context.newPage();

    await page.goto("/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);

    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/users/login") && response.request().method() === "POST"
    );

    await page
      .getByRole("button", {
        name: "Sign in",
        exact: true,
      })
      .click();

    const loginResponse = await loginResponsePromise;

    if (!loginResponse.ok()) {
      const body = await loginResponse.text();

      throw new Error(
        `Customer login failed: ${loginResponse.status()} ${loginResponse.statusText()}\n${body}`
      );
    }

    await expect(page).not.toHaveURL(/\/login$/);

    await expect(
      page.getByRole("button", {
        name: "Logout",
        exact: true,
      })
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("customer can add product to cart and remove it", async () => {
    /*
     * Start with a clean cart.
     */
    await page.goto("/cart");

    await expect(
      page.getByRole("heading", {
        name: /shopping cart/i,
      })
    ).toBeVisible({
      timeout: 10_000,
    });

    let existingRemoveButtons = page.getByRole("button", {
      name: /remove/i,
    });

    let existingCount = await existingRemoveButtons.count();

    while (existingCount > 0) {
      const deleteResponsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes("/api/cart") && response.request().method() !== "GET",
          {
            timeout: 10_000,
          }
        )
        .catch(() => null);

      await existingRemoveButtons.first().click();

      await deleteResponsePromise;

      await expect
        .poll(
          async () =>
            await page
              .getByRole("button", {
                name: /remove/i,
              })
              .count(),
          {
            timeout: 10_000,
          }
        )
        .toBeLessThan(existingCount);

      existingRemoveButtons = page.getByRole("button", {
        name: /remove/i,
      });

      existingCount = await existingRemoveButtons.count();
    }

    /*
     * Find a purchasable product.
     */
    const productsResponsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/api/products") && response.request().method() === "GET",
        {
          timeout: 10_000,
        }
      )
      .catch(() => null);

    await page.goto("/products");

    await productsResponsePromise;

    const productLinks = page.locator('a[href^="/products/"]');

    await expect
      .poll(async () => await productLinks.count(), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);

    const productCount = await productLinks.count();

    console.log(`Products found on page: ${productCount}`);

    let productAdded = false;

    for (let i = 0; i < productCount; i++) {
      const href = await productLinks.nth(i).getAttribute("href");

      if (!href) {
        continue;
      }

      await page.goto(href);

      const addButton = page.getByRole("button", {
        name: /add to cart/i,
      });

      const visible = await addButton
        .isVisible({
          timeout: 5000,
        })
        .catch(() => false);

      const enabled = visible ? await addButton.isEnabled().catch(() => false) : false;

      console.log(`Checking ${href} - Add to cart visible: ${visible}, enabled: ${enabled}`);

      if (!visible || !enabled) {
        continue;
      }

      /*
       * Handle product variants if present.
       */
      const variantSelect = page.getByLabel(/variant/i);

      if (await variantSelect.isVisible().catch(() => false)) {
        const options = variantSelect.locator("option");

        const optionCount = await options.count();

        if (optionCount > 1) {
          await variantSelect.selectOption({
            index: 1,
          });
        }
      }

      /*
       * Wait for cart mutation.
       */
      const cartResponsePromise = page.waitForResponse(
        (response) => response.url().includes("/api/cart") && response.request().method() !== "GET",
        {
          timeout: 10_000,
        }
      );

      await addButton.click();

      const cartResponse = await cartResponsePromise;

      if (!cartResponse.ok()) {
        const body = await cartResponse.text();

        throw new Error(
          `Add to cart failed: ${cartResponse.status()} ${cartResponse.statusText()}\n${body}`
        );
      }

      productAdded = true;
      break;
    }

    if (!productAdded) {
      throw new Error(
        "Products exist, but no purchasable product with an enabled Add to cart button was found."
      );
    }

    /*
     * Verify cart contains the item.
     */
    await page.goto("/cart");

    await expect(
      page.getByRole("heading", {
        name: /shopping cart/i,
      })
    ).toBeVisible({
      timeout: 10_000,
    });

    const removeButtons = page.getByRole("button", {
      name: /remove/i,
    });

    await expect
      .poll(async () => await removeButtons.count(), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);

    const countBeforeRemoval = await removeButtons.count();

    console.log(`Cart items before removal: ${countBeforeRemoval}`);

    /*
     * Remove item.
     */
    const removeResponsePromise = page
      .waitForResponse(
        (response) => response.url().includes("/api/cart") && response.request().method() !== "GET",
        {
          timeout: 10_000,
        }
      )
      .catch(() => null);

    await removeButtons.first().click();

    await removeResponsePromise;

    await expect
      .poll(
        async () =>
          await page
            .getByRole("button", {
              name: /remove/i,
            })
            .count(),
        {
          timeout: 10_000,
        }
      )
      .toBeLessThan(countBeforeRemoval);

    /*
     * We started with an empty cart,
     * so cart should now be empty.
     */
    await expect
      .poll(
        async () =>
          await page
            .getByRole("button", {
              name: /remove/i,
            })
            .count(),
        {
          timeout: 10_000,
        }
      )
      .toBe(0);
  });
});
