import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { requireUserFromSession } from "./lib/authHelpers.js";
import type { Id } from "./_generated/dataModel.js";
import { resolveTourImageUrlsAligned } from "./lib/resolveTourImages.js";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

function assertItineraryFolderKey(folderKey: string) {
  const k = folderKey.trim();
  if (!k.startsWith("itineraries/") || k.length < 13) {
    throw new Error('Invalid folder key (use "itineraries/<itineraryId>").');
  }
  return k;
}

/** Convex upload URL — POST the file body, then use returned `storageId`. */
export const generateTourImageUploadUrl = mutation({
  args: {
    sessionToken: v.string(),
    /** Logical folder (e.g. `tours/my-slug`); validated for admin uploads. */
    folderKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, folderKey }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    if (folderKey !== undefined && folderKey.trim() !== "") {
      const k = folderKey.trim();
      if (!k.startsWith("tours/") || k.length < 7) {
        throw new Error('Invalid folder key (use "tours/your-tour-slug").');
      }
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/** Convex upload URL for itinerary images — POST the file body, then use returned `storageId`. */
export const generateItineraryImageUploadUrl = mutation({
  args: {
    sessionToken: v.string(),
    /** Logical folder (e.g. `itineraries/<id>`); validated for admin uploads. */
    folderKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, folderKey }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    if (folderKey !== undefined && folderKey.trim() !== "") {
      assertItineraryFolderKey(folderKey);
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/** Convex upload URL for invoice assets (optional) — POST the file body, then use returned `storageId`. */
export const generateInvoiceAssetUploadUrl = mutation({
  args: {
    sessionToken: v.string(),
    /** Logical folder (e.g. `invoices/<id>`); validated for admin uploads. */
    folderKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, folderKey }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    if (folderKey !== undefined && folderKey.trim() !== "") {
      const k = folderKey.trim();
      if (!k.startsWith("invoices/") || k.length < 9) {
        throw new Error('Invalid folder key (use "invoices/<invoiceId>").');
      }
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const setSiteAsset = mutation({
  args: {
    sessionToken: v.string(),
    key: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { sessionToken, key, storageId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const k = key.trim().toLowerCase();
    const existing = await ctx.db
      .query("siteAssets")
      .withIndex("by_key", (q) => q.eq("key", k))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { storageId, updatedAt: now });
    } else {
      await ctx.db.insert("siteAssets", { key: k, storageId, updatedAt: now });
    }
  },
});

export const getSiteAssetUrl = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("siteAssets")
      .withIndex("by_key", (q) => q.eq("key", key.trim().toLowerCase()))
      .unique();
    if (!row) return null;
    return await ctx.storage.getUrl(row.storageId);
  },
});

/** Track an uploaded itinerary image so it can be reused via the wizard picker. */
export const addItineraryImageAsset = mutation({
  args: {
    sessionToken: v.string(),
    itineraryId: v.id("itineraries"),
    folderKey: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { sessionToken, itineraryId, folderKey, storageId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const k = assertItineraryFolderKey(folderKey);

    const existing = await ctx.db
      .query("itineraryImageAssets")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("itineraryImageAssets", {
      itineraryId,
      folderKey: k,
      storageId,
      createdAt: Date.now(),
    });
  },
});

export const listItineraryImageAssetsForAdmin = query({
  args: { sessionToken: v.string(), itineraryId: v.id("itineraries") },
  handler: async (ctx, { sessionToken, itineraryId }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const rows = await ctx.db
      .query("itineraryImageAssets")
      .withIndex("by_itinerary", (q) => q.eq("itineraryId", itineraryId))
      .order("desc")
      .take(80);
    const out: Array<{ storageId: Id<"_storage">; url: string | null; createdAt: number }> =
      [];
    for (const r of rows) {
      out.push({
        storageId: r.storageId,
        url: await ctx.storage.getUrl(r.storageId),
        createdAt: r.createdAt,
      });
    }
    return out;
  },
});

/** Resolve tour image refs to display URLs, same order as `ids` (null = no preview). */
export const resolveStorageIdsForAdmin = query({
  args: { sessionToken: v.string(), ids: v.array(v.string()) },
  handler: async (ctx, { sessionToken, ids }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    return await resolveTourImageUrlsAligned(ctx, ids);
  },
});
