import type { MetadataRoute } from "next";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { getSiteUrl } from "@/lib/site";
import { landingPages } from "@/config/programmatic-seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date() },
    { url: `${base}/tours`, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
  ];
  for (const p of landingPages) {
    entries.push({ url: `${base}/${p.slug}`, lastModified: new Date() });
  }
  entries.push({ url: `${base}/best-travel-agency-in-pakistan`, lastModified: new Date() });
  entries.push({ url: `${base}/best-tour-operators-in-pakistan`, lastModified: new Date() });
  entries.push({ url: `${base}/hunza-tour-operator`, lastModified: new Date() });
  try {
    const client = getConvexServer();
    const tourSlugs = await client.query(api.tours.listSlugsActive, {});
    for (const slug of tourSlugs) {
      entries.push({
        url: `${base}/tours/${slug}`,
        lastModified: new Date(),
      });
    }
    const postSlugs = await client.query(api.blog.listSlugsPublic, {});
    for (const slug of postSlugs) {
      entries.push({
        url: `${base}/blog/${slug}`,
        lastModified: new Date(),
      });
    }
    const destSlugs = await client.query(api.destinations.listSlugs, {});
    for (const slug of destSlugs) {
      entries.push({
        url: `${base}/destinations/${slug}`,
        lastModified: new Date(),
      });
    }
  } catch {
    /* Convex may be unset during CI */
  }
  return entries;
}
