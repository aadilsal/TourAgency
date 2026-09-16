import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server.js";
import { resolveUserFromSessionToken, requireAdminFromSession } from "./lib/authHelpers.js";
import type { Doc, Id } from "./_generated/dataModel.js";

const MAX_PUBLIC_POSTS = 200;

function normalizeBlogSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

/** All posts sharing a slug (legacy data may contain duplicates). */
async function postsWithSlug(ctx: QueryCtx | MutationCtx, slug: string) {
  return await ctx.db
    .query("blogPosts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .take(10);
}

/** Throws a clear error when another post already uses `slug`. */
async function assertSlugAvailable(
  ctx: MutationCtx,
  slug: string,
  exceptId?: Id<"blogPosts">,
) {
  if (!slug) throw new Error("Slug can't be empty");
  const clash = (await postsWithSlug(ctx, slug)).find((p) => p._id !== exceptId);
  if (clash) {
    throw new Error(
      `Another post ("${clash.title}") already uses the URL slug "${slug}". Choose a different slug.`,
    );
  }
}

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
      "<h2>Planning Skardu the smart way</h2><p>Skardu itineraries are strongest when you lead with Shigar Fort heritage, then leave room for weather, flights, and jeep transfers to lakes and Deosai.</p><p>Shigar Fort, Upper Kachura, and Deosai should be pre-planned so travelers know what is included.</p>",
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
  {
    title: "Lahore Heritage Weekend Guide",
    slug: "lahore-heritage-weekend-guide",
    content:
      "<h2>A culture-first Lahore weekend</h2><p>Start with Badshahi Mosque and Lahore Fort, then slow-walk the Walled City for food streets and hidden havelis. This is our most requested heritage city circuit.</p><p>October–March is ideal for comfortable walking tours.</p>",
    metaTitle: "Lahore heritage weekend guide | JunketTours",
    metaDescription:
      "Plan a Lahore heritage weekend — forts, mosques, Walled City walks, and food streets.",
    published: true,
  },
  {
    title: "Taxila & Gandhara Itinerary",
    slug: "taxila-gandhara-itinerary",
    content:
      "<h2>Gandhara in a day</h2><p>Taxila Museum plus stupa sites make an excellent day trip from Islamabad. Pair with Swat for a longer Buddhist heritage trail across Khyber Pakhtunkhwa.</p>",
    metaTitle: "Taxila & Gandhara itinerary | JunketTours",
    metaDescription:
      "A practical Taxila day trip and Gandhara heritage itinerary from Islamabad.",
    published: true,
  },
  {
    title: "Hunza Forts & Culture Guide",
    slug: "hunza-forts-culture-guide",
    content:
      "<h2>Northern heritage in Hunza</h2><p>Lead with Baltit and Altit forts, Karimabad bazaars, and apricot culture before chasing viewpoints. Hunza is our signature northern heritage chapter — forts first, peaks second.</p>",
    metaTitle: "Hunza forts & culture guide | JunketTours",
    metaDescription:
      "Heritage-focused Hunza itinerary — forts, bazaars, valley culture, and practical tips.",
    published: true,
  },
];

export const getPosts = query({
  args: {
    includeDrafts: v.optional(v.boolean()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { includeDrafts, sessionToken }) => {
    if (includeDrafts) {
      const user = await resolveUserFromSessionToken(ctx, sessionToken);
      if (user?.role === "admin" || user?.role === "super_admin") {
        return await ctx.db
          .query("blogPosts")
          .withIndex("by_createdAt")
          .order("desc")
          .take(MAX_PUBLIC_POSTS);
      }
    }
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_published_and_createdAt", (q) => q.eq("published", true))
      .order("desc")
      .take(MAX_PUBLIC_POSTS);
  },
});

/** Admin list, newest first, paginated so no post silently falls off the list. */
export const listAdminPage = query({
  args: { sessionToken: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { sessionToken, paginationOpts }) => {
    await requireAdminFromSession(ctx, sessionToken);
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_createdAt")
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const listPublicPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_published_and_createdAt", (q) => q.eq("published", true))
      .order("desc")
      .take(MAX_PUBLIC_POSTS);
  },
});

export const listSlugsPublic = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_published_and_createdAt", (q) => q.eq("published", true))
      .order("desc")
      .take(MAX_PUBLIC_POSTS);
    return posts.map((p) => p.slug);
  },
});

