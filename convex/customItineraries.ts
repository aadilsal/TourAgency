import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { requireAdminFromSession } from "./lib/authHelpers.js";

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

const requestStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);

/** @deprecated Unbounded — use `listForAdminPage`. Kept for deployed clients. */
export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(requestStatusValidator),
  },
  handler: async (ctx, { sessionToken, status }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const rows = status
      ? await ctx.db
          .query("customItineraryRequests")
          .withIndex("by_status", (q) => q.eq("status", status))
          .order("desc")
          .take(5000)
      : await ctx.db
          .query("customItineraryRequests")
          .withIndex("by_created")
          .order("desc")
          .take(5000);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Paginated admin inbox, newest first, optional status filter (indexed). */
export const listForAdminPage = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(requestStatusValidator),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { sessionToken, status, paginationOpts }) => {
    await requireAdminFromSession(ctx, sessionToken);
    if (status) {
      return await ctx.db
        .query("customItineraryRequests")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .paginate(paginationOpts);
    }
    return await ctx.db
      .query("customItineraryRequests")
      .withIndex("by_created")
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const setRequestStatus = mutation({
  args: {
    sessionToken: v.string(),
    requestId: v.id("customItineraryRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    /** Omit to keep the existing note; "" clears it. */
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, requestId, status, adminNote }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const row = await ctx.db.get(requestId);
    if (!row) throw new Error("Request not found");
    // Omitted note = unchanged (a status change must never wipe the note).
    const nextAdminNote =
      adminNote === undefined ? row.adminNote : adminNote.trim() || undefined;
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

/**
 * Set the note on a request. This is the dedicated note editor, so an empty
 * value clears the note. On reviewed requests the customer is emailed the
 * update; on pending requests the note is saved silently.
 */
export const setAdminNote = mutation({
  args: {
    sessionToken: v.string(),
    requestId: v.id("customItineraryRequests"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, requestId, adminNote }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const row = await ctx.db.get(requestId);
    if (!row) throw new Error("Request not found");

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

    if (row.status === "pending") return;
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
    sessionToken: v.string(),
    requestId: v.id("customItineraryRequests"),
    adminDraft: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, requestId, adminDraft }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
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
