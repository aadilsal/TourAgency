import { v } from "convex/values";
import {
  internalQuery,
  mutation,
  query,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { requireAdmin, requireUserFromSession } from "./lib/authHelpers.js";
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

export const listForAdmin = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processed"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("visaInvitationRequests").collect();
    const filtered = status ? all.filter((r) => r.status === status) : all;
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setStatus = mutation({
  args: {
    requestId: v.id("visaInvitationRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("rejected"),
    ),
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
      adminNote: adminNote?.trim() || undefined,
      reviewedAt: Date.now(),
      reviewedBy: user._id,
    });
  },
});

export const countPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("visaInvitationRequests").collect();
    return all.filter((r) => r.status === "pending").length;
  },
});
