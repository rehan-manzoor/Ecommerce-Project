import { test, expect } from "@playwright/test";

test.describe("Catalog and guest cart flow", () => {
  test("product search updates the URL and renders a result state", async ({ page }) => {
    await page.goto("/products");

    const search = page.getByPlaceholder("Search products or brands...");
    await search.fill("__playwright_product_that_should_not_exist__");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/search=__playwright_product_that_should_not_exist__/);
    await expect(page.getByText("No products found")).toBeVisible();
  });

  test("clear filters removes catalog query parameters", async ({ page }) => {
    await page.goto("/products?brand=Playwright&minPrice=999999");

    await page.getByRole("button", { name: "Clear filters" }).click();

    await expect(page).toHaveURL(/\/products$/);
  });

  test("guest empty cart renders correctly", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByRole("heading", { name: "Shopping cart" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse products" })).toBeVisible();
  });

  test("guest can open a product details page when products exist", async ({ page }) => {
    await page.goto("/products");

    const cards = page.locator("a.product-card");
    const count = await cards.count();
    test.skip(count === 0, "No approved products exist in the local database.");

    await cards.first().click();

    await expect(page).toHaveURL(/\/products\/[^/?#]+$/);
    await expect(page.locator(".details-info h1")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customer reviews" })).toBeVisible();
  });
});
