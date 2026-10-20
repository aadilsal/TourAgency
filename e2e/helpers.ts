import { expect, type Page } from "@playwright/test";

export const IGNORED_CONSOLE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /favicon/i];

/** Collects console errors and failed requests during a test. */
export function watch(page: Page) {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED_CONSOLE.some((r) => r.test(m.text()))) errors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 300)));
  page.on("response", (r) => {
    if (r.status() >= 400 && !/_next\/image|favicon/.test(r.url())) failed.push(`${r.status()} ${r.url()}`);
  });
  page.on("requestfailed", (r) => {
    const f = r.failure()?.errorText ?? "";
    if (!/ERR_ABORTED/.test(f)) failed.push(`FAILED ${r.url()} ${f}`);
  });
  return { errors, failed };
}

/** Reports findings to stdout (tagged E2E-FINDING) without failing the test. */
export function report(label: string, w: { errors: string[]; failed: string[] }) {
  if (w.errors.length || w.failed.length) {
    console.log(`[E2E-FINDING] ${label}\n  console: ${JSON.stringify(w.errors)}\n  requests: ${JSON.stringify(w.failed)}`);
  }
}

export async function noHorizontalScroll(page: Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over, "horizontal overflow px").toBeLessThanOrEqual(1);
}

export function dialogs(page: Page) {
  page.on("dialog", (d) => d.dismiss().catch(() => {}));
}
