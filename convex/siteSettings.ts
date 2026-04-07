import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { requireAdmin } from "./lib/authHelpers.js";

const GLOBAL_SETTINGS_KEY = "global";

function envDefaults() {
  return {
    officeAddress: process.env.NEXT_PUBLIC_OFFICE_ADDRESS?.trim() || "",
    whatsappPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "+92 300 0000000",
    contactEmail:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
      "hello@junkettours.example",
    mapsEmbedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL?.trim() || "",
  };
}

export const getPublicSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_SETTINGS_KEY))
      .unique();
    return {
      ...envDefaults(),
      ...doc,
    };
  },
});

export const getAdminSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const doc = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_SETTINGS_KEY))
      .unique();
    return {
      ...envDefaults(),
      ...doc,
    };
  },
});

export const upsertAdminSiteSettings = mutation({
  args: {
    officeAddress: v.optional(v.string()),
    whatsappPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    mapsEmbedUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_SETTINGS_KEY))
      .unique();

    const patch = {
      officeAddress: args.officeAddress?.trim() || undefined,
      whatsappPhone: args.whatsappPhone?.trim() || undefined,
      contactEmail: args.contactEmail?.trim() || undefined,
      mapsEmbedUrl: args.mapsEmbedUrl?.trim() || undefined,
      updatedAt: now,
      updatedBy: admin._id,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("siteSettings", {
      key: GLOBAL_SETTINGS_KEY,
      ...patch,
    });
  },
});
