import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { requireUserFromSession } from "./lib/authHelpers.js";
import type { Doc, Id } from "./_generated/dataModel.js";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

const DEFAULT_CATEGORY = "General Travel FAQs";

function normalizeCategory(category: string | undefined) {
  const c = (category ?? "").trim();
  return c || DEFAULT_CATEGORY;
}

export const listPublic = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    const c = category ? normalizeCategory(category) : undefined;
    if (c) {
      return await ctx.db
        .query("faqs")
        .withIndex("by_active_and_category_and_sort_order", (q) =>
          q.eq("isActive", true).eq("category", c),
        )
        .order("asc")
        .take(200);
    }
    const rows = await ctx.db
      .query("faqs")
      .withIndex("by_active_and_sort_order", (q) => q.eq("isActive", true))
      .order("asc")
      .take(200);
    return rows;
  },
});

export const listAdmin = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const rows = await ctx.db
      .query("faqs")
      .withIndex("by_sort_order", (q) => q)
      .order("asc")
      .take(500);
    return rows;
  },
});

export const upsert = mutation({
  args: {
    sessionToken: v.string(),
    faqId: v.optional(v.id("faqs")),
    question: v.string(),
    answer: v.string(),
    category: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, faqId, ...args }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const now = Date.now();

    const patch: Partial<Omit<Doc<"faqs">, "_id" | "_creationTime">> = {
      question: args.question.trim(),
      answer: args.answer.trim(),
      category: normalizeCategory(args.category),
      updatedAt: now,
    };

    if (args.sortOrder !== undefined) patch.sortOrder = args.sortOrder;
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    if (faqId) {
      await ctx.db.patch(faqId, patch);
      return faqId;
    }

    const sortOrder =
      args.sortOrder ??
      (await (async () => {
        const last = await ctx.db
          .query("faqs")
          .withIndex("by_sort_order", (q) => q)
          .order("desc")
          .take(1);
        return (last[0]?.sortOrder ?? 0) + 1;
      })());

    const id = await ctx.db.insert("faqs", {
      question: patch.question ?? "",
      answer: patch.answer ?? "",
      category: patch.category ?? DEFAULT_CATEGORY,
      sortOrder,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const setActive = mutation({
  args: { sessionToken: v.string(), faqId: v.id("faqs"), isActive: v.boolean() },
  handler: async (ctx, { sessionToken, faqId, isActive }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    await ctx.db.patch(faqId, { isActive, updatedAt: Date.now() });
  },
});

export const setSortOrder = mutation({
  args: { sessionToken: v.string(), faqId: v.id("faqs"), sortOrder: v.number() },
  handler: async (ctx, { sessionToken, faqId, sortOrder }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    await ctx.db.patch(faqId, { sortOrder, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), faqId: v.id("faqs") },
  handler: async (ctx, { sessionToken, faqId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    await ctx.db.delete(faqId);
  },
});

export const seedSampleFaqs = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const existing = await ctx.db.query("faqs").take(1);
    if (existing.length > 0) return { inserted: 0, skipped: true as const };

    const now = Date.now();
    const seed: Array<{
      question: string;
      answer: string;
      category: string;
      sortOrder: number;
      isActive: boolean;
    }> = [
      {
        question: "Do I need a visa for this trip?",
        answer:
          "Visa requirements depend on your nationality and the regions you plan to visit. Share your passport country and travel dates and we’ll guide you through the right option.",
        category: DEFAULT_CATEGORY,
        sortOrder: 1,
        isActive: true,
      },
      {
        question: "What’s included in the tour package?",
        answer:
          "Most packages include accommodation, transport, guided activities, and meals where mentioned. The final inclusion list is shared during booking based on your selected tour.",
        category: DEFAULT_CATEGORY,
        sortOrder: 2,
        isActive: true,
      },
      {
        question: "Are flights included in the tour package?",
        answer:
          "Flights are usually not included unless the itinerary explicitly says so. If you want, we can quote flights separately or recommend the best routing.",
        category: DEFAULT_CATEGORY,
        sortOrder: 3,
        isActive: true,
      },
      {
        question: "Can I customize my itinerary?",
        answer:
          "Yes. Tell us your destinations, days, budget, and preferred hotels, and we’ll tailor a plan. For complex routes, we may suggest a few optimized alternatives.",
        category: DEFAULT_CATEGORY,
        sortOrder: 4,
        isActive: true,
      },
      {
        question: "Is it safe to travel in Pakistan?",
        answer:
          "Yes, most northern areas are safe for tourism when traveled with local guidance. We operate in secure regions and plan routes with current conditions in mind.",
        category: DEFAULT_CATEGORY,
        sortOrder: 5,
        isActive: true,
      },
      {
        question: "What kind of accommodations will I stay in?",
        answer:
          "We offer budget, mid-range, and premium hotel options depending on your route. You can request specific hotels or let us recommend the best options available.",
        category: DEFAULT_CATEGORY,
        sortOrder: 6,
        isActive: true,
      },
      {
        question: "Do I need to be physically fit for the tour?",
        answer:
          "Not for most sightseeing trips. Trekking-heavy plans require moderate fitness. We can adapt the pace and activities based on your comfort level.",
        category: DEFAULT_CATEGORY,
        sortOrder: 7,
        isActive: true,
      },
      {
        question: "Can I travel solo or in a group?",
        answer:
          "Both. Solo travelers can join private tours or group departures (when available). Groups can customize transport, hotels, and activity intensity.",
        category: DEFAULT_CATEGORY,
        sortOrder: 8,
        isActive: true,
      },
      {
        question: "How do I book a tour and make payment?",
        answer:
          "You can book via WhatsApp, phone, or the website inquiry form. We confirm availability and share payment details and timelines before confirming your reservation.",
        category: DEFAULT_CATEGORY,
        sortOrder: 9,
        isActive: true,
      },
    ];

    let inserted = 0;
    for (const row of seed) {
      await ctx.db.insert("faqs", {
        ...row,
        createdAt: now + inserted,
        updatedAt: now + inserted,
      });
      inserted++;
    }
    return { inserted, skipped: false as const };
  },
});

export const bulkUpsert = mutation({
  args: {
    sessionToken: v.string(),
    rows: v.array(
      v.object({
        faqId: v.optional(v.id("faqs")),
        question: v.string(),
        answer: v.string(),
        category: v.optional(v.string()),
        sortOrder: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, { sessionToken, rows }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const now = Date.now();
    const existing = await ctx.db
      .query("faqs")
      .withIndex("by_sort_order", (q) => q)
      .order("asc")
      .take(500);
    const keyToId = new Map<string, Id<"faqs">>();
    for (const r of existing) {
      keyToId.set(`${r.category}::${r.question}`.toLowerCase(), r._id);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        const question = row.question.trim();
        const answer = row.answer.trim();
        if (!question) throw new Error("question is required");
        if (!answer) throw new Error("answer is required");
        const category = normalizeCategory(row.category);
        const key = `${category}::${question}`.toLowerCase();

        const targetId = row.faqId ?? keyToId.get(key);
        if (targetId) {
          await ctx.db.patch(targetId, {
            question,
            answer,
            category,
            sortOrder: row.sortOrder ?? undefined,
            isActive: row.isActive ?? undefined,
            updatedAt: now + i,
          });
          updated++;
          continue;
        }

        const sortOrder =
          row.sortOrder ??
          (await (async () => {
            const last = await ctx.db
              .query("faqs")
              .withIndex("by_sort_order", (q) => q)
              .order("desc")
              .take(1);
            return (last[0]?.sortOrder ?? 0) + 1;
          })());

        const id = await ctx.db.insert("faqs", {
          question,
          answer,
          category,
          sortOrder,
          isActive: row.isActive ?? true,
          createdAt: now + i,
          updatedAt: now + i,
        });
        keyToId.set(key, id);
        created++;
      } catch (e) {
        errors.push({ index: i, message: e instanceof Error ? e.message : String(e) });
        skipped++;
      }
    }

    return { processed: rows.length, created, updated, skipped, errors };
  },
});

