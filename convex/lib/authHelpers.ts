import type { QueryCtx, MutationCtx } from "../_generated/server.js";
import type { Doc, Id } from "../_generated/dataModel.js";

export type Role = "super_admin" | "admin" | "customer";

/**
 * Resolve a logged-in user from the opaque session token (same as cookie value).
 * JWT / Convex auth providers are disabled for now.
 */
export async function resolveUserFromSessionToken(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined,
): Promise<Doc<"users"> | null> {
  if (!token?.trim()) return null;
  const tokenHash = await hashSessionToken(token.trim());
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .unique();
  if (!session || session.expiresAt < Date.now()) return null;
  const user = await ctx.db.get(session.userId);
  return user ?? null;
}

export async function requireUserFromSession(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string,
): Promise<Doc<"users">> {
  const user = await resolveUserFromSessionToken(ctx, sessionToken);
  if (!user) throw new Error("Not authenticated");
  return user;
}

/**
 * Admin gate for admin-only endpoints. Resolves the CALLER from their session
 * token and checks that caller's role.
 *
 * Never gate an endpoint on "an admin exists somewhere in the users table":
 * every Convex function is reachable by anyone who has the deployment URL, and
 * that URL ships in the browser bundle.
 */
export async function requireAdminFromSession(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string,
): Promise<Doc<"users">> {
  const user = await requireUserFromSession(ctx, sessionToken);
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Admin access required");
  }
  return user;
}

/** Super-admin gate. Same rules as {@link requireAdminFromSession}. */
export async function requireSuperAdminFromSession(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string,
): Promise<Doc<"users">> {
  const user = await requireUserFromSession(ctx, sessionToken);
  if (user.role !== "super_admin") {
    throw new Error("Super admin access required");
  }
  return user;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function hashSessionToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
