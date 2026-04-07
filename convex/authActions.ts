"use node";

import { v } from "convex/values";
import { action, type ActionCtx } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import type { Id } from "./_generated/dataModel.js";

const SESSION_MS = 1000 * 60 * 60 * 24 * 14;
const SALT_ROUNDS = 10;

function sha256Hex(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

async function issueSession(
  ctx: ActionCtx,
  userId: Id<"users">,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(token);
  const expiresAt = Date.now() + SESSION_MS;
  await ctx.runMutation(internal.auth.createSession, {
    userId,
    tokenHash,
    expiresAt,
  });
  return token;
}

export const register = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { name, email, password, phone },
  ): Promise<{ sessionToken: string; userId: Id<"users"> }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: normalizedEmail,
    });
    if (existing) throw new Error("Email already registered");
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const phoneNormalized = phone ? phone.replace(/\D/g, "") : undefined;
    const userId = await ctx.runMutation(internal.users.insertUser, {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      phoneNormalized: phoneNormalized || undefined,
      passwordHash,
      role: "customer",
    });
    await ctx.runMutation(internal.users.linkGuestBookingsForUser, {
      userId,
      phoneNormalized: phoneNormalized || undefined,
      email: normalizedEmail,
    });
    const sessionToken = await issueSession(ctx, userId);
    return { sessionToken, userId };
  },
});

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (
    ctx,
    { email, password },
  ): Promise<{ sessionToken: string; userId: Id<"users"> }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: normalizedEmail,
    });
    if (!user) throw new Error("Invalid email or password");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid email or password");
    const sessionToken = await issueSession(ctx, user._id);
    return { sessionToken, userId: user._id };
  },
});

export const bootstrapSuperAdmin = action({
  args: {
    secret: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (
    ctx,
    { secret, name, email, password },
  ): Promise<{ sessionToken: string; userId: Id<"users"> }> => {
    if (secret !== process.env.BOOTSTRAP_SECRET) {
      throw new Error("Unauthorized");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: normalizedEmail,
    });
    if (existing) throw new Error("User already exists");
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await ctx.runMutation(internal.users.insertUser, {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "super_admin",
    });
    const sessionToken = await issueSession(ctx, userId);
    return { sessionToken, userId };
  },
});

export const createAdminUser = action({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: true }> => {
    const ok = await ctx.runQuery(internal.auth.isSuperAdminSession, {
      sessionToken: args.sessionToken,
    });
    if (!ok) throw new Error("Super admin only");
    const normalizedEmail = args.email.trim().toLowerCase();
    const existing = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: normalizedEmail,
    });
    if (existing) throw new Error("Email already registered");
    const passwordHash = await bcrypt.hash(args.password, SALT_ROUNDS);
    await ctx.runMutation(internal.users.insertUser, {
      name: args.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "admin",
    });
    return { ok: true as const };
  },
});
