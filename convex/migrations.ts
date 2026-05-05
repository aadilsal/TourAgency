import { mutation } from "./_generated/server.js";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authHelpers.js";

function roundUsdFromPkr(pkr: number, ratePkrPerUsd: number): number {
  const safeRate = Number.isFinite(ratePkrPerUsd) && ratePkrPerUsd > 0 ? ratePkrPerUsd : 280;
  return Math.max(1, Math.round(pkr / safeRate));
}

export const backfillTourUsdPrices = mutation({
  args: {
    /** Conversion rate used only when `priceUsd` is missing. Default 280 PKR/USD. */
    ratePkrPerUsd: v.optional(v.number()),
    /** If true, only reports what would change. */
    dryRun: v.optional(v.boolean()),
    /** Safety: max tours to patch per run. */
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const dryRun = args.dryRun ?? false;
    const limit = Math.max(1, Math.min(args.limit ?? 200, 2000));
    const rate = args.ratePkrPerUsd ?? 280;

    // Tours table is typically small; if it grows large, move this to a batched component migration.
    const tours = await ctx.db.query("tours").collect();

    let considered = 0;
    let patched = 0;
    let wouldPatch = 0;

    for (const t of tours) {
      if (considered >= limit) break;
      considered++;

      const pricePkr = Number.isFinite((t as any).pricePkr) ? (t as any).pricePkr : t.price;
      const hasUsd = Number.isFinite((t as any).priceUsd);
      const hasPkr = Number.isFinite((t as any).pricePkr);

      const nextUsd = hasUsd ? (t as any).priceUsd : roundUsdFromPkr(pricePkr, rate);

      const patch: Record<string, unknown> = {};
      if (!hasPkr) patch.pricePkr = pricePkr;
      if (!hasUsd) patch.priceUsd = nextUsd;
      // Keep legacy field aligned to PKR.
      if (t.price !== pricePkr) patch.price = pricePkr;

      if (Object.keys(patch).length === 0) continue;

      wouldPatch++;
      if (!dryRun) {
        await ctx.db.patch(t._id, patch as any);
        patched++;
      }
    }

    return {
      dryRun,
      ratePkrPerUsd: rate,
      scanned: tours.length,
      considered,
      wouldPatch,
      patched,
    };
  },
});

