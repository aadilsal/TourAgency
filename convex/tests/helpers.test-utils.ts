/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "../schema.js";
import { hashSessionToken } from "../lib/authHelpers.js";

export const modules = import.meta.glob("../**/*.ts");

export function newTest() {
  return convexTest(schema, modules);
}

/** Creates a user + live session and returns the raw session token. */
export async function signIn(
  t: ReturnType<typeof newTest>,
  role: "super_admin" | "admin" | "customer" = "admin",
  email = `${role}-${Math.random().toString(36).slice(2)}@test.dev`,
): Promise<string> {
  const token = `tok-${Math.random().toString(36).slice(2)}`;
  const tokenHash = await hashSessionToken(token);
  await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      email,
      name: "Test User",
      role,
      passwordHash: "test",
      createdAt: Date.now(),
    });
    await ctx.db.insert("sessions", {
      userId,
      tokenHash,
      expiresAt: Date.now() + 60_000_000,
      createdAt: Date.now(),
    });
  });
  return token;
}
