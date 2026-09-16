import { internalMutation } from "./_generated/server.js";
import { v } from "convex/values";

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
