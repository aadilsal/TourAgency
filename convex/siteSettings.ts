import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { requireUserFromSession } from "./lib/authHelpers.js";

const GLOBAL_SETTINGS_KEY = "global";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

function envDefaults() {
  return {
    officeAddress: process.env.NEXT_PUBLIC_OFFICE_ADDRESS?.trim() || "",
    whatsappPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "+92 300 0000000",
    contactEmail:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
      "hello@junkettours.example",
    website:
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "",
    governmentLicenseNo:
      process.env.NEXT_PUBLIC_GOVERNMENT_LICENSE_NO?.trim() ||
      process.env.NEXT_PUBLIC_GOV_LICENSE_NO?.trim() ||
      "",
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
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
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
    sessionToken: v.string(),
    officeAddress: v.optional(v.string()),
    whatsappPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),
    governmentLicenseNo: v.optional(v.string()),
    mapsEmbedUrl: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, ...args }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const now = Date.now();
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_SETTINGS_KEY))
      .unique();

    const patch = {
      officeAddress: args.officeAddress?.trim() || undefined,
      whatsappPhone: args.whatsappPhone?.trim() || undefined,
      contactEmail: args.contactEmail?.trim() || undefined,
      website: args.website?.trim() || undefined,
      governmentLicenseNo:
        user.role === "super_admin"
          ? (args.governmentLicenseNo?.trim() || undefined)
          : undefined,
      mapsEmbedUrl: args.mapsEmbedUrl?.trim() || undefined,
      updatedAt: now,
      updatedBy: user._id,
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
