import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { requireAdmin } from "./lib/authHelpers.js";

export const createRequest = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    summary: v.string(),
    proposal: v.string(),
    thread: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
        }),
      ),
    ),
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

export const getRequestDoc = internalQuery({
  args: { id: v.id("customItineraryRequests") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
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
    const nextAdminNote = adminNote?.trim() || undefined;
    const changedStatus = row.status !== status;
    const changedAdminNote = (row.adminNote ?? undefined) !== nextAdminNote;

    await ctx.db.patch(requestId, {
      status,
      adminNote: nextAdminNote,
      reviewedAt: Date.now(),
      reviewedBy: admin._id,
    });
    await ctx.db.insert("adminLogs", {
      action: "custom_itinerary_review",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `${requestId} → ${status}`,
    });

    if (changedStatus || changedAdminNote) {
      await ctx.scheduler.runAfter(
        0,
        internal.email.sendCustomItineraryStatusUpdate,
        {
          requestId,
          status,
          adminNote: nextAdminNote,
          changedStatus,
          changedAdminNote,
        },
      );
    }
  },
});

export const setAdminNote = mutation({
  args: {
    requestId: v.id("customItineraryRequests"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, adminNote }) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(requestId);
    if (!row) throw new Error("Request not found");
    if (row.status === "pending") {
      throw new Error("Add a note during approve/reject, or review first");
    }

    const nextAdminNote = adminNote?.trim() || undefined;
    const changedAdminNote = (row.adminNote ?? undefined) !== nextAdminNote;
    if (!changedAdminNote) return;

    await ctx.db.patch(requestId, {
      adminNote: nextAdminNote,
      reviewedAt: Date.now(),
      reviewedBy: admin._id,
    });
    await ctx.db.insert("adminLogs", {
      action: "custom_itinerary_note",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `${requestId} → note`,
    });

    await ctx.scheduler.runAfter(0, internal.email.sendCustomItineraryStatusUpdate, {
      requestId,
      status: row.status,
      adminNote: nextAdminNote,
      changedStatus: false,
      changedAdminNote: true,
    });
  },
});

export const setAdminDraft = mutation({
  args: {
    requestId: v.id("customItineraryRequests"),
    adminDraft: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, adminDraft }) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(requestId);
    if (!row) throw new Error("Request not found");
    await ctx.db.patch(requestId, {
      adminDraft: adminDraft?.trim() || undefined,
      adminDraftUpdatedAt: Date.now(),
      reviewedBy: row.reviewedBy ?? admin._id,
    });
    await ctx.db.insert("adminLogs", {
      action: "custom_itinerary_draft",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `${requestId} → draft`,
    });
  },
});
