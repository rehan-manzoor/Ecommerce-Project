import { test, expect } from "@playwright/test";

test.describe("MERN Market smoke tests", () => {
  test("home page opens", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/MERN/i);
    await expect(page.getByRole("link", { name: /MERN Market/i })).toBeVisible();
  });

  test("login page opens", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("register page opens", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();

    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("products page opens", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Shop products" })).toBeVisible();

    await expect(page.getByPlaceholder("Search products or brands...")).toBeVisible();
  });

  test("guest cannot open protected checkout", async ({ page }) => {
    await page.goto("/checkout");

    await expect(page).toHaveURL(/\/login$/);

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("guest cannot open orders", async ({ page }) => {
    await page.goto("/orders");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("guest cannot open admin dashboard", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("guest cannot open vendor dashboard", async ({ page }) => {
    await page.goto("/vendor");

    await expect(page).toHaveURL(/\/login$/);
  });
});
