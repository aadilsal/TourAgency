#!/usr/bin/env node
/**
 * Mobile responsiveness audit for the public site.
 *
 * Read-only: it only navigates and measures — it never clicks, types or submits.
 *
 * Usage:
 *   npx next dev -p 3100            # in another terminal
 *   node scripts/mobile-audit.mjs [--base http://localhost:3100] [--out ./mobile-audit] [--no-shots] [--routes /,/tours]
 *
 * Outputs <out>/report.json, <out>/report.md and full-page screenshots.
 * Exit code is 1 when any route/viewport has horizontal overflow (CI friendly).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argVal = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE = argVal("--base", process.env.AUDIT_BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const OUT = path.resolve(argVal("--out", process.env.AUDIT_OUT_DIR ?? "mobile-audit"));
const SHOTS = !args.includes("--no-shots");
const ONLY = argVal("--routes", "");
const WAIT_MS = Number(argVal("--wait", "2500"));
const VIEWPORT_FILTER = argVal("--viewports", "");
/** Cookie banner state: "dismissed" (default, steady state) or "fresh" (first visit, banner shown). */
const COOKIES = argVal("--cookies", "dismissed");
const EXTRA_ROUTES = argVal("--extra", "");

const VIEWPORTS = [
  { name: "360", width: 360, height: 740, mobile: true },
  { name: "390", width: 390, height: 844, mobile: true },
  { name: "768", width: 768, height: 1024, mobile: true },
  { name: "1280", width: 1280, height: 800, mobile: false },
];

const STATIC_ROUTES = [
  "/",
  "/tours",
  "/destinations",
  "/guides",
  "/blog",
  "/about",
  "/contact",
  "/ai-planner",
  "/visa-invitation",
  "/login",
  "/register",
  "/privacy-policy",
  "/terms-of-service",
  "/cancellation-policy",
  "/thank-you",
  "/pakistan-tourist-visa-guide",
  "/is-pakistan-safe-for-tourists",
  "/best-travel-agency-in-pakistan",
  "/hunza-tour-operator",
  "/this-page-does-not-exist-audit",
];

