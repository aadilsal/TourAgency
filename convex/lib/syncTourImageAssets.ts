import type { Id } from "../_generated/dataModel.js";
import type { MutationCtx } from "../_generated/server.js";

/**
 * Convex file storage is flat; we group tour uploads under a logical folder key
 * `tours/{slug}` and mirror storage ids here for queries and housekeeping.
 */
export async function syncTourImageAssetIndex(
  ctx: MutationCtx,
  tourId: Id<"tours">,
  folderKey: string,
  images: readonly string[],
): Promise<void> {
  const existing = await ctx.db
    .query("tourImageAssets")
    .withIndex("by_tour", (q) => q.eq("tourId", tourId))
    .collect();
  for (const row of existing) {
    await ctx.db.delete(row._id);
  }
  const now = Date.now();
  const seen = new Set<string>();
  for (const ref of images) {
    const trimmed = ref.trim();
    if (!trimmed || /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
      continue;
    }
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    let url: string | null;
    try {
      url = await ctx.storage.getUrl(trimmed as Id<"_storage">);
    } catch {
      continue;
    }
    if (!url) continue;
    await ctx.db.insert("tourImageAssets", {
      tourId,
      folderKey,
      storageId: trimmed as Id<"_storage">,
      createdAt: now,
    });
  }
}

export async function deleteTourImageAssetsForTour(
  ctx: MutationCtx,
  tourId: Id<"tours">,
): Promise<void> {
  const existing = await ctx.db
    .query("tourImageAssets")
    .withIndex("by_tour", (q) => q.eq("tourId", tourId))
    .collect();
  for (const row of existing) {
    await ctx.db.delete(row._id);
  }
}
