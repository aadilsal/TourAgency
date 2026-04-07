import { NextResponse } from "next/server";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: toUserFacingErrorMessage("Missing fields") },
        { status: 400 },
      );
    }
    const client = getConvexServer();
    const result = await client.action(api.authActions.login, {
      email: body.email,
      password: body.password,
    });
    const res = NextResponse.json({ ok: true, userId: result.userId });
    res.cookies.set("junket_session", result.sessionToken, cookieOpts);
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: toUserFacingErrorMessage(e) },
      { status: 401 },
    );
  }
}
