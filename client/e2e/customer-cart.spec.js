import { test, expect } from "@playwright/test";

test.describe.serial("Customer cart mutation flow", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    const email = process.env.E2E_CUSTOMER_EMAIL;
    const password = process.env.E2E_CUSTOMER_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD before running this test."
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
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("customer can add product to cart and remove it", async () => {
    /*
     * Start with a clean cart.
     */
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    let existingRemoveButtons = page.getByRole("button", {
      name: /remove/i,
    });

    let existingCount = await existingRemoveButtons.count();

    while (existingCount > 0) {
      const deleteResponsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes("/api/cart") &&
            response.request().method() !== "GET",
          {
            timeout: 10_000,
          }
        )
        .catch(() => null);

      await existingRemoveButtons.first().click();

      await deleteResponsePromise;

      await expect
        .poll(async () => {
          return await page
            .getByRole("button", {
              name: /remove/i,
            })
            .count();
        })
        .toBeLessThan(existingCount);

      existingRemoveButtons = page.getByRole("button", {
        name: /remove/i,
      });

      existingCount = await existingRemoveButtons.count();
    }

    /*
     * Find a purchasable product.
     */
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    const productLinks = page.locator(
      'a[href^="/products/"]'
    );

    const productCount = await productLinks.count();

    console.log(
      `Products found on page: ${productCount}`
    );

    if (productCount === 0) {
      throw new Error(
        "No products were found on the products page."
      );
    }

    let productAdded = false;

    for (let i = 0; i < productCount; i++) {
      const href = await productLinks
        .nth(i)
        .getAttribute("href");

      if (!href) {
        continue;
      }

      await page.goto(href);
      await page.waitForLoadState("networkidle");

      const addButton = page.getByRole("button", {
        name: /add to cart/i,
      });

      const visible = await addButton
        .isVisible()
        .catch(() => false);

      const enabled = visible
        ? await addButton
            .isEnabled()
            .catch(() => false)
        : false;

      console.log(
        `Checking ${href} - Add to cart visible: ${visible}, enabled: ${enabled}`
      );

      if (!visible || !enabled) {
        continue;
      }

      /*
       * Handle product variants if this product has them.
       */
      const variantSelect =
        page.getByLabel(/variant/i);

      if (
        await variantSelect
          .isVisible()
          .catch(() => false)
      ) {
        const options =
          variantSelect.locator("option");

        const optionCount =
          await options.count();

        if (optionCount > 1) {
          await variantSelect.selectOption({
            index: 1,
          });
        }
      }

      /*
       * IMPORTANT:
       * Wait for the cart mutation to finish before
       * navigating away from ProductDetails.
       */
      const cartResponsePromise =
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/cart") &&
            response.request().method() !== "GET",
          {
            timeout: 10_000,
          }
        );

      await addButton.click();

      const cartResponse =
        await cartResponsePromise;

      if (!cartResponse.ok()) {
        const body =
          await cartResponse.text();

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
     * Verify cart contains the new item.
     */
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", {
        name: /shopping cart/i,
      })
    ).toBeVisible();

    const removeButtons = page.getByRole("button", {
      name: /remove/i,
    });

    await expect
      .poll(async () => {
        return await removeButtons.count();
      })
      .toBeGreaterThan(0);

    const countBeforeRemoval =
      await removeButtons.count();

    console.log(
      `Cart items before removal: ${countBeforeRemoval}`
    );

    /*
     * Remove the item and wait for backend mutation.
     */
    const removeResponsePromise =
      page
        .waitForResponse(
          (response) =>
            response.url().includes("/api/cart") &&
            response.request().method() !== "GET",
          {
            timeout: 10_000,
          }
        )
        .catch(() => null);

    await removeButtons.first().click();

    await removeResponsePromise;

    /*
     * Verify item disappeared.
     */
    await expect
      .poll(async () => {
        return await page
          .getByRole("button", {
            name: /remove/i,
          })
          .count();
      })
      .toBeLessThan(countBeforeRemoval);

    /*
     * Because we deliberately started with an empty
     * cart, it should now contain zero products.
     */
    await expect
      .poll(async () => {
        return await page
          .getByRole("button", {
            name: /remove/i,
          })
          .count();
      })
      .toBe(0);
  });
});