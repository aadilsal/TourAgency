import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { requireAdmin, requireSuperAdmin } from "./lib/authHelpers.js";

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("users").collect();
    return all.map((u) => ({
      _id: u._id,
      _creationTime: u._creationTime,
      name: u.name,
      email: u.email,
      phone: u.phone,
      phoneNormalized: u.phoneNormalized,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
    }));
  },
});

export const getAdmins = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("users").collect();
    return all
      .filter((u) => u.role === "admin" || u.role === "super_admin")
      .map((u) => ({
        _id: u._id,
        _creationTime: u._creationTime,
        name: u.name,
        email: u.email,
        phone: u.phone,
        phoneNormalized: u.phoneNormalized,
        role: u.role,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
      }));
  },
});

export const promoteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const admin = await requireSuperAdmin(ctx);
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
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const admin = await requireSuperAdmin(ctx);
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
