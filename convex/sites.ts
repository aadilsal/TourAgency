import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import type { QueryCtx, MutationCtx } from "./_generated/server.js";
import type { Doc, Id } from "./_generated/dataModel.js";
import { requireAdmin } from "./lib/authHelpers.js";
import { SITES_SEED_ROWS } from "./lib/sitesSeed.js";

const siteType = v.union(
  v.literal("historical"),
  v.literal("cultural"),
  v.literal("natural"),
  v.literal("adventure"),
);

async function getProvinceBySlug(ctx: QueryCtx | MutationCtx, slug: string) {
  return await ctx.db
    .query("provinces")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export const listByProvinceSlug = query({
  args: { provinceSlug: v.string() },
  handler: async (ctx, { provinceSlug }) => {
    const province = await ctx.db
      .query("provinces")
      .withIndex("by_slug", (q) => q.eq("slug", provinceSlug))
      .unique();
    if (!province) return [];
    const sites = await ctx.db
      .query("sites")
      .withIndex("by_province", (q) => q.eq("provinceId", province._id))
      .collect();
    return sites
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((s) => ({
        slug: s.slug,
        name: s.name,
        type: s.type,
        summary: s.summary,
        history: s.history,
        city: s.city,
        era: s.era,
        unesco: s.unesco,
        heroExternalUrl: s.heroExternalUrl,
        destinationSlug: s.destinationSlug,
        featured: s.featured,
        sortOrder: s.sortOrder,
      }));
  },
});

export const listFeaturedSitesForProvince = query({
  args: { provinceSlug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { provinceSlug, limit }) => {
    const cap = limit ?? 6;
    const province = await ctx.db
      .query("provinces")
      .withIndex("by_slug", (q) => q.eq("slug", provinceSlug))
      .unique();
    if (!province) return [];
    const sites = await ctx.db
      .query("sites")
      .withIndex("by_province", (q) => q.eq("provinceId", province._id))
      .collect();
    return sites
      .filter((s) => s.isActive && s.featured)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, cap)
      .map((s) => ({
        name: s.name,
        type: s.type,
        summary: s.summary,
      }));
  },
});

export const getBySlug = query({
  args: { provinceSlug: v.string(), siteSlug: v.string() },
  handler: async (ctx, { provinceSlug, siteSlug }) => {
    const province = await ctx.db
      .query("provinces")
      .withIndex("by_slug", (q) => q.eq("slug", provinceSlug))
      .unique();
    if (!province) return null;
    const site = await ctx.db
      .query("sites")
      .withIndex("by_province_and_slug", (q) =>
        q.eq("provinceId", province._id).eq("slug", siteSlug),
      )
      .unique();
    if (!site || !site.isActive) return null;
    return {
      slug: site.slug,
      name: site.name,
      type: site.type,
      summary: site.summary,
      history: site.history,
      city: site.city,
      era: site.era,
      unesco: site.unesco,
      heroExternalUrl: site.heroExternalUrl,
      destinationSlug: site.destinationSlug,
      provinceSlug: province.slug,
      provinceName: province.name,
    };
  },
});

export const listForAdmin = query({
  args: { provinceSlug: v.optional(v.string()) },
  handler: async (ctx, { provinceSlug }) => {
    await requireAdmin(ctx);
    let provinceId: Id<"provinces"> | undefined;
    if (provinceSlug) {
      const p = await getProvinceBySlug(ctx, provinceSlug);
      if (!p) return [];
      provinceId = p._id;
    }
    const sites = provinceId
      ? await ctx.db
          .query("sites")
          .withIndex("by_province", (q) => q.eq("provinceId", provinceId!))
          .collect()
      : await ctx.db.query("sites").collect();
    const provinces = await ctx.db.query("provinces").collect();
    const provinceMap = new Map(provinces.map((p) => [p._id, p]));
    return sites
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((s) => ({
        ...s,
        provinceSlug: provinceMap.get(s.provinceId)?.slug ?? "",
        provinceName: provinceMap.get(s.provinceId)?.name ?? "",
      }));
  },
});

