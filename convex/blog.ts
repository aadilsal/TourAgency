import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { resolveUserFromSessionToken, requireAdmin } from "./lib/authHelpers.js";
import type { Doc } from "./_generated/dataModel.js";

const SAMPLE_POSTS = [
  {
    title: "Hunza Trip Cost Guide",
    slug: "hunza-trip-cost-guide",
    content:
      "<h2>Hunza trip costs at a glance</h2><p>Hunza is one of our easiest destinations to sell because it balances road scenery, heritage, and a broad budget range. A short trip can stay affordable, while private transport and higher-end stays push the package higher.</p><p>For families, family-friendly and adventure tours tagged for Hunza usually perform best.</p>",
    metaTitle: "Hunza trip cost guide | JunketTours",
    metaDescription:
      "A practical Hunza cost breakdown with budget, mid-range, and premium trip planning notes.",
    published: true,
  },
  {
    title: "Skardu and Shigar Travel Tips",
    slug: "skardu-shigar-travel-tips",
    content:
      "<h2>Planning Skardu the smart way</h2><p>Skardu itineraries are strongest when you leave room for weather, flights, and jeep transfers. This guide is a good fit for adventure tours and multi-day northern Pakistan trips.</p><p>Shigar Fort, Upper Kachura, and Deosai should be pre-planned so travelers know what is included.</p>",
    metaTitle: "Skardu and Shigar travel tips | JunketTours",
    metaDescription:
      "Build a better Skardu itinerary with weather, road, and transfer tips.",
    published: true,
  },
  {
    title: "Best Time to Visit Swat and Naran",
    slug: "best-time-swat-naran",
    content:
      "<h2>Timing matters in the north</h2><p>Swat works across a wider portion of the year, while Naran is best for summer trips and Babusar-linked routes. These are ideal destinations for family and budget travelers looking for shorter road trips.</p><p>If you want to compare by season, start with these two regions before booking.</p>",
    metaTitle: "Best time to visit Swat and Naran | JunketTours",
    metaDescription:
      "Compare the best travel seasons for Swat and Naran before booking.",
    published: true,
  },
];

export const getPosts = query({
  args: {
    includeDrafts: v.optional(v.boolean()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { includeDrafts, sessionToken }) => {
    const posts = await ctx.db.query("blogPosts").collect();
    const sorted = posts.sort((a, b) => b.createdAt - a.createdAt);
    if (includeDrafts) {
      const user = await resolveUserFromSessionToken(ctx, sessionToken);
      if (user?.role === "admin" || user?.role === "super_admin") {
        return sorted;
      }
    }
    return sorted.filter((p) => p.published);
  },
});

export const listPublicPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("blogPosts").collect();
    return posts
      .filter((p) => p.published)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getPostBySlug = query({
  args: { slug: v.string(), sessionToken: v.optional(v.string()) },
  handler: async (ctx, { slug, sessionToken }) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!post) return null;
    if (!post.published) {
      const user = await resolveUserFromSessionToken(ctx, sessionToken);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        return null;
      }
    }
    return post;
  },
});

export const createPost = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("blogPosts", {
      ...args,
      slug: args.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      createdAt: now,
    });
    await ctx.db.insert("adminLogs", {
      action: "create_blog_post",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: String(id),
    });
    return id;
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("blogPosts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, { postId, ...patch }) => {
    const admin = await requireAdmin(ctx);
    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) next[k] = val;
    }
    if (next.slug) {
      next.slug = String(next.slug)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
    }
    await ctx.db.patch(
      postId,
      next as Partial<Omit<Doc<"blogPosts">, "_id" | "_creationTime">>,
    );
    await ctx.db.insert("adminLogs", {
      action: "update_blog_post",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: String(postId),
    });
  },
});

export const deletePost = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, { postId }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.delete(postId);
    await ctx.db.insert("adminLogs", {
      action: "delete_blog_post",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: String(postId),
    });
  },
});

export const seedSamplePosts = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("blogPosts").take(1);
    if (existing.length > 0) return { inserted: 0, skipped: true as const };
    const now = Date.now();
    let inserted = 0;
    for (const post of SAMPLE_POSTS) {
      await ctx.db.insert("blogPosts", {
        title: post.title,
        slug: post.slug,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        published: post.published,
        createdAt: now - inserted * 1000,
      });
      inserted++;
    }
    return { inserted, skipped: false as const };
  },
});
