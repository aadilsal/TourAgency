import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { resolveUserFromSessionToken, requireAdmin } from "./lib/authHelpers.js";
import type { Doc } from "./_generated/dataModel.js";
import { resolveTourImageUrls } from "./lib/resolveTourImages.js";
import {
  deleteTourImageAssetsForTour,
  syncTourImageAssetIndex,
} from "./lib/syncTourImageAssets.js";

export const getTours = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { includeInactive, sessionToken }) => {
    const all = await ctx.db.query("tours").collect();
    const user = await resolveUserFromSessionToken(ctx, sessionToken);
    const isAdmin =
      user?.role === "admin" || user?.role === "super_admin";

    let list = all;
    if (!includeInactive || !isAdmin) {
      list = all.filter((t) => t.isActive);
    }

    if (includeInactive && isAdmin) {
      return list;
    }

    return Promise.all(
      list.map(async (t) => ({
        ...t,
        images: await resolveTourImageUrls(ctx, t.images),
      })),
    );
  },
});

export const listToursForAi = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tours = await ctx.db.query("tours").collect();
    return tours
      .filter((t) => t.isActive)
      .map((t) => ({
        title: t.title,
        slug: t.slug,
        types: t.types ?? [],
        location: t.location,
        durationDays: t.durationDays,
        pricePkr: (t as { pricePkr?: number }).pricePkr ?? t.price,
        priceUsd: (t as { priceUsd?: number }).priceUsd ?? null,
        description: t.description,
      }));
  },
});

export const getTourBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const tour = await ctx.db
      .query("tours")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!tour) return null;
    return {
      ...tour,
      images: await resolveTourImageUrls(ctx, tour.images),
    };
  },
});

export const createTour = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    types: v.optional(v.array(v.string())),
    destinationIds: v.optional(v.array(v.id("destinations"))),
    destinationId: v.optional(v.id("destinations")),
    pricePkr: v.number(),
    priceUsd: v.number(),
    durationDays: v.number(),
    location: v.string(),
    maxPeople: v.optional(v.number()),
    minAge: v.optional(v.number()),
    tourTypeLabel: v.optional(v.string()),
    ratingAvg: v.optional(v.number()),
    reviewsCount: v.optional(v.number()),
    office: v.optional(v.string()),
    email: v.optional(v.string()),
    images: v.array(v.string()),
    itinerary: v.array(
      v.object({
        day: v.number(),
        title: v.string(),
        description: v.string(),
      }),
    ),
    highlights: v.optional(v.array(v.string())),
    included: v.optional(v.array(v.string())),
    excluded: v.optional(v.array(v.string())),
    timeSlots: v.optional(v.array(v.string())),
    ticketGroups: v.optional(
      v.array(
        v.object({
          label: v.string(),
          ageRange: v.optional(v.string()),
        }),
      ),
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const normalizedSlug = args.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const imageFolderKey = `tours/${normalizedSlug}`;
    const id = await ctx.db.insert("tours", {
      ...args,
      types: args.types ?? [],
      slug: normalizedSlug,
      imageFolderKey,
      createdAt: now,
      // Keep legacy `price` populated for older code paths and migrations.
      price: args.pricePkr,
      destinationIds:
        args.destinationIds ?? (args.destinationId ? [args.destinationId] : undefined),
    });
    await syncTourImageAssetIndex(ctx, id, imageFolderKey, args.images);
    await ctx.db.insert("adminLogs", {
      action: "create_tour",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `Tour ${id}`,
    });
    await ctx.runMutation(internal.destinations.syncFromTour, { tourId: id });
    return id;
  },
});