export const syncDefaultCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;
    for (let i = 0; i < SITES_SEED_ROWS.length; i++) {
      const row = SITES_SEED_ROWS[i]!;
      const province = await getProvinceBySlug(ctx, row.provinceSlug);
      if (!province) {
        skipped++;
        continue;
      }
      const existing = await ctx.db
        .query("sites")
        .withIndex("by_province_and_slug", (q) =>
          q.eq("provinceId", province._id).eq("slug", row.slug),
        )
        .unique();
      const payload = {
        provinceId: province._id,
        slug: row.slug,
        name: row.name,
        type: row.type,
        summary: row.summary,
        history: row.history,
        city: "city" in row ? (row.city as string | undefined) : undefined,
        era: "era" in row ? (row.era as string | undefined) : undefined,
        unesco: "unesco" in row ? (row.unesco as boolean | undefined) : undefined,
        heroExternalUrl:
          "heroExternalUrl" in row
            ? (row.heroExternalUrl as string | undefined)
            : undefined,
        destinationSlug:
          "destinationSlug" in row
            ? (row.destinationSlug as string | undefined)
            : undefined,
        featured: row.featured,
        sortOrder: row.sortOrder,
        isActive: true,
        updatedAt: now + i,
      };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
        updated++;
      } else {
        await ctx.db.insert("sites", { ...payload, createdAt: now + i });
        created++;
      }
    }
    return { created, updated, skipped, total: SITES_SEED_ROWS.length };
  },
});

export const createSite = mutation({
  args: {
    provinceId: v.id("provinces"),
    slug: v.string(),
    name: v.string(),
    type: siteType,
    summary: v.string(),
    history: v.string(),
    city: v.optional(v.string()),
    era: v.optional(v.string()),
    unesco: v.optional(v.boolean()),
    heroExternalUrl: v.optional(v.string()),
    destinationSlug: v.optional(v.string()),
    featured: v.boolean(),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const slug = args.slug.trim().toLowerCase();
    const conflict = await ctx.db
      .query("sites")
      .withIndex("by_province_and_slug", (q) =>
        q.eq("provinceId", args.provinceId).eq("slug", slug),
      )
      .unique();
    if (conflict) throw new Error("Site slug already exists in this province");
    return await ctx.db.insert("sites", {
      ...args,
      slug,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSite = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.optional(v.string()),
    type: v.optional(siteType),
    summary: v.optional(v.string()),
    history: v.optional(v.string()),
    city: v.optional(v.string()),
    era: v.optional(v.string()),
    unesco: v.optional(v.boolean()),
    heroExternalUrl: v.optional(v.string()),
    destinationSlug: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { siteId, ...patch }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(siteId);
    if (!existing) throw new Error("Site not found");
    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) next[k] = val;
    }
    next.updatedAt = Date.now();
    await ctx.db.patch(siteId, next as Partial<Doc<"sites">>);
  },
});

export const deleteSite = mutation({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(siteId);
  },
});

export const bulkUpsert = mutation({
  args: {
    rows: v.array(
      v.object({
        provinceSlug: v.string(),
        slug: v.string(),
        name: v.string(),
        type: siteType,
        summary: v.string(),
        history: v.string(),
        city: v.optional(v.string()),
        era: v.optional(v.string()),
        unesco: v.optional(v.boolean()),
        heroExternalUrl: v.optional(v.string()),
        destinationSlug: v.optional(v.string()),
        featured: v.boolean(),
        sortOrder: v.number(),
        isActive: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        const province = await getProvinceBySlug(ctx, row.provinceSlug);
        if (!province) throw new Error(`Province not found: ${row.provinceSlug}`);
        const slug = row.slug.trim().toLowerCase();
        const existing = await ctx.db
          .query("sites")
          .withIndex("by_province_and_slug", (q) =>
            q.eq("provinceId", province._id).eq("slug", slug),
          )
          .unique();
        const payload = {
          provinceId: province._id,
          slug,
          name: row.name.trim(),
          type: row.type,
          summary: row.summary.trim(),
          history: row.history.trim(),
          city: row.city?.trim() || undefined,
          era: row.era?.trim() || undefined,
          unesco: row.unesco,
          heroExternalUrl: row.heroExternalUrl?.trim() || undefined,
          destinationSlug: row.destinationSlug?.trim() || undefined,
          featured: row.featured,
          sortOrder: row.sortOrder,
          isActive: row.isActive ?? true,
          updatedAt: now + i,
        };
        if (existing) {
          await ctx.db.patch(existing._id, payload);
          updated++;
        } else {
          await ctx.db.insert("sites", { ...payload, createdAt: now + i });
          created++;
        }
      } catch (e) {
        errors.push({ index: i, message: e instanceof Error ? e.message : String(e) });
        skipped++;
      }
    }

    await ctx.db.insert("adminLogs", {
      action: "bulk_upsert_sites",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `processed=${rows.length} created=${created} updated=${updated} skipped=${skipped}`,
    });

    return { processed: rows.length, created, updated, skipped, errors };
  },
});
