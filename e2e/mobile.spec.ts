import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dialogs } from "./helpers";

// Phone-size audit (375x812). Fails only on page-level horizontal overflow; everything else
// (tiny tap targets, <16px inputs, big fixed/sticky bars, sideways-scrolling tables, tall modals)
// is reported to stdout as [MOBILE] lines and to test-results/mobile/report.json.

const VIEWPORT = { width: 375, height: 812 };
const OUT = "test-results/mobile";
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

type Finding = {
  route: string;
  overflowPx: number;
  offenders: string[];
  sidewaysTables: string[];
  smallTaps: { count: number; examples: string[] };
  smallInputs: string[];
  bigFixed: string[];
  tallModals?: string[];
};
const results: Finding[] = [];

function shotName(route: string) {
  return (route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "_") || "home").slice(0, 80);
}

/** goto that retries once when dev-mode compiles/redirects abort the navigation. */
async function go(page: Page, url: string) {
  try {
    return await page.goto(url);
  } catch (e) {
    if (!/ERR_ABORTED|interrupted/i.test(String(e))) throw e;
    await page.waitForTimeout(1500);
    return await page.goto(url);
  }
}

async function settle(page: Page) {
  await page.waitForLoadState("load");
  // Wait for client "Loading…" placeholders to disappear (Convex queries).
  await page
    .waitForFunction(
      () =>
        !/\bLoading(…|\.\.\.)/.test(document.body.innerText) &&
        !document.querySelector('[aria-busy="true"], [role="progressbar"]') &&
        Boolean(document.querySelector("h1")),
      undefined,
      { timeout: 20_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(800);
}

/** Runs all layout checks in the page. */
async function audit(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const describe = (el: Element) => {
      const cls = typeof (el as HTMLElement).className === "string" ? (el as HTMLElement).className : "";
      const txt = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `<${el.tagName.toLowerCase()} class="${cls.slice(0, 90)}">${txt}`;
    };
    const visible = (el: Element) => {
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    // An element inside a scroll/clip container can't widen the page.
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return true;
      }
      return false;
    };
    const all = Array.from(document.body.querySelectorAll("*"));
    const overflowPx = document.documentElement.scrollWidth - vw;
    const offenders: string[] = [];
    if (overflowPx > 1) {
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && visible(el) && !clipped(el) && getComputedStyle(el).position !== "fixed") {
          offenders.push(`${describe(el)} [right=${Math.round(r.right)}]`);
          if (offenders.length >= 12) break;
        }
      }
    }
    const sidewaysTables = all
      .filter((el) => {
        const ox = getComputedStyle(el).overflowX;
        return (ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 1 && visible(el) && el.querySelector("table");
      })
      .map((el) => `${describe(el)} [scroll ${el.scrollWidth}/${el.clientWidth}]`);

    const root = document.querySelector("main") ?? document.body;
    const taps = Array.from(root.querySelectorAll('a[href], button, [role="button"], input[type="checkbox"], input[type="radio"]')).filter((el) => {
      if (!visible(el)) return false;
      const s = getComputedStyle(el);
      // Inline links inside running text are exempt.
      if (el.tagName === "A" && s.display === "inline" && el.closest("p, li, article")) return false;
      // A checkbox/radio wrapped in (or tied to) a <label> is tapped via the label.
      const lbl = el.tagName === "INPUT" ? (el.closest("label") ?? (el.id ? document.querySelector(`label[for="${el.id}"]`) : null)) : null;
      const r = (lbl ?? el).getBoundingClientRect();
      let w = r.width;
      let h = r.height;
      // Invisible hit-area expanders (e.g. `before:absolute before:-inset-2`) count.
      for (const pseudo of ["::before", "::after"]) {
        const ps = getComputedStyle(el, pseudo);
        if (ps.content !== "none" && ps.position === "absolute") {
          const grow = (v: string) => Math.max(0, -parseFloat(v) || 0);
          w = Math.max(w, r.width + grow(ps.left) + grow(ps.right));
          h = Math.max(h, r.height + grow(ps.top) + grow(ps.bottom));
        }
      }
      return h < 36 || w < 36;
    });
    const smallTaps = {
      count: taps.length,
      examples: taps.slice(0, 8).map((el) => {
        const r = el.getBoundingClientRect();
        return `${describe(el)} [${Math.round(r.width)}x${Math.round(r.height)}]`;
      }),
    };
    const smallInputs = Array.from(document.querySelectorAll("input, textarea, select"))
      .filter((el) => {
        const t = (el as HTMLInputElement).type;
        if (["checkbox", "radio", "hidden", "file", "range", "color", "submit", "button", "image"].includes(t)) return false;
        return visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16;
      })
      .map((el) => `${describe(el)} name=${(el as HTMLInputElement).name || (el as HTMLInputElement).id || (el as HTMLInputElement).placeholder?.slice(0, 30)} fs=${getComputedStyle(el).fontSize}`);
    const bigFixed = all
      .filter((el) => {
        const p = getComputedStyle(el).position;
        if (p !== "fixed" && p !== "sticky") return false;
        // Decorative overlays (pointer-events: none) don't cover anything usable.
        if (!visible(el) || getComputedStyle(el).pointerEvents === "none") return false;
        const r = el.getBoundingClientRect();
        const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
        const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        return (w * h) / (vw * vh) > 0.3;
      })
      .map((el) => `${describe(el)} [${getComputedStyle(el).position}]`);
    return { overflowPx, offenders, sidewaysTables, smallTaps, smallInputs: smallInputs.slice(0, 15), bigFixed };
  });
}

