import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import {
  DESTINATIONS_INDEX,
  DESTINATION_DETAILS,
  tourMatchesDestination,
  getDestinationDetail,
} from "@/lib/destinations-data";

export type DestinationIndexRow = {
  slug: string;
  name: string;
  line: string;
  heroUrl: string;
  tourCount: number;
  previewTours: Array<{
    slug: string;
    title: string;
    price: number;
    images: string[];
  }>;
  moreCount: number;
};

/** Convex-backed destinations when seeded; otherwise static catalog + live tours. */
export async function loadDestinationIndexRows(): Promise<DestinationIndexRow[]> {
  try {
    const client = getConvexServer();
    const rows = (await client.query(api.destinations.listForIndex, {})) as
      | DestinationIndexRow[]
      | null;
    if (rows && rows.length > 0) return rows;
  } catch {
    /* Convex unavailable */
  }

  let tours: Array<{
    slug: string;
    title: string;
    location: string;
    price: number;
    images: string[];
    isActive: boolean;
  }> = [];
  try {
    const client = getConvexServer();
    tours = (await client.query(api.tours.getTours, {})) as typeof tours;
  } catch {
    tours = [];
  }
  const active = tours.filter((t) => t.isActive);

  return DESTINATIONS_INDEX.map((dest) => {
    const matched = active.filter((t) =>
      tourMatchesDestination(t.location, dest),
    );
    const detail = DESTINATION_DETAILS[dest.slug];
    const preview = matched.slice(0, 3).map((t) => ({
      slug: t.slug,
      title: t.title,
      price: t.price,
      pricePkr: (t as unknown as { pricePkr?: number }).pricePkr,
      priceUsd: (t as unknown as { priceUsd?: number }).priceUsd,
      images: t.images,
    }));
    return {
      slug: dest.slug,
      name: dest.name,
      line: dest.line,
      heroUrl: detail.heroImage,
      tourCount: matched.length,
      previewTours: preview,
      moreCount: Math.max(0, matched.length - 3),
    };
  });
}

export type DestinationDetailPageData = {
  slug: string;
  name: string;
  line: string;
  description: string;
  heroUrl: string;
  bestTime: string;
  tips: string[];
  costEstimate: string;
  bullets: string[];
  related: Array<{
    slug: string;
    title: string;
    description: string;
    price: number;
    durationDays: number;
    location: string;
    images: string[];
  }>;
};

export async function loadDestinationDetailPageData(
  slug: string,
): Promise<DestinationDetailPageData | null> {
  try {
    const client = getConvexServer();
    const d = await client.query(api.destinations.getPublicBySlug, { slug });
    if (d) {
      const related = (await client.query(api.destinations.listRelatedTours, {
        slug,
      })) as DestinationDetailPageData["related"];
      return {
        slug: d.slug,
        name: d.name,
        line: d.line,
        description: d.description,
        heroUrl: d.heroUrl,
        bestTime: d.bestTime,
        tips: d.tips,
        costEstimate: d.costEstimate,
        bullets: d.bullets,
        related,
      };
    }
  } catch {
    /* fall through */
  }

  const staticD = getDestinationDetail(slug);
  if (!staticD) return null;

  let related: DestinationDetailPageData["related"] = [];
  try {
    const client = getConvexServer();
    const tours = (await client.query(api.tours.getTours, {})) as Array<{
      slug: string;
      title: string;
      description: string;
      price: number;
      pricePkr?: number;
      priceUsd?: number;
      durationDays: number;
      location: string;
      images: string[];
      isActive: boolean;
    }>;
    related = tours
      .filter(
        (t) => t.isActive && tourMatchesDestination(t.location, staticD),
      )
      .slice(0, 12)
      .map((t) => ({
        slug: t.slug,
        title: t.title,
        description: t.description,
        price: t.price,
        pricePkr: t.pricePkr,
        priceUsd: t.priceUsd,
        durationDays: t.durationDays,
        location: t.location,
        images: t.images,
      }));
  } catch {
    related = [];
  }

  return {
    slug: staticD.slug,
    name: staticD.name,
    line: staticD.line,
    description: staticD.description,
    heroUrl: staticD.heroImage,
    bestTime: staticD.bestTime,
    tips: staticD.tips,
    costEstimate: staticD.costEstimate,
    bullets: staticD.bullets,
    related,
  };
}
