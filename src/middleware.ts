import { NextResponse, type NextRequest } from "next/server";
import { CURRENCY_COOKIE, CURRENCY_COOKIE_MAX_AGE } from "@/lib/currency";

/**
 * Redirects that depend on the request run here rather than in pages: a
 * page-level redirect() under a loading.tsx boundary streams, so Next can only
 * answer HTTP 200 + <meta refresh> instead of a real 3xx (bad for SEO, and the
 * client-side redirect can race the refresh). Fixed redirects are in
 * next.config.mjs. The pages keep their own redirects as a fallback.
 */

const SESSION_COOKIE = "junket_session";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
/** How long an edge instance trusts its list of live tour slugs. */
const SLUG_CACHE_MS = 5 * 60 * 1000;

let liveSlugs: { at: number; slugs: Set<string> } | null = null;

async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T | null> {
  if (!CONVEX_URL) return null;
  try {
    const r = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, args, format: "json" }),
    });
    const j = (await r.json()) as { status: string; value?: T };
    return j.status === "success" ? (j.value ?? null) : null;
  } catch {
    return null;
  }
}

async function isLiveSlug(slug: string): Promise<boolean> {
  if (!liveSlugs || Date.now() - liveSlugs.at > SLUG_CACHE_MS) {
    const slugs = await convexQuery<string[]>("tours:listSlugsActive", {});
    if (slugs) liveSlugs = { at: Date.now(), slugs: new Set(slugs) };
  }
  return liveSlugs?.slugs.has(slug) ?? false;
}

function decodeSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Old (renamed) or un-cleaned tour URL → 308 to the live URL. Live slugs take
 * the cached fast path (no extra request); only unknown slugs are looked up.
 */
async function canonicalTourRedirect(req: NextRequest): Promise<NextResponse | null> {
  const m = req.nextUrl.pathname.match(/^\/tours\/([^/]+)\/?$/);
  if (!m) return null;
  const requested = decodeSegment(m[1]!);
  if (await isLiveSlug(requested)) return null;
  const tour = await convexQuery<{ slug: string; isActive?: boolean }>("tours:getTourBySlug", {
    slug: requested,
  });
  if (!tour?.isActive || !tour.slug || tour.slug === requested) return null;
  const url = req.nextUrl.clone();
  // Same form as the sitemap and internal links (the URL setter only encodes
  // what a path can't hold), so search engines see one URL per tour.
  url.pathname = `/tours/${tour.slug}`;
  return NextResponse.redirect(url, 308);
}

/** Logged-out visitors to the dashboard go to login with a real 307. */
function dashboardLoginRedirect(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/dashboard/")) return null;
  if (req.cookies.has(SESSION_COOKIE)) return null; // validity is checked by the layout
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url, 307);
}

function readCountry(req: NextRequest): string | null {
  // Edge providers commonly supply one of these.
  const headerCountry =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-country-code");
  const fromHeader = headerCountry?.trim().toUpperCase();
  if (fromHeader) return fromHeader;

  const fromGeo = req.geo?.country?.trim().toUpperCase();
  return fromGeo || null;
}

/**
 * Picks a first-visit display currency from the visitor's country: PKR in
 * Pakistan, USD everywhere else (the audience is international, so an unknown
 * country is USD too).
 *
 * Only runs when the visitor has no currency yet — once set (by this or by a
 * tour's USD/PKR switch) the visitor's choice is never overwritten. Prices
 * themselves fall back to USD when a tour has no PKR price.
 */
function withCurrency(req: NextRequest): NextResponse {
  if (req.cookies.has(CURRENCY_COOKIE)) return NextResponse.next();

  const currency = readCountry(req) === "PK" ? "PKR" : "USD";

  // Also expose it on this request so the very first page renders in the
  // right currency instead of waiting for the next navigation.
  req.cookies.set(CURRENCY_COOKIE, currency);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(CURRENCY_COOKIE, currency, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CURRENCY_COOKIE_MAX_AGE,
  });
  return res;
}

export async function middleware(req: NextRequest) {
  return (
    dashboardLoginRedirect(req) ??
    (await canonicalTourRedirect(req)) ??
    withCurrency(req)
  );
}

export const config = {
  matcher: [
    // Skip API routes, Next.js internals and static files.
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml|pdf|woff2?)$).*)",
  ],
};
