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
        price: t.price,
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
    price: v.number(),
    durationDays: v.number(),
    location: v.string(),
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
    price: v.optional(v.number()),
    durationDays: v.optional(v.number()),
    location: v.optional(v.string()),
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
