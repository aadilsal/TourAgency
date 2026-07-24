import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import type { Id } from "./_generated/dataModel.js";
import { requireUserFromSession } from "./lib/authHelpers.js";

function assertAdminFromSession(
  user: { role: string },
): asserts user is { role: "admin" | "super_admin" } {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
}

const KEY = "default";

function trimLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("aboutPageSettings")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
    if (!row) return null;

    const partners = [];
    for (const p of row.partners) {
      partners.push({
        name: p.name,
        logoUrl: p.logoStorageId
          ? await ctx.storage.getUrl(p.logoStorageId)
          : p.logoExternalUrl ?? null,
      });
    }

    const resolveImage = async (
      storageId: Id<"_storage"> | undefined,
      legacy: string,
    ): Promise<string> => {
      if (storageId) {
        const url = await ctx.storage.getUrl(storageId);
        if (url) return url;
      }
      return legacy || "";
    };

    return {
      eyebrow: row.eyebrow,
      heading: row.heading,
      tabs: {
        explore: {
          title: row.exploreTitle,
          body: row.exploreBody,
          image: await resolveImage(row.exploreImageStorageId, row.exploreImage),
        },
        mission: {
          title: row.missionTitle,
          body: row.missionBody,
          image: await resolveImage(row.missionImageStorageId, row.missionImage),
        },
        vision: {
          title: row.visionTitle,
          body: row.visionBody,
          image: await resolveImage(row.visionImageStorageId, row.visionImage),
        },
      },
      stats: row.stats,
      partners,
      updatedAt: row.updatedAt,
    };
  },
});

export const getAdmin = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    return await ctx.db
      .query("aboutPageSettings")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
  },
});

export const generatePartnerLogoUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    return await ctx.storage.generateUploadUrl();
  },
});

export const upsertAdmin = mutation({
  args: {
    sessionToken: v.string(),
    eyebrow: v.string(),
    heading: v.string(),

    exploreTitle: v.string(),
    exploreBodyText: v.string(),
    // `undefined` = leave image unchanged; `null` = clear it; an id = a newly uploaded image.
    exploreImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),

    missionTitle: v.string(),
    missionBodyText: v.string(),
    missionImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),

    visionTitle: v.string(),
    visionBodyText: v.string(),
    visionImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),

    stats: v.array(
      v.object({
        value: v.string(),
        label: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUserFromSession(ctx, args.sessionToken);
    assertAdminFromSession(user);

    const existing = await ctx.db
      .query("aboutPageSettings")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();

    /** When an image arg is provided: set/clear the storage id and drop any legacy URL. */
    const imagePatch = (
      arg: Id<"_storage"> | null | undefined,
      idKey: string,
      legacyKey: string,
    ): Record<string, unknown> => {
      if (arg === undefined) return {};
      if (arg === null) return { [idKey]: undefined, [legacyKey]: "" };
      return { [idKey]: arg, [legacyKey]: "" };
    };

    const textPayload = {
      key: KEY,
      eyebrow: args.eyebrow.trim(),
      heading: args.heading.trim(),

      exploreTitle: args.exploreTitle.trim(),
      exploreBody: trimLines(args.exploreBodyText),

      missionTitle: args.missionTitle.trim(),
      missionBody: trimLines(args.missionBodyText),

      visionTitle: args.visionTitle.trim(),
      visionBody: trimLines(args.visionBodyText),

      stats: args.stats.map((s) => ({ value: s.value.trim(), label: s.label.trim() })),
      updatedAt: Date.now(),
    };

    const imagePayload = {
      ...imagePatch(args.exploreImageStorageId, "exploreImageStorageId", "exploreImage"),
      ...imagePatch(args.missionImageStorageId, "missionImageStorageId", "missionImage"),
      ...imagePatch(args.visionImageStorageId, "visionImageStorageId", "visionImage"),
    };

    if (existing) {
      await ctx.db.patch(existing._id, { ...textPayload, ...imagePayload });
    } else {
      await ctx.db.insert("aboutPageSettings", {
        ...textPayload,
        exploreImage: "",
        missionImage: "",
        visionImage: "",
        ...imagePayload,
        partners: [],
      });
    }
  },
});

export const addPartner = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    logoExternalUrl: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, name, logoStorageId, logoExternalUrl }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const row = await ctx.db
      .query("aboutPageSettings")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
    if (!row) {
      throw new Error("About page settings not initialized yet. Save content first.");
    }

    const next = [
      ...row.partners,
      {
        name: name.trim() || "Partner",
        logoStorageId,
        logoExternalUrl: logoExternalUrl?.trim() || undefined,
      },
    ].slice(0, 20);

    await ctx.db.patch(row._id, { partners: next, updatedAt: Date.now() });
  },
});

export const removePartner = mutation({
  args: { sessionToken: v.string(), index: v.number() },
  handler: async (ctx, { sessionToken, index }) => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);

    const row = await ctx.db
      .query("aboutPageSettings")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
    if (!row) return;
    const i = Math.floor(index);
    if (i < 0 || i >= row.partners.length) return;
    const next = row.partners.filter((_, idx) => idx !== i);
    await ctx.db.patch(row._id, { partners: next, updatedAt: Date.now() });
  },
});

export const resolvePartnerLogoUrlForAdmin = query({
  args: { sessionToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { sessionToken, storageId }): Promise<string | null> => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    return await ctx.storage.getUrl(storageId);
  },
});

export const resolvePartnerLogoUrlsForAdmin = query({
  args: { sessionToken: v.string(), storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, { sessionToken, storageIds }): Promise<(string | null)[]> => {
    const user = await requireUserFromSession(ctx, sessionToken);
    assertAdminFromSession(user);
    const out: (string | null)[] = [];
    for (const id of storageIds) out.push(await ctx.storage.getUrl(id));
    return out;
  },
});

