import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  internalQuery,
} from "./_generated/server.js";
import {
  resolveUserFromSessionToken,
  hashSessionToken,
  requireUserFromSession,
  normalizePhone,
} from "./lib/authHelpers.js";
import { internal } from "./_generated/api.js";
import type { Id } from "./_generated/dataModel.js";

const SESSION_MS = 1000 * 60 * 60 * 24 * 14;

export const createSession = internalMutation({
  args: {
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { userId, tokenHash, expiresAt }) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      userId,
      tokenHash,
      expiresAt,
      createdAt: now,
    });
  },
});

export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const tokenHash = await hashSessionToken(token);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!session || session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId);
    if (!user) return null;
    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

export const getUserBySubject = internalQuery({
  args: { subject: v.string() },
  handler: async (ctx, { subject }) => {
    return await ctx.db.get(subject as Id<"users">);
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
  },
});

export const getCurrentUser = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, { sessionToken }) => {
    if (!sessionToken) return null;
    return await resolveUserFromSessionToken(ctx, sessionToken);
  },
});

export const revokeSessionByToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const tokenHash = await hashSessionToken(token);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await resolveUserFromSessionToken(ctx, sessionToken);
    if (!user) return;
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const s of sessions) await ctx.db.delete(s._id);
  },
});

export const updateProfile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, name, phone }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Name is required");
    const trimmedPhone = phone?.trim();
    const phoneNormalized = trimmedPhone ? normalizePhone(trimmedPhone) : undefined;
    await ctx.db.patch(user._id, {
      name: trimmedName,
      phone: trimmedPhone || undefined,
      phoneNormalized: phoneNormalized || undefined,
    });
    await ctx.runMutation(internal.users.linkGuestBookingsForUser, {
      userId: user._id,
      phoneNormalized,
      email: user.email.trim().toLowerCase(),
    });
  },
});

export const sessionTtlMs = query({
  args: {},
  handler: async () => SESSION_MS,
});

/** Used by Node actions (e.g. remote image ingest) to verify admin session. */
export const isAdminSession = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await resolveUserFromSessionToken(ctx, sessionToken);
    if (!user) return false;
    return user.role === "admin" || user.role === "super_admin";
  },
});

export const isSuperAdminSession = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await resolveUserFromSessionToken(ctx, sessionToken);
    return user?.role === "super_admin";
  },
});
