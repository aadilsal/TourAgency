import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "jt_currency";

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

export function middleware(req: NextRequest) {
  const country = readCountry(req);
  // Default to PKR when country is unknown.
  const currency = !country || country === "PK" ? "PKR" : "USD";

  const res = NextResponse.next();
  // Always set so subsequent navigations stay consistent.
  res.cookies.set(COOKIE, currency, {
    path: "/",
    sameSite: "lax",
    secure: true,
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals + static files
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};

