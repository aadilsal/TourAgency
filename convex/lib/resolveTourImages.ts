import type { Id } from "../_generated/dataModel.js";

type StorageReader = {
  storage: {
    getUrl: (id: Id<"_storage">) => Promise<string | null>;
  };
};

/**
 * Same as {@link resolveTourImageUrls} but keeps one entry per ref (null = no URL).
 * Use for admin UI previews so thumbnails line up with the ref list.
 */
export async function resolveTourImageUrlsAligned(
  ctx: StorageReader,
  refs: readonly string[],
): Promise<(string | null)[]> {
  const out: (string | null)[] = [];
  for (const ref of refs) {
    const trimmed = ref.trim();
    if (!trimmed) {
      out.push(null);
      continue;
    }
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
      out.push(trimmed);
      continue;
    }
    try {
      const url = await ctx.storage.getUrl(trimmed as Id<"_storage">);
      out.push(url ?? null);
    } catch {
      out.push(null);
    }
  }
  return out;
}

/**
 * Turn stored image refs into browser-usable URLs.
 * Supports `http(s)://`, site-relative `/…`, and Convex `_storage` ids.
 */
export async function resolveTourImageUrls(
  ctx: StorageReader,
  refs: readonly string[],
): Promise<string[]> {
  const aligned = await resolveTourImageUrlsAligned(ctx, refs);
  return aligned.filter((u): u is string => Boolean(u));
}
