import { cookies } from "next/headers";
import { getConvexServer } from "./convex-server";
import { api } from "@convex/_generated/api";

export type ServerSession = NonNullable<
  Awaited<ReturnType<typeof getServerSession>>
>;

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("junket_session")?.value;
  if (!token) return null;
  try {
    const client = getConvexServer();
    return await client.query(api.auth.validateSession, { token });
  } catch {
    return null;
  }
}