/** Checks that an open dialog either fits the viewport or scrolls internally. */
async function auditModal(page: Page) {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    for (const d of Array.from(document.querySelectorAll('[role="dialog"], dialog[open]'))) {
      const r = d.getBoundingClientRect();
      if (r.width === 0) continue;
      const nodes = [d as HTMLElement, ...Array.from(d.querySelectorAll<HTMLElement>("*"))];
      let scrolls = nodes.some((n) => /auto|scroll/.test(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight + 1);
      for (let p = d.parentElement; !scrolls && p && p !== document.body; p = p.parentElement) {
        if (/auto|scroll/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight + 1) scrolls = true;
      }
      const label = d.getAttribute("aria-label") ?? d.querySelector("h1,h2,h3")?.textContent?.trim() ?? "dialog";
      if (r.width > vw + 1) out.push(`${label}: wider than viewport (${Math.round(r.width)}px)`);
      if (r.height > vh + 1 && !scrolls) out.push(`${label}: ${Math.round(r.height)}px tall, no internal scroll`);
      if (r.top < -1 && !scrolls) out.push(`${label}: top cut off (${Math.round(r.top)})`);
    }
    return out;
  });
}

async function check(page: Page, route: string, extra?: Partial<Finding>) {
  await settle(page);
  const a = await audit(page);
  const f: Finding = { route, ...a, ...extra };
  results.push(f);
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${shotName(route)}.png`, fullPage: true }).catch(() => {});
  const lines = [
    `[MOBILE] ${route} overflow=${a.overflowPx}px taps<36=${a.smallTaps.count} inputs<16=${a.smallInputs.length} sideways=${a.sidewaysTables.length} bigFixed=${a.bigFixed.length}`,
  ];
  if (a.offenders.length) lines.push("  overflow offenders:\n    " + a.offenders.join("\n    "));
  if (a.sidewaysTables.length) lines.push("  table scrolls sideways:\n    " + a.sidewaysTables.join("\n    "));
  if (a.smallInputs.length) lines.push("  small inputs:\n    " + a.smallInputs.join("\n    "));
  if (a.bigFixed.length) lines.push("  big fixed/sticky:\n    " + a.bigFixed.join("\n    "));
  if (a.smallTaps.count) lines.push("  small taps e.g.:\n    " + a.smallTaps.examples.join("\n    "));
  if (extra?.tallModals?.length) lines.push("  modal problems:\n    " + extra.tallModals.join("\n    "));
  console.log(lines.join("\n"));
  expect.soft(a.overflowPx, `${route} horizontal overflow px; offenders: ${a.offenders.join(" | ")}`).toBeLessThanOrEqual(1);
}

test.use({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
test.describe.configure({ mode: "serial" });

test.afterAll(() => {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/report.json`, JSON.stringify(results, null, 2));
});