export const listRelatedPublic = query({
  args: { slug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { slug, limit }) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_published_and_createdAt", (q) => q.eq("published", true))
      .order("desc")
      .take(MAX_PUBLIC_POSTS);
    return posts.filter((p) => p.slug !== slug).slice(0, Math.max(1, limit ?? 3));
  },
});

export const getPostBySlug = query({
  args: { slug: v.string(), sessionToken: v.optional(v.string()) },
  handler: async (ctx, { slug, sessionToken }) => {
    // Tolerate legacy duplicate slugs instead of throwing (which broke the page).
    const matches = await postsWithSlug(ctx, slug);
    if (matches.length === 0) return null;
    const published = matches.find((p) => p.published);
    if (published) return published;
    const user = await resolveUserFromSessionToken(ctx, sessionToken);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return null;
    }
    return matches[0]!;
  },
});

export const createPost = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, { sessionToken, ...args }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const now = Date.now();
    if (!args.title.trim()) throw new Error("Title can't be empty");
    const slug = normalizeBlogSlug(args.slug);
    await assertSlugAvailable(ctx, slug);
    const metaTitle = args.metaTitle?.trim();
    const metaDescription = args.metaDescription?.trim();
    const id = await ctx.db.insert("blogPosts", {
      title: args.title,
      content: args.content,
      published: args.published,
      ...(metaTitle ? { metaTitle } : {}),
      ...(metaDescription ? { metaDescription } : {}),
      slug,
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
    sessionToken: v.string(),
    postId: v.id("blogPosts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    // `undefined` = unchanged, `null` (or blank) = clear.
    metaTitle: v.optional(v.union(v.string(), v.null())),
    metaDescription: v.optional(v.union(v.string(), v.null())),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, postId, ...patch }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const existing = await ctx.db.get(postId);
    if (!existing) throw new Error("Post not found");
    const next: Record<string, unknown> = {};
    if (patch.title !== undefined) {
      if (!patch.title.trim()) throw new Error("Title can't be empty");
      next.title = patch.title;
    }
    if (patch.content !== undefined) next.content = patch.content;
    if (patch.published !== undefined) next.published = patch.published;
    for (const key of ["metaTitle", "metaDescription"] as const) {
      const val = patch[key];
      if (val === undefined) continue;
      const trimmed = val === null ? "" : val.trim();
      next[key] = trimmed ? trimmed : undefined; // undefined removes the field
    }
    if (patch.slug !== undefined) {
      const slug = normalizeBlogSlug(patch.slug);
      if (slug !== existing.slug) await assertSlugAvailable(ctx, slug, postId);
      next.slug = slug;
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
  args: { sessionToken: v.string(), postId: v.id("blogPosts") },
  handler: async (ctx, { sessionToken, postId }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
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
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
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

export const bulkUpsert = mutation({
  args: {
    sessionToken: v.string(),
    rows: v.array(
      v.object({
        title: v.string(),
        slug: v.string(),
        content: v.string(),
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
        published: v.boolean(),
        createdAt: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { sessionToken, rows }) => {
    const admin = await requireAdminFromSession(ctx, sessionToken);
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        const slug = normalizeBlogSlug(row.slug);
        if (!slug) throw new Error("slug is required");
        const matches = await postsWithSlug(ctx, slug);
        if (matches.length > 1) {
          throw new Error(
            `${matches.length} posts share the slug "${slug}" - fix the duplicates in the editor first`,
          );
        }
        const existing = matches[0];
        const metaTitle = row.metaTitle?.trim();
        const metaDescription = row.metaDescription?.trim();
        // Blank meta cells are omitted: they never clear existing SEO text.
        const payload = {
          title: row.title.trim(),
          slug,
          content: row.content,
          ...(metaTitle ? { metaTitle } : {}),
          ...(metaDescription ? { metaDescription } : {}),
          published: row.published,
        };
        if (!payload.title) throw new Error("title is required");
        if (!payload.content) throw new Error("content is required");

        if (existing) {
          await ctx.db.patch(existing._id, payload);
          updated++;
        } else {
          await ctx.db.insert("blogPosts", {
            ...payload,
            createdAt: row.createdAt ?? now + i,
          });
          created++;
        }
      } catch (e) {
        errors.push({ index: i, message: e instanceof Error ? e.message : String(e) });
        skipped++;
      }
    }

    await ctx.db.insert("adminLogs", {
      action: "bulk_upsert_blog_posts",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `processed=${rows.length} created=${created} updated=${updated} skipped=${skipped}`,
    });

    return { processed: rows.length, created, updated, skipped, errors };
  },
});
