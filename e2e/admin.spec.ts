import { test, expect, type Page } from "@playwright/test";
import { watch, report, dialogs } from "./helpers";

// Authenticated tests read E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (DEV admin account) and skip when unset.
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.beforeEach(({ page }) => dialogs(page));

test("unauthenticated /admin redirects to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  expect(page.url()).toContain("next=");
});

test("login form validation", async ({ page }) => {
  await page.goto("/login");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator("#login-email")).toBeFocused();
  await page.fill("#login-email", "not-an-email");
  await page.fill("#login-pass", "x");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText(/valid email|invalid/i).first()).toBeVisible();
});

test("login rejects bad credentials", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#login-email", "e2e-nobody@example.com");
  await page.fill("#login-pass", "definitely-wrong-pass-1");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText(/invalid|incorrect|wrong|failed|not found|try again/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test.describe("authenticated admin (needs E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)", () => {
  test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");

  async function login(page: Page) {
    await page.goto("/login?next=/admin");
    await page.fill("#login-email", EMAIL!);
    await page.fill("#login-pass", PASSWORD!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((u) => u.pathname.startsWith("/admin"));
  }

  test("dashboard + every sidebar link opens", async ({ page }) => {
    const w = watch(page);
    await login(page);
    const hrefs = await page.locator('a[href^="/admin"]').evaluateAll((els) => Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))));
    expect(hrefs.length).toBeGreaterThan(3);
    for (const h of hrefs) {
      const r = await page.goto(h);
      expect(r?.status(), h).toBeLessThan(400);
      await expect(page.getByText(/something went wrong|application error/i), h).toHaveCount(0);
    }
    report("admin sidebar", w);
  });

  test("sidebar scrolls with mouse wheel", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await login(page);
    const found = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="/admin"]'));
      let el: HTMLElement | null = (links[0] as HTMLElement | undefined)?.parentElement ?? null;
      while (el && !(el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY))) el = el.parentElement;
      if (!el) return false;
      el.setAttribute("data-e2e-scroller", "1");
      return true;
    });
    expect(found, "scrollable sidebar container").toBeTruthy();
    const sc = page.locator('[data-e2e-scroller="1"]');
    const box = (await sc.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => sc.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  });

  test("modal body scrolls with mouse wheel", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 420 });
    await login(page);
    await page.goto("/admin/faqs");
    await page.getByRole("button", { name: /new faq/i }).first().click();
    const dlg = page.getByRole("dialog", { name: /new faq/i });
    await expect(dlg).toBeVisible();
    const found = await dlg.evaluate((root) => {
      const nodes = [root as HTMLElement, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
      const el = nodes.find((n) => n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(n).overflowY));
      if (!el) return false;
      el.setAttribute("data-e2e-scroller", "modal");
      return true;
    });
    expect(found, "scrollable modal body").toBeTruthy();
    const sc = page.locator('[data-e2e-scroller="modal"]');
    const box = (await sc.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => sc.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  });

  test("tour editor fields", async ({ page }) => {
    const w = watch(page);
    await login(page);
    await page.goto("/admin/tours/new");
    for (const t of [/tour badge/i, /know before you go/i, /related blog posts/i]) {
      await expect(page.getByText(t).first(), String(t)).toBeAttached();
    }
    report("admin tour new", w);
  });

  test("blog, destinations, tours, provinces lists load", async ({ page }) => {
    await login(page);
    for (const p of ["/admin/blog", "/admin/destinations", "/admin/tours", "/admin/provinces"]) {
      const r = await page.goto(p);
      expect(r?.status(), p).toBeLessThan(400);
      await expect(page.getByText(/something went wrong|application error/i)).toHaveCount(0);
    }
  });
});
