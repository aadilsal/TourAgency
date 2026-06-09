import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import {
  PROVINCES,
  getProvince,
  tourMatchesProvince,
  type ProvinceSlug,
} from "@/lib/provinces-data";
import {
  getSitesForProvince,
  countSitesForProvince,
  type SiteSeed,
  type SiteType,
} from "@/lib/sites-data";

export type ProvinceIndexRow = {
  slug: string;
  name: string;
  tagline: string;
  heroUrl: string;
  tourCount: number;
  siteCount: number;
  sortOrder: number;
};

export type ProvinceSiteRow = {
  slug: string;
  name: string;
  type: SiteType;
  summary: string;
  history: string;
  city?: string;
  era?: string;
  unesco?: boolean;
  heroExternalUrl?: string;
  destinationSlug?: string;
  featured: boolean;
  sortOrder: number;
};

export type ProvinceGuidePageData = {
  slug: string;
  name: string;
  tagline: string;
  intro: string;
  heroUrl: string;
  bestTime: string;
  tips: string[];
  costEstimate: string;
  sites: ProvinceSiteRow[];
  relatedTours: Array<{
    slug: string;
    title: string;
    description: string;
    price: number;
    durationDays: number;
    location: string;
    images: string[];
  }>;
  cityDestinations: Array<{
    slug: string;
    name: string;
    line: string;
  }>;
};

function staticSiteRow(s: SiteSeed): ProvinceSiteRow {
  return {
    slug: s.slug,
    name: s.name,
    type: s.type,
    summary: s.summary,
    history: s.history,
    city: s.city,
    era: s.era,
    unesco: s.unesco,
    heroExternalUrl: s.heroExternalUrl,
    destinationSlug: s.destinationSlug,
    featured: s.featured,
    sortOrder: s.sortOrder,
  };
}

export async function loadProvinceIndexRows(): Promise<ProvinceIndexRow[]> {
  try {
    const client = getConvexServer();
    const rows = (await client.query(api.provinces.listForIndex, {})) as
      | ProvinceIndexRow[]
      | null;
    if (rows && rows.length > 0) return rows;
  } catch {
    /* Convex unavailable */
  }

  let tours: Array<{ location: string; isActive?: boolean }> = [];
  try {
    const client = getConvexServer();
    tours = (await client.query(api.tours.listActiveToursForExplore, {})) as typeof tours;
  } catch {
    tours = [];
  }

  return PROVINCES.map((p) => ({
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    heroUrl: p.heroImage,
    tourCount: tours.filter((t) => tourMatchesProvince(t.location, p)).length,
    siteCount: countSitesForProvince(p.slug),
    sortOrder: p.sortOrder,
  }));
}

export async function loadProvinceGuidePageData(
  slug: string,
): Promise<ProvinceGuidePageData | null> {
  try {
    const client = getConvexServer();
    const p = await client.query(api.provinces.getPublicBySlug, { slug });
    if (p) {
      const [sites, relatedTours, destinations] = await Promise.all([
        client.query(api.sites.listByProvinceSlug, { provinceSlug: slug }),
        client.query(api.provinces.listRelatedTours, { slug }),
        client.query(api.destinations.listForIndex, {}),
      ]);
      const cityDestinations = (
        destinations as Array<{ slug: string; name: string; line: string }>
      ).filter((d) => {
        const staticMatch = getDestinationProvinceSlug(d.slug);
        return staticMatch === slug;
      });
      return {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        intro: p.intro,
        heroUrl: p.heroUrl,
        bestTime: p.bestTime,
        tips: p.tips,
        costEstimate: p.costEstimate,
        sites: sites as ProvinceSiteRow[],
        relatedTours: relatedTours as ProvinceGuidePageData["relatedTours"],
        cityDestinations,
      };
    }
  } catch {
    /* fall through */
  }

  const staticP = getProvince(slug);
  if (!staticP) return null;

  let relatedTours: ProvinceGuidePageData["relatedTours"] = [];
  try {
    const client = getConvexServer();
    const tours = (await client.query(api.tours.listActiveToursForExplore, {})) as Array<{
      slug: string;
      title: string;
      description: string;
      price: number;
      durationDays: number;
      location: string;
      images: string[];
    }>;
    relatedTours = tours
      .filter((t) => tourMatchesProvince(t.location, staticP))
      .slice(0, 12)
      .map((t) => ({
        slug: t.slug,
        title: t.title,
        description: t.description,
        price: t.price,
        durationDays: t.durationDays,
        location: t.location,
        images: t.images,
      }));
  } catch {
    relatedTours = [];
  }

  const { DESTINATIONS_INDEX } = await import("@/lib/destinations-data");
  const cityDestinations = DESTINATIONS_INDEX.filter(
    (d) => getDestinationProvinceSlug(d.slug) === slug,
  ).map((d) => ({ slug: d.slug, name: d.name, line: d.line }));

  return {
    slug: staticP.slug,
    name: staticP.name,
    tagline: staticP.tagline,
    intro: staticP.intro,
    heroUrl: staticP.heroImage,
    bestTime: staticP.bestTime,
    tips: staticP.tips,
    costEstimate: staticP.costEstimate,
    sites: getSitesForProvince(staticP.slug as ProvinceSlug).map(staticSiteRow),
    relatedTours,
    cityDestinations,
  };
}

/** Map city destination slugs to parent province. */
export function getDestinationProvinceSlug(destinationSlug: string): string | null {
  const map: Record<string, string> = {
    lahore: "punjab",
    multan: "punjab",
    taxila: "islamabad",
    chitral: "kpk",
    hunza: "gilgit-baltistan",
    skardu: "gilgit-baltistan",
    swat: "kpk",
    naran: "kpk",
  };
  return map[destinationSlug] ?? null;
}

export async function loadProvinceSlugs(): Promise<string[]> {
  try {
    const client = getConvexServer();
    const slugs = await client.query(api.provinces.listSlugs, {});
    if (slugs && slugs.length > 0) return slugs;
  } catch {
    /* fall through */
  }
  return PROVINCES.map((p) => p.slug);
}
