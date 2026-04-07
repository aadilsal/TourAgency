import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { resolveUserFromSessionToken } from "./lib/authHelpers.js";

/** Must match `PLANNER_WELCOME_MESSAGE` in `src/lib/planner-welcome.ts`. */
const DEFAULT_WELCOME =
  "Hi — I'm your JunketTours trip assistant. Tell me your budget, how many days, departure city, and what you enjoy (lakes, easy hikes, family-friendly, honeymoon pace, etc.). I'll match you to our real packages, share a day-by-day outline, and flag anything that needs a custom quote from our team.";

const msgValidator = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

const MAX_MESSAGES = 80;

export const getByGuestId = query({
  args: { guestSessionId: v.string() },
  handler: async (ctx, { guestSessionId }) => {
    const doc = await ctx.db
      .query("plannerChatSessions")
      .withIndex("by_guest_session", (q) =>
        q.eq("guestSessionId", guestSessionId),
      )
      .first();
    if (!doc) return null;
    return {
      _id: doc._id,
      messages: doc.messages,
      planSnapshot: doc.planSnapshot,
      updatedAt: doc.updatedAt,
    };
  },
});

export const ensureSession = mutation({
  args: {
    guestSessionId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { guestSessionId, sessionToken }) => {
    const user = await resolveUserFromSessionToken(ctx, sessionToken);
    const linkedUserId = user?._id;

    const existing = await ctx.db
      .query("plannerChatSessions")
      .withIndex("by_guest_session", (q) =>
        q.eq("guestSessionId", guestSessionId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      if (linkedUserId && existing.userId !== linkedUserId) {
        await ctx.db.patch(existing._id, { userId: linkedUserId, updatedAt: now });
      }
      return existing._id;
    }

    return await ctx.db.insert("plannerChatSessions", {
      guestSessionId,
      userId: linkedUserId,
      messages: [{ role: "assistant", content: DEFAULT_WELCOME }],
      planSnapshot: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const syncMessages = mutation({
  args: {
    guestSessionId: v.string(),
    messages: v.array(msgValidator),
    planSnapshot: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("plannerChatSessions")
      .withIndex("by_guest_session", (q) =>
        q.eq("guestSessionId", args.guestSessionId),
      )
      .first();
    if (!doc) throw new Error("Planner session not found");

    const user = await resolveUserFromSessionToken(ctx, args.sessionToken);
    const linkedUserId = user?._id ?? doc.userId;

    const now = Date.now();
    const capped = args.messages.slice(-MAX_MESSAGES);
    await ctx.db.patch(doc._id, {
      messages: capped,
      planSnapshot: args.planSnapshot,
      userId: linkedUserId,
      updatedAt: now,
    });
  },
});

export const clearSession = mutation({
  args: {
    guestSessionId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { guestSessionId, sessionToken }) => {
    const doc = await ctx.db
      .query("plannerChatSessions")
      .withIndex("by_guest_session", (q) =>
        q.eq("guestSessionId", guestSessionId),
      )
      .first();
    if (!doc) return;

    const user = await resolveUserFromSessionToken(ctx, sessionToken);
    const linkedUserId = user?._id ?? doc.userId;

    const now = Date.now();
    await ctx.db.patch(doc._id, {
      messages: [{ role: "assistant", content: DEFAULT_WELCOME }],
      planSnapshot: undefined,
      userId: linkedUserId,
      updatedAt: now,
    });
  },
});