export const updateTour = mutation({
  args: {
    tourId: v.id("tours"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    types: v.optional(v.array(v.string())),
    destinationIds: v.optional(v.array(v.id("destinations"))),
    destinationId: v.optional(v.id("destinations")),
    pricePkr: v.optional(v.number()),
    priceUsd: v.optional(v.number()),
    durationDays: v.optional(v.number()),
    location: v.optional(v.string()),
    maxPeople: v.optional(v.number()),
    minAge: v.optional(v.number()),
    tourTypeLabel: v.optional(v.string()),
    ratingAvg: v.optional(v.number()),
    reviewsCount: v.optional(v.number()),
    office: v.optional(v.string()),
    email: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    itinerary: v.optional(
      v.array(
        v.object({
          day: v.number(),
          title: v.string(),
          description: v.string(),
        }),
      ),
    ),
    highlights: v.optional(v.array(v.string())),
    included: v.optional(v.array(v.string())),
    excluded: v.optional(v.array(v.string())),
    timeSlots: v.optional(v.array(v.string())),
    ticketGroups: v.optional(
      v.array(
        v.object({
          label: v.string(),
          ageRange: v.optional(v.string()),
        }),
      ),
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { tourId, ...patch }) => {
    const admin = await requireAdmin(ctx);
    const tour = await ctx.db.get(tourId);
    if (!tour) throw new Error("Tour not found");
    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) next[k] = val;
    }
    // Keep legacy `price` in sync with PKR for older code paths.
    if (next.pricePkr !== undefined) {
      next.price = next.pricePkr;
    }
    if (next.slug) {
      next.slug = String(next.slug)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
    }
    const finalSlug =
      typeof next.slug === "string" ? next.slug : tour.slug;
    const finalImages = Array.isArray(next.images) ? next.images : tour.images;
    const imageFolderKey = `tours/${finalSlug}`;
    (next as Record<string, unknown>).imageFolderKey = imageFolderKey;
    await ctx.db.patch(
      tourId,
      next as Partial<Omit<Doc<"tours">, "_id" | "_creationTime">>,
    );
    await syncTourImageAssetIndex(
      ctx,
      tourId,
      imageFolderKey,
      finalImages,
    );
    await ctx.db.insert("adminLogs", {
      action: "update_tour",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: String(tourId),
    });
    await ctx.runMutation(internal.destinations.syncFromTour, { tourId });
  },
});

export const deleteTour = mutation({
  args: { tourId: v.id("tours") },
  handler: async (ctx, { tourId }) => {
    const admin = await requireAdmin(ctx);
    await deleteTourImageAssetsForTour(ctx, tourId);
    await ctx.db.delete(tourId);
    await ctx.db.insert("adminLogs", {
      action: "delete_tour",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: String(tourId),
    });
  },
});

export const bulkUpsert = mutation({
  args: {
    rows: v.array(
      v.object({
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        types: v.optional(v.array(v.string())),
        destinationIds: v.optional(v.array(v.id("destinations"))),
        destinationId: v.optional(v.id("destinations")),
        price: v.number(),
        durationDays: v.number(),
        location: v.string(),
        maxPeople: v.optional(v.number()),
        minAge: v.optional(v.number()),
        tourTypeLabel: v.optional(v.string()),
        ratingAvg: v.optional(v.number()),
        reviewsCount: v.optional(v.number()),
        office: v.optional(v.string()),
        email: v.optional(v.string()),
        images: v.array(v.string()),
        itinerary: v.array(
          v.object({
            day: v.number(),
            title: v.string(),
            description: v.string(),
          }),
        ),
        highlights: v.optional(v.array(v.string())),
        included: v.optional(v.array(v.string())),
        excluded: v.optional(v.array(v.string())),
        timeSlots: v.optional(v.array(v.string())),
        ticketGroups: v.optional(
          v.array(
            v.object({
              label: v.string(),
              ageRange: v.optional(v.string()),
            }),
          ),
        ),
        isActive: v.boolean(),
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
        const normalizedSlug = row.slug.trim().toLowerCase().replace(/\s+/g, "-");
        if (!normalizedSlug) throw new Error("slug is required");
        const imageFolderKey = `tours/${normalizedSlug}`;

        const existing = await ctx.db
          .query("tours")
          .withIndex("by_slug", (q) => q.eq("slug", normalizedSlug))
          .unique();

        const payload = {
          ...row,
          title: row.title.trim(),
          slug: normalizedSlug,
          description: row.description.trim(),
          types: row.types ?? [],
          imageFolderKey,
          destinationIds:
            row.destinationIds ??
            (row.destinationId ? [row.destinationId] : undefined),
        };
        if (!payload.title) throw new Error("title is required");
        if (!payload.description) throw new Error("description is required");
        if (!payload.location.trim()) throw new Error("location is required");

        if (existing) {
          await ctx.db.patch(existing._id, payload);
          await syncTourImageAssetIndex(
            ctx,
            existing._id,
            imageFolderKey,
            payload.images,
          );
          await ctx.runMutation(internal.destinations.syncFromTour, {
            tourId: existing._id,
          });
          updated++;
        } else {
          const id = await ctx.db.insert("tours", {
            ...payload,
            createdAt: now + i,
          });
          await syncTourImageAssetIndex(ctx, id, imageFolderKey, payload.images);
          await ctx.runMutation(internal.destinations.syncFromTour, { tourId: id });
          created++;
        }
      } catch (e) {
        errors.push({ index: i, message: e instanceof Error ? e.message : String(e) });
        skipped++;
      }
    }

    await ctx.db.insert("adminLogs", {
      action: "bulk_upsert_tours",
      performedBy: admin._id,
      timestamp: Date.now(),
      details: `processed=${rows.length} created=${created} updated=${updated} skipped=${skipped}`,
    });

    return { processed: rows.length, created, updated, skipped, errors };
  },
});
