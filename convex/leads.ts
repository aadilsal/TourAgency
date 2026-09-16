import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query, internalMutation } from "./_generated/server.js";
import { requireAdminFromSession } from "./lib/authHelpers.js";
import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api.js";

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

/**
 * Public lead capture (contact page, homepage newsletter). Unauthenticated by
 * design, so it is hardened against spam: bounded input sizes, a honeypot
 * field real visitors never fill, and rate limits per contact and site-wide.
 */
const leadLimiter = new RateLimiter(components.rateLimiter, {
  leadPerContact: { kind: "fixed window", rate: 5, period: HOUR },
  leadGlobal: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 60 },
});

const MAX_NAME = 120;
const MAX_CONTACT = 160;
const MAX_MESSAGE = 4000;

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
    /** Honeypot: hidden input that only bots fill in. */
    website: v.optional(v.string()),
  },
  handler: async (ctx, { website, ...args }) => {
    if (website && website.trim()) {
      throw new Error("We couldn’t send that. Please try again or contact us on WhatsApp.");
    }
    const name = args.name.trim();
    const phone = args.phone.trim();
    const message = args.message?.trim();
    if (!name || !phone) throw new Error("Missing fields");
    if (name.length > MAX_NAME || phone.length > MAX_CONTACT) {
      throw new Error("Please shorten your name or contact details.");
    }
    if (message && message.length > MAX_MESSAGE) {
      throw new Error("Your message is too long. Please shorten it.");
    }

    const tooMany =
      "You've sent several requests recently. Please wait a little, or message us on WhatsApp.";
    const perContact = await leadLimiter.limit(ctx, "leadPerContact", {
      key: phone.toLowerCase().replace(/\s+/g, ""),
    });
    if (!perContact.ok) throw new Error(tooMany);
    const global = await leadLimiter.limit(ctx, "leadGlobal");
    if (!global.ok) throw new Error(tooMany);

    return await ctx.db.insert("leads", {
      name,
      phone,
      source: args.source,
      message: message || undefined,
      createdAt: Date.now(),
    });
  },
});

/** @deprecated Unbounded — use `listLeadsPage`. Kept for deployed clients. */
export const getLeads = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const rows = await ctx.db.query("leads").order("desc").take(5000);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

const leadStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("converted"),
  v.literal("closed"),
);

/** Paginated leads inbox, newest first. */
export const listLeadsPage = query({
  args: {
    sessionToken: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { sessionToken, paginationOpts }) => {
    await requireAdminFromSession(ctx, sessionToken);
    return await ctx.db.query("leads").order("desc").paginate(paginationOpts);
  },
});

/**
 * Update follow-up state on a lead. Patch semantics: an omitted field is left
 * unchanged; `adminNote: ""` clears the note.
 */
export const updateLead = mutation({
  args: {
    sessionToken: v.string(),
    leadId: v.id("leads"),
    status: v.optional(leadStatusValidator),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, leadId, status, adminNote }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");
    const patch: {
      status?: typeof status;
      adminNote?: string | undefined;
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (status !== undefined) patch.status = status;
    if (adminNote !== undefined) patch.adminNote = adminNote.trim() || undefined;
    await ctx.db.patch(leadId, patch);
  },
});
