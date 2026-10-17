import { NextResponse, type NextRequest } from "next/server";
import { CURRENCY_COOKIE, CURRENCY_COOKIE_MAX_AGE } from "@/lib/currency";

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
 * Only runs when the visitor has no currency yet — once set (by this or by the
 * header USD/PKR switch) the visitor's choice is never overwritten. Prices
 * themselves fall back to USD when a tour has no PKR price.
 */
export function middleware(req: NextRequest) {
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

export const config = {
  matcher: [
    // Skip API routes, Next.js internals and static files.
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml|pdf|woff2?)$).*)",
  ],
};
