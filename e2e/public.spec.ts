import { test, expect } from "@playwright/test";
import { watch, report, noHorizontalScroll, dialogs } from "./helpers";

test.beforeEach(({ page }) => dialogs(page));

const DESTINATIONS = ["Taxila", "Islamabad", "Takht-i-Bahi", "Chitral", "Kalash", "Harappa", "Multan", "Uch Sharif", "Bahawalpur", "Sukkur", "Sehwan", "Hyderabad", "Karachi"];

test("home renders", async ({ page }) => {
  const w = watch(page);
  const r = await page.goto("/");
  expect(r?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.locator("footer").first()).toBeVisible();
  report("home", w);
});

test("tours list, audience filter, detail page", async ({ page }) => {
  const w = watch(page);
  await page.goto("/tours");
  const cards = page.locator('a[href^="/tours/"]');
  await expect(cards.first()).toBeVisible();

  await expect(page.getByText(/most popular/i).first(), "'Show' filter options").toBeAttached();
  await expect(page.getByText(/international tours/i).first()).toBeAttached();
  await expect(page.getByText(/pakistani tours?/i)).toHaveCount(0);

  await page.goto("/tours?audience=foreigners");
  await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible();

  await page.goto("/tours");
  const href = await page.locator('a[href^="/tours/"]').first().getAttribute("href");
  await page.goto(href!);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/itinerary/i).first()).toBeVisible();
  await expect(page.getByText(/included|inclusions/i).first()).toBeAttached();
  await expect(page.getByText(/book|enquir|inquir|request/i).first()).toBeAttached();
  report("tours", w);
});

test("tour detail: Know before you go (dev sample tour)", async ({ page }) => {
  const w = watch(page);
  const r = await page.goto("/tours/7-days-heritage-cultural-escape");
  test.skip(r?.status() === 404, "dev sample tour missing");
  await expect(page.getByText(/know before you go/i).first()).toBeVisible();
  await expect(page.locator("main ul li").first()).toBeVisible();
  await expect(page.locator("main ol li").first()).toBeVisible();
  const day = page.getByRole("button", { name: /day\s*1/i }).first();
  if (await day.count()) {
    await day.click();
    await expect(day).toHaveAttribute("aria-expanded", /true|false/);
  }
  report("tour-kbyg", w);
});

test("tour detail: Know before you go absent when unfilled (informational)", async ({ page }) => {
  await page.goto("/tours");
  const hrefs = await page.locator('a[href^="/tours/"]').evaluateAll((els) => Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))));
  const other = hrefs.find((h) => !h.endsWith("7-days-heritage-cultural-escape"));
  test.skip(!other, "only one tour");
  await page.goto(other!);
  await expect(page.locator("h1").first()).toBeVisible();
  const has = await page.getByText(/know before you go/i).count();
  console.log(`[E2E-INFO] ${other} has KBYG section: ${has > 0}`);
});

test("destinations list contains heritage destinations + detail", async ({ page }) => {
  const w = watch(page);
  await page.goto("/destinations");
  await expect(page.locator("h1, h2").first()).toBeVisible();
  const body = (await page.locator("body").innerText()) + (await page.content());
  const missing = DESTINATIONS.filter((d) => !new RegExp(d, "i").test(body));
  expect(missing, "destinations missing from /destinations").toEqual([]);
  const href = await page.locator('a[href^="/destinations/"]').first().getAttribute("href");
  const r = await page.goto(href!);
  expect(r?.status()).toBe(200);
  await expect(page.locator("h1, h2").first()).toBeVisible();
  report("destinations", w);
});

test("guides + province", async ({ page }) => {
  const w = watch(page);
  await page.goto("/guides");
  await expect(page.locator("h1, h2").first()).toBeVisible();
  const href = await page.locator('a[href^="/guides/"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  const r = await page.goto(href!);
  expect(r?.status()).toBe(200);
  await expect(page.locator("h1, h2").first()).toBeVisible();
  report("guides", w);
});

test("blog list + post", async ({ page }) => {
  const w = watch(page);
  await page.goto("/blog");
  await expect(page.locator("h1, h2").first()).toBeVisible();
  const link = page.locator('a[href^="/blog/"]').first();
  test.skip((await link.count()) === 0, "no blog posts on dev");
  const href = await link.getAttribute("href");
  const r = await page.goto(href!);
  expect(r?.status()).toBe(200);
  await expect(page.locator("h1, h2").first()).toBeVisible();
  report("blog", w);
});

for (const p of ["/about", "/contact", "/cancellation-policy", "/privacy-policy", "/terms-of-service", "/visa-invitation", "/ai-planner"]) {
  test(`static page ${p}`, async ({ page }) => {
    const w = watch(page);
    const r = await page.goto(p);
    expect(r?.status()).toBe(200);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    report(p, w);
  });
}

test("contact form validation (no submit)", async ({ page }) => {
  await page.goto("/contact");
  let posted = false;
  page.on("request", (rq) => {
    if (rq.method() === "POST" && /contact/i.test(rq.url())) posted = true;
  });
  await expect(page.getByText(/preparing contact session/i)).toHaveCount(0);
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator("#contact-name")).toBeFocused();
  expect(posted, "empty form must not post").toBe(false);
});

test("header nav links and header search", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("header").first();
  for (const name of [/tours/i, /destinations/i, /about/i, /contact/i]) {
    await expect(nav.getByRole("link", { name }).first(), String(name)).toBeAttached();
  }
  const blog = await nav.locator('a[href="/blog"]').count();
  console.log(`[E2E-INFO] blog link in header: ${blog > 0}`);
  const search = nav.getByRole("button", { name: /^search$/i }).locator("visible=true").first();
  if (await search.count()) {
    await search.click();
    const input = page.locator('input[aria-label="Search tours"]').first();
    await expect(input).toBeVisible();
    await input.fill("hunza");
    await expect(page.locator('a[href^="/tours/"], a[href^="/destinations/"]').first()).toBeVisible();
    await page.keyboard.press("Escape");
  } else console.log("[E2E-INFO] no header search button found");
});

test("currency switch (if present)", async ({ page }) => {
  await page.goto("/tours");
  const sw = page.getByRole("button", { name: /^(usd|pkr)$/i }).first();
  if (!(await sw.count())) return console.log("[E2E-INFO] no currency switch on /tours");
  await sw.click();
  await expect(page.getByText(/PKR|Rs/).first()).toBeAttached();
});

test("404 page", async ({ page }) => {
  const r = await page.goto("/this-page-does-not-exist-e2e");
  expect(r?.status()).toBe(404);
  await expect(page.getByText(/not found|404/i).first()).toBeVisible();
  const r2 = await page.goto("/tours/zz-no-such-tour-e2e");
  expect([404, 307, 308, 200]).toContain(r2?.status());
});

test.describe("mobile 375px", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  for (const p of ["/", "/tours", "/destinations", "/guides", "/blog", "/about", "/contact", "/tours/7-days-heritage-cultural-escape"]) {
    test(`no horizontal scroll ${p}`, async ({ page }) => {
      await page.goto(p);
      await expect(page.locator("h1, h2").first()).toBeVisible();
      await page.waitForLoadState("networkidle").catch(() => {});
      await noHorizontalScroll(page);
    });
  }
  test("mobile menu opens", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator("header").getByRole("button", { name: /menu|navigation|open/i }).first();
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.getByRole("link", { name: /tours/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /contact/i }).first()).toBeVisible();
  });
});
