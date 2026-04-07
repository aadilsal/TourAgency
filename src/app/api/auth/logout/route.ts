import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("junket_session")?.value;
  if (token) {
    try {
      const client = getConvexServer();
      await client.mutation(api.auth.revokeSessionByToken, { token });
    } catch {
      /* ignore */
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("junket_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
