import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server.js";
import type { Doc } from "./_generated/dataModel.js";
import {
  requireAdminFromSession,
  requireSuperAdminFromSession,
} from "./lib/authHelpers.js";

const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("customer"),
);

/** Public shape of a user row for admin screens (never includes passwordHash). */
function toUserRow(u: Doc<"users">) {
  return {
    _id: u._id,
    _creationTime: u._creationTime,
    name: u.name,
    email: u.email,
    phone: u.phone,
    phoneNormalized: u.phoneNormalized,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
  };
}

/**
 * @deprecated Use `listUsersPage` / `searchUsers`. Kept for the deployed
 * frontend; bounded to the newest 2000 users so it can't hit read limits.
 */
export const getUsers = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const rows = await ctx.db.query("users").order("desc").take(2000);
    return rows.map(toUserRow);
  },
});

/** Paginated users, newest first, optionally filtered by role. */
export const listUsersPage = query({
  args: {
    sessionToken: v.string(),
    paginationOpts: paginationOptsValidator,
    role: v.optional(roleValidator),
  },
  handler: async (ctx, { sessionToken, paginationOpts, role }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const q = role
      ? ctx.db
          .query("users")
          .withIndex("by_role", (i) => i.eq("role", role))
          .order("desc")
      : ctx.db.query("users").order("desc");
    const result = await q.paginate(paginationOpts);
    return { ...result, page: result.page.map(toUserRow) };
  },
});

/** Find users by exact email or by name (full-text), across the whole table. */
export const searchUsers = query({
  args: { sessionToken: v.string(), term: v.string() },
  handler: async (ctx, { sessionToken, term }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const t = term.trim();
    if (!t) return [];
    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (i) => i.eq("email", t.toLowerCase()))
      .take(1);
    const byName = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (s) => s.search("name", t))
      .take(25);
    const seen = new Set<string>();
    return [...byEmail, ...byName]
      .filter((u) => (seen.has(u._id) ? false : (seen.add(u._id), true)))
      .map(toUserRow);
  },
});

/** All admins and super admins (indexed by role). */
export const getAdmins = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const [supers, admins] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_role", (i) => i.eq("role", "super_admin"))
        .take(200),
      ctx.db
        .query("users")
        .withIndex("by_role", (i) => i.eq("role", "admin"))
        .take(500),
    ]);
    return [...supers, ...admins].map(toUserRow);
  },
});

export const promoteUser = mutation({
  args: { sessionToken: v.string(), userId: v.id("users") },
  handler: async (ctx, { sessionToken, userId }) => {
    const admin = await requireSuperAdminFromSession(ctx, sessionToken);
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("User not found");
    if (target.role === "super_admin") throw new Error("Cannot change super admin");
    await ctx.db.patch(userId, { role: "admin" });
    await ctx.db.insert("adminLogs", {
      action: "promote_user",
      performedBy: admin._id,
      targetUser: userId,
      timestamp: Date.now(),
      details: "Promoted to admin",
    });
  },
});

export const demoteAdmin = mutation({
  args: { sessionToken: v.string(), userId: v.id("users") },
  handler: async (ctx, { sessionToken, userId }) => {
    const admin = await requireSuperAdminFromSession(ctx, sessionToken);
    if (admin._id === userId) throw new Error("Cannot demote yourself");
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("User not found");
    if (target.role === "super_admin") throw new Error("Cannot demote super admin");
    await ctx.db.patch(userId, { role: "customer" });
    await ctx.db.insert("adminLogs", {
      action: "demote_admin",
      performedBy: admin._id,
      targetUser: userId,
      timestamp: Date.now(),
      details: "Demoted to customer",
    });
  },
});
