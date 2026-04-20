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
    const tours = await client.query(api.tours.getTours, {});
    for (const t of tours) {
      entries.push({
        url: `${base}/tours/${t.slug}`,
        lastModified: new Date(),
      });
    }
    const posts = await client.query(api.blog.getPosts, {});
    for (const p of posts) {
      entries.push({
        url: `${base}/blog/${p.slug}`,
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
