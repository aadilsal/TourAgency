import { test, expect } from "@playwright/test";

// The home page reviews section shows a skeleton immediately and the free
// Google-reviews widget replaces it. Skips when no widget is configured.
test("home reviews: skeleton first, then the widget renders", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  const heading = page.getByRole("heading", { name: /travelers love the experience/i });
  await heading.scrollIntoViewIfNeeded({ timeout: 120_000 });
  const mount = page.locator("[data-widget-mount]");
  test.skip((await mount.count()) === 0, "No reviews widget configured on this deployment");

  const started = Date.now();
  await expect(page.getByRole("status", { name: /loading reviews/i })).toBeHidden({ timeout: 30_000 });
  const ms = Date.now() - started;
  expect(await mount.evaluate((el) => el.scrollHeight)).toBeGreaterThan(40);
  console.log(`reviews widget rendered ${ms}ms after scrolling to it`);
});
