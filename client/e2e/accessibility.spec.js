import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function checkAccessibility(page, name) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const seriousViolations = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );

  if (seriousViolations.length > 0) {
    console.log(`\nAccessibility problems on ${name}:`);

    for (const violation of seriousViolations) {
      console.log(`\n[${violation.impact}] ${violation.id}: ${violation.help}`);

      for (const node of violation.nodes) {
        console.log(`  Target: ${node.target.join(" ")}`);
        console.log(`  Fix: ${node.failureSummary}`);
      }
    }
  }

  expect(
    seriousViolations,
    `${name} contains serious or critical accessibility violations`
  ).toEqual([]);
}

test.describe("Accessibility", () => {
  test("home page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await checkAccessibility(page, "Home page");
  });

  test("login page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await checkAccessibility(page, "Login page");
  });

  test("register page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    await checkAccessibility(page, "Register page");
  });

  test("products page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    await checkAccessibility(page, "Products page");
  });

  test("cart page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    await checkAccessibility(page, "Cart page");
  });
});
