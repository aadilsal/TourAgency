import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import type { QueryCtx, MutationCtx } from "./_generated/server.js";
import type { Doc, Id } from "./_generated/dataModel.js";
import { requireAdminFromSession } from "./lib/authHelpers.js";
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
  args: { sessionToken: v.string(), provinceSlug: v.optional(v.string()) },
  handler: async (ctx, { sessionToken, provinceSlug }) => {
    await requireAdminFromSession(ctx, sessionToken);
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

/**
 * Adds default sites whose (province, slug) is missing. INSERT-ONLY: existing
 * sites are never modified (no re-publishing hidden sites, no wiped fields).
 * `updated` stays in the return shape for older clients and is always 0;
 * `skipped` = seed rows whose province doesn't exist; `alreadyPresent` = untouched rows.
 */
export const syncDefaultCatalog = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const now = Date.now();
    let created = 0;
    let skipped = 0;
    let alreadyPresent = 0;
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
        .first();
      if (existing) {
        alreadyPresent++;
        continue;
      }
      const optional = row as {
        city?: string;
        era?: string;
        unesco?: boolean;
        heroExternalUrl?: string;
        destinationSlug?: string;
      };
      await ctx.db.insert("sites", {
        provinceId: province._id,
        slug: row.slug,
        name: row.name,
        type: row.type,
        summary: row.summary,
        history: row.history,
        ...(optional.city !== undefined ? { city: optional.city } : {}),
        ...(optional.era !== undefined ? { era: optional.era } : {}),
        ...(optional.unesco !== undefined ? { unesco: optional.unesco } : {}),
        ...(optional.heroExternalUrl !== undefined
          ? { heroExternalUrl: optional.heroExternalUrl }
          : {}),
        ...(optional.destinationSlug !== undefined
          ? { destinationSlug: optional.destinationSlug }
          : {}),
        featured: row.featured,
        sortOrder: row.sortOrder,
        isActive: true,
        createdAt: now + i,
        updatedAt: now + i,
      });
      created++;
    }
    return { created, updated: 0, skipped, alreadyPresent, total: SITES_SEED_ROWS.length };
  },
});

export const createSite = mutation({
  args: {
    sessionToken: v.string(),
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
  handler: async (ctx, { sessionToken, ...args }) => {
    await requireAdminFromSession(ctx, sessionToken);
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
    sessionToken: v.string(),
    siteId: v.id("sites"),
    /** Move the site to another province (slug must be free there). */
    provinceId: v.optional(v.id("provinces")),
    name: v.optional(v.string()),
    type: v.optional(siteType),
    summary: v.optional(v.string()),
    history: v.optional(v.string()),
    // Optional fields: `undefined` = unchanged, `null` = clear.
    city: v.optional(v.union(v.string(), v.null())),
    era: v.optional(v.union(v.string(), v.null())),
    unesco: v.optional(v.union(v.boolean(), v.null())),
    heroExternalUrl: v.optional(v.union(v.string(), v.null())),
    destinationSlug: v.optional(v.union(v.string(), v.null())),
    featured: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, siteId, ...patch }) => {
    await requireAdminFromSession(ctx, sessionToken);
    const existing = await ctx.db.get(siteId);
    if (!existing) throw new Error("Site not found");
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new Error("Site name can't be empty");
    }
    if (patch.provinceId !== undefined && patch.provinceId !== existing.provinceId) {
      const target = await ctx.db.get(patch.provinceId);
      if (!target) throw new Error("Target province not found");
      const conflict = await ctx.db
        .query("sites")
        .withIndex("by_province_and_slug", (q) =>
          q.eq("provinceId", patch.provinceId!).eq("slug", existing.slug),
        )
        .first();
      if (conflict) {
        throw new Error(`"${target.name}" already has a site with the slug "${existing.slug}"`);
      }
    }
    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val === undefined) continue;
      // null clears an optional field (patching `undefined` removes it).
      next[k] = val === null ? undefined : val;
    }
    next.updatedAt = Date.now();
    await ctx.db.patch(siteId, next as Partial<Doc<"sites">>);
  },
});

export const deleteSite = mutation({
  args: { sessionToken: v.string(), siteId: v.id("sites") },
  handler: async (ctx, { sessionToken, siteId }) => {
    await requireAdminFromSession(ctx, sessionToken);
    await ctx.db.delete(siteId);
  },
});

export const bulkUpsert = mutation({
  args: {
    sessionToken: v.string(),
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
        // Optional so a blank cell leaves the existing value untouched on update.
        featured: v.optional(v.boolean()),
        sortOrder: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
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
        const province = await getProvinceBySlug(ctx, row.provinceSlug);
        if (!province) throw new Error(`Province not found: ${row.provinceSlug}`);
        const slug = row.slug.trim().toLowerCase();
        const existing = await ctx.db
          .query("sites")
          .withIndex("by_province_and_slug", (q) =>
            q.eq("provinceId", province._id).eq("slug", slug),
          )
          .first();
        const name = row.name.trim();
        if (!slug) throw new Error("slug is required");
        if (!name) throw new Error("name is required");
        // Only keys with a real value are written: a blank cell never wipes data
        // and a missing isActive never re-publishes a hidden site.
        const present: Partial<Doc<"sites">> = {};
        const summary = row.summary.trim();
        const history = row.history.trim();
        if (summary) present.summary = summary;
        if (history) present.history = history;
        const city = row.city?.trim();
        if (city) present.city = city;
        const era = row.era?.trim();
        if (era) present.era = era;
        if (row.unesco !== undefined) present.unesco = row.unesco;
        const heroExternalUrl = row.heroExternalUrl?.trim();
        if (heroExternalUrl) present.heroExternalUrl = heroExternalUrl;
        const destinationSlug = row.destinationSlug?.trim();
        if (destinationSlug) present.destinationSlug = destinationSlug;
        if (row.featured !== undefined) present.featured = row.featured;
        if (row.sortOrder !== undefined) present.sortOrder = row.sortOrder;
        if (row.isActive !== undefined) present.isActive = row.isActive;

        if (existing) {
          await ctx.db.patch(existing._id, {
            ...present,
            name,
            type: row.type,
            updatedAt: now + i,
          });
          updated++;
        } else {
          await ctx.db.insert("sites", {
            ...present,
            provinceId: province._id,
            slug,
            name,
            type: row.type,
            summary: present.summary ?? "",
            history: present.history ?? "",
            featured: present.featured ?? false,
            sortOrder: present.sortOrder ?? 0,
            isActive: present.isActive ?? true,
            createdAt: now + i,
            updatedAt: now + i,
          });
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
