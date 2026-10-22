import type { QueryCtx } from "../_generated/server.js";
import type { Doc, Id } from "../_generated/dataModel.js";
import { resolveTourImageUrls } from "./resolveTourImages.js";

async function heroUrl(
  ctx: QueryCtx,
  doc: { heroStorageId?: Id<"_storage">; heroExternalUrl?: string } | null,
): Promise<string | null> {
  if (!doc) return null;
  if (doc.heroStorageId) {
    const url = await ctx.storage.getUrl(doc.heroStorageId);
    if (url) return url;
  }
  return doc.heroExternalUrl?.trim() || null;
}

/**
 * Photos to SHOW for a tour on the public site. A tour with no photos of its
 * own borrows its first destination's banner, else its province's, so pages
 * and cards never show an empty "Photos coming soon" box.
 *
 * Display only: never use this in admin queries — the editor would save the
 * borrowed photo into the tour.
 */
export async function publicTourImages(
  ctx: QueryCtx,
  tour: Pick<Doc<"tours">, "images" | "destinationIds" | "destinationId" | "provinceIds">,
): Promise<string[]> {
  const own = await resolveTourImageUrls(ctx, tour.images);
  if (own.length > 0) return own;

  const destinationIds = [
    ...(tour.destinationIds ?? []),
    ...(tour.destinationId ? [tour.destinationId] : []),
  ];
  for (const id of destinationIds.slice(0, 5)) {
    const url = await heroUrl(ctx, await ctx.db.get(id));
    if (url) return [url];
  }
  for (const id of (tour.provinceIds ?? []).slice(0, 5)) {
    const url = await heroUrl(ctx, await ctx.db.get(id));
    if (url) return [url];
  }
  return [];
}
