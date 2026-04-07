import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Exposes the opaque session token to the browser so Convex hooks can pass it
 * into queries/mutations (JWT removed). Prefer restoring signed Convex auth for production.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("junket_session")?.value ?? null;
  return NextResponse.json({ token });
}
