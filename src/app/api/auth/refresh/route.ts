import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

const SESSION_MAX_AGE_S = 60 * 60 * 24 * 14;

/**
 * Sliding session renewal: extends the Convex session and the cookie while the
 * user is active. Returns 401 when the session is gone so the UI can warn
 * without throwing away whatever the user is editing.
 */
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("junket_session")?.value;
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const client = getConvexServer();
    const result = await client.mutation(api.auth.renewSession, { token });
    if (!result) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, expiresAt: result.expiresAt, role: result.role });
    res.cookies.set("junket_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_S,
    });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch {
    // Network/Convex hiccup: not proof the session is gone — don't alarm the user.
    return NextResponse.json({ ok: true, transient: true });
  }
}
