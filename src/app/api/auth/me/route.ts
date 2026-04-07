import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";

/**
 * Client-readable session for the navbar (cookie + Convex). Always fresh — no CDN cache.
 */
export async function GET() {
  const session = await getServerSession();
  const res = NextResponse.json(
    session
      ? {
          user: {
            email: session.email,
            name: session.name,
            role: session.role,
          },
        }
      : { user: null },
  );
  res.headers.set("Cache-Control", "private, no-store, max-age=0");
  return res;
}
