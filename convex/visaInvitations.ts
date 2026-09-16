import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  internalQuery,
  mutation,
  query,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { requireAdminFromSession, requireUserFromSession } from "./lib/authHelpers.js";
import { validateVisaSubmission } from "./lib/visaValidation.js";

const travelerValidator = v.object({
  name: v.string(),
  sex: v.union(
    v.literal("male"),
    v.literal("female"),
    v.literal("other"),
  ),
  nationalityCode: v.string(),
  nationalityLabel: v.string(),
  dateOfBirth: v.string(),
  passportNumber: v.string(),
  passportIssueDate: v.string(),
  passportExpiryDate: v.string(),
});

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

export const createRequest = mutation({
  args: {
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    travelers: v.array(travelerValidator),
    consentGiven: v.boolean(),
  },
  handler: async (ctx, args) => {
    const validated = validateVisaSubmission(args);
    if (!validated.ok) throw new Error(validated.message);

    const { normalized } = validated;

    const recent = await ctx.db
      .query("visaInvitationRequests")
      .withIndex("by_contact_email", (q) =>
        q.eq("contactEmail", normalized.contactEmail),
      )
      .collect();

    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recentCount = recent.filter((r) => r.createdAt >= cutoff).length;
    if (recentCount >= RATE_LIMIT_MAX) {
      throw new Error(
        "Too many requests from this email. Please try again later or contact us directly.",
      );
    }

    const requestId = await ctx.db.insert("visaInvitationRequests", {
      contactName: normalized.contactName,
      contactEmail: normalized.contactEmail,
      contactPhone: normalized.contactPhone,
      contactPhoneNormalized: normalized.contactPhoneNormalized,
      travelers: normalized.travelers,
      status: "pending",
      consentGiven: normalized.consentGiven,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      0,
      internal.email.sendVisaInvitationNotification,
      { requestId },
    );

    return { requestId };
  },
});

export const getRequestDoc = internalQuery({
  args: { id: v.id("visaInvitationRequests") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

const visaStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processed"),
  v.literal("rejected"),
);

/**
 * Patch semantics for notes: `undefined` = leave unchanged, "" (or whitespace)
 * = explicitly clear, anything else = set.
 */
function notePatch(adminNote: string | undefined): { adminNote?: string | undefined } {
  if (adminNote === undefined) return {};
  return { adminNote: adminNote.trim() || undefined };
}

/** @deprecated Unbounded — use `listForAdminPage`. Kept for deployed clients. */
export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(visaStatusValidator),
  },
  handler: async (ctx, { sessionToken, status }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const rows = status
      ? await ctx.db
          .query("visaInvitationRequests")
          .withIndex("by_status", (q) => q.eq("status", status))
          .order("desc")
          .take(5000)
      : await ctx.db
          .query("visaInvitationRequests")
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
    status: v.optional(visaStatusValidator),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { sessionToken, status, paginationOpts }) => {
    await requireAdminFromSession(ctx, sessionToken);
    if (status) {
      return await ctx.db
        .query("visaInvitationRequests")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .paginate(paginationOpts);
    }
    return await ctx.db
      .query("visaInvitationRequests")
      .withIndex("by_created")
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const setStatus = mutation({
  args: {
    requestId: v.id("visaInvitationRequests"),
    status: visaStatusValidator,
    /** Omit to keep the existing note; "" clears it. */
    adminNote: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, { requestId, status, adminNote, sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const row = await ctx.db.get(requestId);
    if (!row) throw new Error("Request not found");

    await ctx.db.patch(requestId, {
      status,
      ...notePatch(adminNote),
      reviewedAt: Date.now(),
      reviewedBy: user._id,
    });
  },
});

/** Update only the internal note (status untouched). "" clears it. */
export const setAdminNote = mutation({
  args: {
    sessionToken: v.string(),
    requestId: v.id("visaInvitationRequests"),
    adminNote: v.string(),
  },
  handler: async (ctx, { sessionToken, requestId, adminNote }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const row = await ctx.db.get(requestId);
    if (!row) throw new Error("Request not found");
    await ctx.db.patch(requestId, {
      ...notePatch(adminNote),
      reviewedAt: Date.now(),
      reviewedBy: admin._id,
    });
  },
});

export const countPending = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const pending = await ctx.db
      .query("visaInvitationRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(1000);
    return pending.length;
  },
});
