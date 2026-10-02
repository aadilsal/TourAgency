import { internalMutation } from "./_generated/server.js";
import { v } from "convex/values";
import { isCleanTourSlug, normalizeTourSlug } from "./lib/tourSlug.js";

function roundUsdFromPkr(pkr: number, ratePkrPerUsd: number): number {
  const safeRate = Number.isFinite(ratePkrPerUsd) && ratePkrPerUsd > 0 ? ratePkrPerUsd : 280;
  return Math.max(1, Math.round(pkr / safeRate));
}

/**
 * One-off maintenance: fill in `pricePkr` / `priceUsd` on legacy tours that
 * have NEVER had them. Safety rules (this endpoint previously re-filled prices
 * an admin had deliberately cleared, and wrote USD 1 for tours priced PKR 0):
 *
 * - Internal only: run it from the Convex dashboard or `npx convex run`, never from a browser.
 * - Dry run unless `dryRun: false` is passed explicitly.
 * - Fill-only: never overwrites or realigns an existing value.
 * - Skips tours without a positive PKR price (free / "price on request").
 * - Skips tours edited after they were created (`updatedAt` set): a missing
 *   price there is treated as an explicit admin clear.
 *
 */
export const backfillTourUsdPrices = internalMutation({
  args: {
    /** Conversion rate used only when `priceUsd` is missing. Default 280 PKR/USD. */
    ratePkrPerUsd: v.optional(v.number()),
    /** Defaults to true — pass `false` to actually write. */
    dryRun: v.optional(v.boolean()),
    /** Safety: max tours to patch per run. */
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const limit = Math.max(1, Math.min(args.limit ?? 200, 2000));
    const rate = args.ratePkrPerUsd ?? 280;

    const tours = await ctx.db.query("tours").take(2000);

    let considered = 0;
    let patched = 0;
    let wouldPatch = 0;
    let skipped = 0;

    for (const t of tours) {
      if (considered >= limit) break;
      considered++;

      const doc = t as typeof t & { updatedAt?: number };
      if (typeof doc.updatedAt === "number") {
        skipped++;
        continue;
      }

      const legacyPkr = Number.isFinite(t.price) ? (t.price as number) : undefined;
      const hasPkr = Number.isFinite(t.pricePkr);
      const hasUsd = Number.isFinite(t.priceUsd);
      const pricePkr = hasPkr ? (t.pricePkr as number) : legacyPkr;

      if (pricePkr === undefined || pricePkr <= 0) {
        skipped++;
        continue;
      }

      const patch: { pricePkr?: number; priceUsd?: number } = {};
      if (!hasPkr) patch.pricePkr = pricePkr;
      if (!hasUsd) patch.priceUsd = roundUsdFromPkr(pricePkr, rate);

      if (Object.keys(patch).length === 0) continue;

      wouldPatch++;
      if (!dryRun) {
        await ctx.db.patch(t._id, patch);
        patched++;
      }
    }

    return {
      dryRun,
      ratePkrPerUsd: rate,
      scanned: tours.length,
      considered,
      skipped,
      wouldPatch,
      patched,
    };
  },
});

/**
 * One-off maintenance: rewrite tour slugs that aren't URL-safe (e.g. a raw `&`,
 * which made a live tour 404) into the clean form `normalizeTourSlug` produces.
 *
 * - Internal only, dry run unless `dryRun: false` is passed.
 * - Patches ONLY `slug`. Images, prices and `updatedAt` are left alone, so an
 *   admin's open editor isn't knocked into a save conflict.
 * - The old slug is kept in `tourSlugAliases`, so existing links redirect.
 * - Skips a tour when its clean slug is already used by another tour.
 */
export const normalizeTourSlugs = internalMutation({
  args: {
    /** Defaults to true — pass `false` to actually write. */
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const tours = await ctx.db.query("tours").take(2000);
    const changes: Array<{ tourId: string; from: string; to: string; status: string }> = [];

    for (const t of tours) {
      if (isCleanTourSlug(t.slug)) continue;
      const to = normalizeTourSlug(t.slug);
      if (!to) {
        changes.push({ tourId: t._id, from: t.slug, to, status: "skipped: empty after cleaning" });
        continue;
      }
      const taken = await ctx.db
        .query("tours")
        .withIndex("by_slug", (q) => q.eq("slug", to))
        .first();
      if (taken && taken._id !== t._id) {
        changes.push({ tourId: t._id, from: t.slug, to, status: "skipped: slug used by another tour" });
        continue;
      }
      if (!dryRun) {
        const stale = await ctx.db
          .query("tourSlugAliases")
          .withIndex("by_slug", (q) => q.eq("slug", to))
          .take(10);
        for (const a of stale) await ctx.db.delete(a._id);
        const oldAlias = await ctx.db
          .query("tourSlugAliases")
          .withIndex("by_slug", (q) => q.eq("slug", t.slug))
          .first();
        if (!oldAlias) {
          await ctx.db.insert("tourSlugAliases", { slug: t.slug, tourId: t._id, createdAt: Date.now() });
        }
        await ctx.db.patch(t._id, { slug: to });
      }
      changes.push({ tourId: t._id, from: t.slug, to, status: dryRun ? "would rename" : "renamed" });
    }

    return { dryRun, scanned: tours.length, changes };
  },
});
