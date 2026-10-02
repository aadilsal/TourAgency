import { cache } from "react";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

/**
 * Next 14 hands route params over still percent-encoded, so a slug with `&`
 * arrives as `%26` and never matches the stored slug.
 */
export function decodeSlugParam(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export const loadTourBySlug = cache(async (slug: string) => {
  const client = getConvexServer();
  return await client.query(api.tours.getTourBySlug, { slug: decodeSlugParam(slug) });
});