const STATIC_PUBLIC = [
  "/",
  "/about",
  "/ai-planner",
  "/best-time-to-visit-pakistan",
  "/best-tour-operators-in-pakistan",
  "/best-travel-agency-in-pakistan",
  "/blog",
  "/cancellation-policy",
  "/contact",
  "/destinations",
  "/guides",
  "/hunza-tour-operator",
  "/hunza-vs-skardu",
  "/is-pakistan-safe-for-tourists",
  "/landings/hunza-trip-from-lahore",
  "/login",
  "/pakistan-tourist-visa-guide",
  "/privacy-policy",
  "/register",
  "/terms-of-service",
  "/thank-you",
  "/tours",
  "/travel-blog",
  "/visa-invitation",
  "/this-page-does-not-exist-mobile",
];

test.describe("public pages @375", () => {
  test.beforeEach(({ page }) => dialogs(page));
  for (const route of STATIC_PUBLIC) {
    test(`public ${route}`, async ({ page }) => {
      await go(page, route);
      await check(page, route);
    });
  }

  for (const [list, prefix] of [
    ["/tours", "/tours/"],
    ["/destinations", "/destinations/"],
    ["/guides", "/guides/"],
    ["/blog", "/blog/"],
  ] as const) {
    test(`public ${prefix}[slug]`, async ({ page }) => {
      await go(page, list);
      await settle(page);
      const href = await page
        .locator(`main a[href^="${prefix}"]`)
        .evaluateAll((els, p) => els.map((e) => e.getAttribute("href")!).find((h) => h.length > p.length && !h.includes("?")), prefix);
      test.skip(!href, `no ${prefix} link on ${list}`);
      await go(page, href!);
      await check(page, href!);
      if (prefix === "/tours/") {
        // Mobile booking / enquiry flow: open the first CTA if present.
        const cta = page.getByRole("button", { name: /book|enquir|inquir|request|quote/i }).first();
        if (await cta.isVisible().catch(() => false)) {
          await cta.click().catch(() => {});
          await page.waitForTimeout(800);
          const tall = await auditModal(page);
          if (tall.length) console.log(`[MOBILE] ${href} booking modal:\n    ${tall.join("\n    ")}`);
          const a = await audit(page);
          expect.soft(a.overflowPx, `${href} after opening booking CTA`).toBeLessThanOrEqual(1);
          await page.screenshot({ path: `${OUT}/${shotName(href!)}_cta.png`, fullPage: false }).catch(() => {});
        }
      }
    });
  }

  test("public mobile nav menu opens without overflow", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const btn = page.getByRole("button", { name: /menu|navigation/i }).first();
    test.skip(!(await btn.isVisible().catch(() => false)), "no mobile menu button");
    await btn.click();
    await page.waitForTimeout(600);
    const a = await audit(page);
    await page.screenshot({ path: `${OUT}/home_menu.png` }).catch(() => {});
    console.log(`[MOBILE] / menu open overflow=${a.overflowPx}`);
    expect.soft(a.overflowPx).toBeLessThanOrEqual(1);
  });
});

