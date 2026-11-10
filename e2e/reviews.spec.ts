import { test, expect } from "@playwright/test";

// Our own Google review cards must show even when the live Convex connection is blocked.
test("home reviews: our review cards render without the live connection", async ({ page }) => {
  test.setTimeout(240_000);
  await page.routeWebSocket(/convex|sslip\.io/, (ws) => ws.close());
  await page.goto("/");
  await page
    .getByRole("heading", { name: /travelers love the experience/i })
    .scrollIntoViewIfNeeded({ timeout: 120_000 });
  await expect(page.getByText("Bella Raza")).toBeVisible();

  const readMore = page.getByRole("button", { name: "Read more" }).first();
  await readMore.click();
  await expect(page.getByRole("button", { name: "Show less" }).first()).toBeVisible();
});
