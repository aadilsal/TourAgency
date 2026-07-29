import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server.js";
import { requireAdminFromSession } from "./lib/authHelpers.js";

export const createLeadFromAi = internalMutation({
  args: {
    name: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("leads", {
      ...args,
      source: "AI",
      createdAt: Date.now(),
    });
  },
});

export const createLead = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    source: v.union(
      v.literal("AI"),
      v.literal("Booking"),
      v.literal("Manual"),
    ),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leads", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getLeads = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const rows = await ctx.db.query("leads").collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});