/** Find the first in-site link matching `/<prefix>/<slug>` on an index page. */
async function discover(page, indexPath, prefix) {
  try {
    await page.goto(BASE + indexPath, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForSelector(`a[href^="/${prefix}/"]`, { timeout: 30_000 }).catch(() => {});
    return await page.evaluate((pre) => {
      const re = new RegExp(`^/${pre}/[^/?#]+$`);
      for (const a of Array.from(document.querySelectorAll("a[href]"))) {
        const href = new URL(a.getAttribute("href"), location.href).pathname;
        if (re.test(href)) return href;
      }
      return null;
    }, prefix);
  } catch {
    return null;
  }
}

/** Runs inside the page: gathers every metric for the current viewport. */
function measure() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const describe = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string" && el.className.trim()
        ? "." + el.className.trim().split(/\s+/).slice(0, 6).join(".")
        : "";
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text}"` : ""}`;
  };
  const isVisible = (el, r) => {
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.01;
  };
  /** Is the element clipped by an ancestor with overflow hidden/clip/auto (e.g. carousels)? */
  const clippedByAncestor = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(hidden|clip|auto|scroll)/.test(cs.overflowX)) {
        const pr = p.getBoundingClientRect();
        if (pr.right <= vw + 1) return true;
      }
    }
    return false;
  };

  const all = Array.from(document.body.querySelectorAll("*"));
  const overflow = [];
  // Children poking out of their (narrower-than-viewport) parent's right edge —
  // catches e.g. a <fieldset> stretched by min-content that still fits the viewport.
  const containerOverflow = [];
  const hiddenOverflow = [];
  const smallText = new Map();
  const smallTargets = [];
  const wideImages = [];

  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (!isVisible(el, r)) continue;

    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed") {
        const entry = { el: describe(el), right: Math.round(r.right), left: Math.round(r.left), width: Math.round(r.width) };
        if (clippedByAncestor(el)) hiddenOverflow.push(entry);
        else overflow.push(entry);
      }
    }

    const parent = el.parentElement;
    if (parent && parent !== document.body && vw < 1024) {
      const cs = getComputedStyle(el);
      const pcs = getComputedStyle(parent);
      const pr = parent.getBoundingClientRect();
      const inFlow = cs.position === "static" || cs.position === "relative";
      const scrollsX = /(auto|scroll)/.test(pcs.overflowX);
      const negativeMargin = parseFloat(cs.marginRight) < 0 || parseFloat(cs.marginLeft) < 0;
      if (inFlow && !scrollsX && !negativeMargin && pcs.display !== "inline" && pr.width > 0 && r.right > pr.right + 4 && !clippedByAncestor(parent)) {
        containerOverflow.push({ el: describe(el), by: Math.round(r.right - pr.right), parent: describe(parent).slice(0, 80) });
      }
    }

    if (el.tagName === "IMG" && r.width > vw + 1 && !clippedByAncestor(el)) {
      wideImages.push({ el: describe(el), width: Math.round(r.width) });
    }

    const hasOwnText = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1,
    );
    if (hasOwnText) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 12) {
        const key = `${el.tagName.toLowerCase()} ${fs}px "${el.textContent.trim().slice(0, 30)}"`;
        smallText.set(key, (smallText.get(key) || 0) + 1);
      }
    }

    const interactive = el.matches(
      'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, summary',
    );
    if (interactive && r.top < document.documentElement.scrollHeight) {
      // Inline text links inside paragraphs are exempt (WCAG 2.5.8 inline exception).
      const inlineText = el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p, li");
      if (!inlineText && (r.width < 40 || r.height < 40)) {
        smallTargets.push({ el: describe(el), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
  }

  // Fixed elements hugging the bottom of the viewport.
  const fixedBottom = all
    .filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed") return false;
      const r = el.getBoundingClientRect();
      return isVisible(el, r) && r.bottom > vh - 160 && r.top < vh && r.height < vh * 0.9;
    })
    .map((el) => ({ el, r: el.getBoundingClientRect() }));
  const outerFixed = fixedBottom.filter(
    (a) => !fixedBottom.some((b) => b.el !== a.el && b.el.contains(a.el)),
  );
  const fixedOverlaps = [];
  for (let i = 0; i < outerFixed.length; i++) {
    for (let j = i + 1; j < outerFixed.length; j++) {
      const a = outerFixed[i].r;
      const b = outerFixed[j].r;
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
        fixedOverlaps.push(`${describe(outerFixed[i].el).slice(0, 90)}  <>  ${describe(outerFixed[j].el).slice(0, 90)}`);
      }
    }
  }

  const heroCandidate = document.querySelector("main section, main > div");
  return {
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    innerWidth: vw,
    docOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > vw,
    pageHeight: document.documentElement.scrollHeight,
    firstSectionHeight: heroCandidate ? Math.round(heroCandidate.getBoundingClientRect().height) : null,
    overflow: overflow.slice(0, 25),
    overflowCount: overflow.length,
    clippedOverflowCount: hiddenOverflow.length,
    containerOverflow: containerOverflow.slice(0, 15),
    containerOverflowCount: containerOverflow.length,
    smallText: Array.from(smallText.entries()).slice(0, 20).map(([k, n]) => `${k} x${n}`),
    smallTextCount: smallText.size,
    smallTargets: smallTargets.slice(0, 30),
    smallTargetCount: smallTargets.length,
    wideImages,
    fixedBottom: outerFixed.map((f) => describe(f.el).slice(0, 90)),
    fixedOverlaps,
    hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
    viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? null,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // AUDIT_CHROMIUM_PATH lets CI / local runs point at an already-installed Chromium.
  const browser = await chromium.launch(
    process.env.AUDIT_CHROMIUM_PATH ? { executablePath: process.env.AUDIT_CHROMIUM_PATH } : {},
  );

  // Discover dynamic slugs.
  const discoveryCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dp = await discoveryCtx.newPage();
  const dynamicRoutes = [];
  for (const [idx, pre] of [["/tours", "tours"], ["/destinations", "destinations"], ["/guides", "guides"], ["/blog", "blog"]]) {
    // Index pages may render their cards client-side; fall back to the home page links.
    const found = (await discover(dp, idx, pre)) ?? (await discover(dp, "/", pre));
    if (found) dynamicRoutes.push(found);
    else console.warn(`! could not discover a /${pre}/<slug> route`);
  }
  await discoveryCtx.close();

  let routes = [...STATIC_ROUTES];
  for (const d of dynamicRoutes) {
    const pre = "/" + d.split("/")[1];
    routes.splice(routes.indexOf(pre) + 1, 0, d);
  }
  if (EXTRA_ROUTES) routes.push(...EXTRA_ROUTES.split(",").map((s) => s.trim()));
  if (ONLY) routes = ONLY.split(",").map((s) => s.trim());

  const results = [];
  for (const vp of VIEWPORTS) {
    if (VIEWPORT_FILTER && !VIEWPORT_FILTER.split(",").includes(vp.name)) continue;
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      reducedMotion: "reduce",
    });
    if (COOKIES === "dismissed") {
      await ctx.addInitScript(() => {
        try {
          window.localStorage.setItem("jt_cookie_consent", "declined");
        } catch {}
      });
    }
    for (const route of routes) {
      const page = await ctx.newPage();
      const consoleErrors = [];
      page.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push(m.text().slice(0, 240));
      });
      page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${String(e.message).slice(0, 240)}`));
      const t0 = Date.now();
      let status = null;
      let metrics = null;
      let error = null;
      try {
        const resp = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 120_000 });
        status = resp?.status() ?? null;
        // Convex keeps a websocket open, so "networkidle" never settles — wait for load + a fixed beat.
        await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => {});
        await page.waitForTimeout(WAIT_MS);
        // Scroll through to trigger lazy content / in-view animations, then back to top.
        await page.evaluate(async () => {
          const step = window.innerHeight * 0.8;
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(600);
        metrics = await page.evaluate(measure);
        if (SHOTS) {
          const file = `${vp.name}__${route === "/" ? "home" : route.replace(/^\//, "").replace(/[/?#]/g, "_")}.png`;
          await page.screenshot({ path: path.join(OUT, file), fullPage: true, timeout: 60_000 }).catch(() => {});
          metrics.screenshot = file;
        }
      } catch (e) {
        error = String(e?.message ?? e).slice(0, 300);
      }
      results.push({ viewport: vp.name, route, status, ms: Date.now() - t0, error, consoleErrors: [...new Set(consoleErrors)].slice(0, 10), ...metrics });
      const m = metrics;
      console.log(
        `${vp.name.padStart(4)} ${route.padEnd(42)} ${status ?? "ERR"} overflow=${m ? `${m.docOverflow ? "YES" : "no"}(${m.overflowCount})` : "-"} inner=${m?.containerOverflowCount ?? "-"} targets<40=${m?.smallTargetCount ?? "-"} text<12=${m?.smallTextCount ?? "-"} fixedOverlap=${m?.fixedOverlaps.length ?? "-"} consoleErr=${consoleErrors.length}`,
      );
      await page.close();
      fs.writeFileSync(path.join(OUT, "report.partial.json"), JSON.stringify(results, null, 2));
    }
    await ctx.close();
  }
  await browser.close();

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2));

  const lines = [
    `# Mobile audit — ${new Date().toISOString()}`,
    "",
    `Base: ${BASE}`,
    "",
    "| Viewport | Route | Status | Doc overflow | Overflowing els | Container overflow | Tap targets <40px | Text <12px | Fixed overlaps | Console errors |",
    "|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const r of results) {
    lines.push(
      `| ${r.viewport} | ${r.route} | ${r.status ?? "ERR"} | ${r.docOverflow ? "YES" : "no"} | ${r.overflowCount ?? "-"} | ${r.containerOverflowCount ?? "-"} | ${r.smallTargetCount ?? "-"} | ${r.smallTextCount ?? "-"} | ${r.fixedOverlaps?.length ?? "-"} | ${r.consoleErrors.length} |`,
    );
  }
  lines.push("", "## Details (mobile viewports)", "");
  for (const r of results.filter((x) => x.viewport !== "1280")) {
    const issues = [];
    if (r.error) issues.push(`- error: ${r.error}`);
    if (r.overflow?.length) issues.push(`- overflow:\n${r.overflow.slice(0, 8).map((o) => `  - ${o.el} (right=${o.right})`).join("\n")}`);
    if (r.containerOverflow?.length) issues.push(`- container overflow:\n${r.containerOverflow.slice(0, 6).map((o) => `  - ${o.el} (+${o.by}px past ${o.parent})`).join("\n")}`);
    if (r.fixedOverlaps?.length) issues.push(`- fixed overlaps:\n${r.fixedOverlaps.map((o) => `  - ${o}`).join("\n")}`);
    if (r.smallTargets?.length) issues.push(`- small targets:\n${r.smallTargets.slice(0, 10).map((o) => `  - ${o.el} ${o.w}x${o.h}`).join("\n")}`);
    if (r.smallText?.length) issues.push(`- small text:\n${r.smallText.slice(0, 8).map((o) => `  - ${o}`).join("\n")}`);
    if (r.consoleErrors?.length) issues.push(`- console:\n${r.consoleErrors.slice(0, 5).map((o) => `  - ${o}`).join("\n")}`);
    if (issues.length) lines.push(`### ${r.viewport} ${r.route}`, ...issues, "");
  }
  fs.writeFileSync(path.join(OUT, "report.md"), lines.join("\n"));
  console.log(`\nReport: ${path.join(OUT, "report.md")}`);

  process.exitCode = results.some((r) => r.docOverflow || r.overflowCount > 0) ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
