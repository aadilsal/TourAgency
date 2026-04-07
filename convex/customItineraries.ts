import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server.js";
import { requireAdmin } from "./lib/authHelpers.js";

export const createRequest = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    summary: v.string(),
    proposal: v.string(),
    preferredStart: v.optional(v.string()),
    preferredEnd: v.optional(v.string()),
    adults: v.optional(v.number()),
    children: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customItineraryRequests", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const listForAdmin = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("customItineraryRequests").collect();
    const filtered = status
      ? all.filter((r) => r.status === status)
      : all;
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setRequestStatus = mutation({
  args: {
    requestId: v.id("customItineraryRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, status, adminNote }) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(requestId);
    if (!row) throw new Error("Request not found");
    await ctx.db.patch(requestId, {
      status,
      adminNote: adminNote?.trim() || undefined,
      reviewedAt: Date.now(),
      reviewedBy: admin._id,
    });
    await ctx.db.insert("adminLogs", {
      action: "custom_itinerary_review",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `${requestId} → ${status}`,
    });
  },
});