const STATIC_ADMIN = [
  "/admin",
  "/admin/about",
  "/admin/analytics",
  "/admin/blog",
  "/admin/bookings",
  "/admin/contact",
  "/admin/custom-itineraries",
  "/admin/destinations",
  "/admin/faqs",
  "/admin/invoices",
  "/admin/invoices/new",
  "/admin/itineraries",
  "/admin/itineraries/new",
  "/admin/itinerary-template",
  "/admin/manage-admins",
  "/admin/provinces",
  "/admin/reviews",
  "/admin/settings",
  "/admin/sites",
  "/admin/tours",
  "/admin/tours/new",
  "/admin/users",
  "/admin/visa-invitations",
  "/dashboard/bookings",
  "/dashboard/profile",
];

// List pages whose "New/Add" button opens a modal.
const MODAL_PAGES: Record<string, RegExp> = {
  "/admin/faqs": /new faq|add faq/i,
  "/admin/destinations": /new destination|add destination/i,
  "/admin/blog": /new (post|guide)|add (post|guide)|write/i,
  "/admin/provinces": /new province|add province/i,
  "/admin/sites": /new site|add site/i,
  "/admin/reviews": /new review|add review/i,
};

test.describe("admin pages @375 (needs E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)", () => {
  test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
    page = await ctx.newPage();
    // Leave editors even if their unsaved-changes guard fires (we never type anything);
    // dismiss every other dialog (delete confirmations etc.).
    page.on("dialog", (d) => {
      if (d.type() === "beforeunload") console.log(`[MOBILE] beforeunload guard fired leaving ${page.url()}`);
      (d.type() === "beforeunload" ? d.accept() : d.dismiss()).catch(() => {});
    });
    await page.goto("/login?next=/admin");
    await page.fill("#login-email", EMAIL!);
    await page.fill("#login-pass", PASSWORD!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((u) => u.pathname.startsWith("/admin"), { timeout: 240_000 });
  });
  test.afterAll(async () => {
    await page?.context().close();
  });

  for (const route of STATIC_ADMIN) {
    test(`admin ${route}`, async () => {
      await go(page, route);
      let tallModals: string[] | undefined;
      const rx = MODAL_PAGES[route];
      if (rx) {
        await settle(page);
        const btn = page.getByRole("button", { name: rx }).first();
        if (await btn.waitFor({ state: "visible", timeout: 30_000 }).then(() => true, () => false)) {
          await btn.click();
          await page.waitForTimeout(800);
          tallModals = await auditModal(page);
          const a = await audit(page);
          await page.screenshot({ path: `${OUT}/${shotName(route)}_modal.png` }).catch(() => {});
          console.log(`[MOBILE] ${route} modal open: overflow=${a.overflowPx} inputs<16=${a.smallInputs.length} problems=${JSON.stringify(tallModals)}`);
          expect.soft(tallModals, `${route} modal`).toEqual([]);
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
          await go(page, route);
        } else {
          console.log(`[MOBILE] ${route} no visible New/Add button matching ${rx}`);
        }
      }
      await check(page, route, tallModals ? { tallModals } : undefined);
    });
  }

  for (const [list, pattern] of [
    ["/admin/tours", /^\/admin\/tours\/[^/]+\/edit$/],
    ["/admin/itineraries", /^\/admin\/itineraries\/(?!new$)[^/]+$/],
    ["/admin/invoices", /^\/admin\/invoices\/(?!new$)[^/]+$/],
  ] as const) {
    test(`admin ${list}/[id]`, async () => {
      await go(page, list);
      await settle(page);
      await page
        .waitForFunction(
          (src) => Array.from(document.querySelectorAll('a[href^="/admin/"]')).some((a) => new RegExp(src).test(a.getAttribute("href") ?? "")),
          pattern.source,
          { timeout: 30_000 },
        )
        .catch(() => {});
      const hrefs =await page.locator('a[href^="/admin/"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
      const href = hrefs.find((h) => pattern.test(h));
      test.skip(!href, `no existing record link on ${list}`);
      await go(page, href!);
      await check(page, href!.replace(/\/[a-z0-9]{20,}/i, "/[id]"));
    });
  }
});
