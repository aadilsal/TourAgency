import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

/** Fresh module per test: CONVEX_URL and the slug cache are module-level. */
async function loadMiddleware() {
  vi.resetModules();
  return (await import("@/middleware")).middleware;
}

function req(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`https://www.junkettours.co${path}`, { headers });
}

/** Fake Convex: live slugs + slug → tour lookups (aliases resolve to the live tour). */
function fakeConvex(live: string[], lookup: Record<string, { slug: string; isActive: boolean }>) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    const { path, args } = JSON.parse(init.body) as { path: string; args: { slug?: string } };
    calls.push(path);
    const value = path === "tours:listSlugsActive" ? live : (lookup[args.slug ?? ""] ?? null);
    return new Response(JSON.stringify({ status: "success", value }));
  });
  return calls;
}

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://example.convex.cloud"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("currency", () => {
  test("first visit from Pakistan defaults to PKR", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(req("/about", { "x-vercel-ip-country": "PK" }));
    expect(res.cookies.get("jt_currency")?.value).toBe("PKR");
  });

  test("first visit from anywhere else defaults to USD", async () => {
    const middleware = await loadMiddleware();
    expect((await middleware(req("/about", { "x-vercel-ip-country": "GB" }))).cookies.get("jt_currency")?.value).toBe("USD");
    expect((await middleware(req("/about"))).cookies.get("jt_currency")?.value).toBe("USD");
  });

  test("the first page already renders in the chosen currency", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(req("/about", { "x-vercel-ip-country": "PK" }));
    expect(res.headers.get("x-middleware-request-cookie")).toContain("jt_currency=PKR");
  });

  test("never overrides a visitor's own choice", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(req("/about", { "x-vercel-ip-country": "PK", cookie: "jt_currency=USD" }));
    expect(res.cookies.get("jt_currency")).toBeUndefined();
  });
});

describe("dashboard login redirect (real 307, not a streamed meta refresh)", () => {
  test("logged-out visitor is sent to login, returning to the same page", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(req("/dashboard/bookings"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    expect(new URL(res.headers.get("location")!).searchParams.get("next")).toBe("/dashboard/bookings");
  });

  test("visitor with a session cookie passes through", async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(req("/dashboard/bookings", { cookie: "junket_session=abc" }));
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("canonical tour URLs (real 308 for SEO)", () => {
  test("old/renamed slug redirects permanently to the live URL", async () => {
    fakeConvex(["hunza-explorer"], { "hunza-valley": { slug: "hunza-explorer", isActive: true } });
    const middleware = await loadMiddleware();
    const res = await middleware(req("/tours/hunza-valley"));
    expect(res.status).toBe(308);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/tours/hunza-explorer");
  });

  test("live slug passes through using the cache (no per-request lookup)", async () => {
    const calls = fakeConvex(["hunza-explorer"], {});
    const middleware = await loadMiddleware();
    await middleware(req("/tours/hunza-explorer"));
    await middleware(req("/tours/hunza-explorer"));
    expect((await middleware(req("/tours/hunza-explorer"))).headers.get("location")).toBeNull();
    expect(calls).toEqual(["tours:listSlugsActive"]); // fetched once, then cached
  });

  test("slug with '&' keeps the same URL form as the sitemap", async () => {
    fakeConvex(["gandhara-&-buddhist"], {});
    const middleware = await loadMiddleware();
    const res = await middleware(req("/tours/gandhara-%26-buddhist"));
    expect(res.headers.get("location")).toBeNull();
  });

  test("unknown slug falls through to the page's 404", async () => {
    fakeConvex(["hunza-explorer"], {});
    const middleware = await loadMiddleware();
    expect((await middleware(req("/tours/no-such-tour"))).headers.get("location")).toBeNull();
  });

  test("inactive tour is not redirected to", async () => {
    fakeConvex([], { old: { slug: "hidden-tour", isActive: false } });
    const middleware = await loadMiddleware();
    expect((await middleware(req("/tours/old"))).headers.get("location")).toBeNull();
  });

  test("Convex outage never breaks the page (falls through)", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("network down");
    });
    const middleware = await loadMiddleware();
    expect((await middleware(req("/tours/anything"))).headers.get("location")).toBeNull();
  });
});
