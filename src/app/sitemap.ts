import type { MetadataRoute } from "next";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { getSiteUrl } from "@/lib/site";
import { landingPages, landingPath } from "@/config/programmatic-seo";
import { DESTINATION_SLUGS } from "@/lib/destinations-data";
import { loadProvinceSlugs } from "@/lib/provinces-server";

export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];
type Freq = NonNullable<Entry["changeFrequency"]>;

/**
 * Only public, indexable routes. Private routes (/admin, /dashboard, /login,
 * /register, /thank-you, /api) are deliberately excluded — see robots.ts.
 *
 * `lastModified` is only set where the data has a real timestamp (blog posts'
 * createdAt). The Convex slug queries for tours/destinations/provinces return
 * slugs only, so dates are omitted rather than faked with `new Date()` (which
 * teaches Google to ignore the field).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  function add(path: string, changeFrequency: Freq, priority: number, lastModified?: Date) {
    const url = path === "/" ? base : `${base}${path}`;
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({ url, changeFrequency, priority, ...(lastModified ? { lastModified } : {}) });
  }

  // Core pages
  add("/", "daily", 1);
  add("/tours", "daily", 0.9);
  add("/destinations", "weekly", 0.8);
  add("/guides", "weekly", 0.8);
  add("/ai-planner", "monthly", 0.7);
  add("/visa-invitation", "monthly", 0.8);
  add("/about", "monthly", 0.6);
  add("/contact", "yearly", 0.6);
  add("/blog", "weekly", 0.7);

  // Evergreen guides for international travellers
  add("/pakistan-tourist-visa-guide", "monthly", 0.8);
  add("/is-pakistan-safe-for-tourists", "monthly", 0.8);
  add("/best-travel-agency-in-pakistan", "monthly", 0.6);
  add("/best-tour-operators-in-pakistan", "monthly", 0.6);
  add("/hunza-tour-operator", "monthly", 0.6);

  for (const p of landingPages) add(landingPath(p.slug), "monthly", 0.6);

  // Legal
  add("/privacy-policy", "yearly", 0.2);
  add("/terms-of-service", "yearly", 0.2);
  add("/cancellation-policy", "yearly", 0.3);

  // Province guides (Convex with static fallback — never throws)
  for (const slug of await loadProvinceSlugs()) add(`/guides/${slug}`, "monthly", 0.7);

  let client: ReturnType<typeof getConvexServer> | null = null;
  try {
    client = getConvexServer();
  } catch {
    client = null; /* Convex may be unset during CI */
  }

  // Each source is fetched independently so one failure doesn't drop the rest.
  if (client) {
    try {
      const tourSlugs = await client.query(api.tours.listSlugsActive, {});
      for (const slug of tourSlugs) add(`/tours/${slug}`, "weekly", 0.9);
    } catch {
      /* ignore */
    }
    try {
      const posts = (await client.query(api.blog.listPublicPosts, {})) as Array<{
        slug: string;
        createdAt?: number;
      }>;
      for (const p of posts) {
        add(
          `/blog/${p.slug}`,
          "monthly",
          0.6,
          typeof p.createdAt === "number" ? new Date(p.createdAt) : undefined,
        );
      }
    } catch {
      /* ignore */
    }
  }

  let destSlugs: string[] = [...DESTINATION_SLUGS];
  if (client) {
    try {
      const fromDb = await client.query(api.destinations.listSlugs, {});
      destSlugs = Array.from(new Set([...fromDb, ...destSlugs]));
    } catch {
      /* static fallback */
    }
  }
  for (const slug of destSlugs) add(`/destinations/${slug}`, "monthly", 0.7);

  return entries;
}
