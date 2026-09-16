import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import nextDynamic from "next/dynamic";
import { ListingPageSkeleton } from "@/components/skeletons/PageSkeletons";
import { getConvexServer } from "@/lib/convex-server";

const ToursExploreClient = nextDynamic(
  () =>
    import("@/components/tours/ToursExploreClient").then((m) => ({
      default: m.ToursExploreClient,
    })),
  {
    // Skeleton matches the explore layout (hero + filters + tour cards) so the
    // client bundle swapping in doesn't shift the page.
    loading: () => <ListingPageSkeleton variant="tour" label="Loading tours…" />,
    ssr: false,
  },
);

export const dynamic = "force-dynamic";

// Filtered/search URLs (/tours?q=…&type=…) canonicalise to /tours.
export const metadata: Metadata = buildMetadata({
  title: "Pakistan Tour Packages & Heritage Tours",
  description:
    "Browse guided Pakistan tours — Lahore & Mughal heritage, Taxila and Gandhara sites, Hunza, Skardu and Swat. Private trips with English-speaking guides and USD prices.",
  path: "/tours",
});

type Search = {
  type?: string;
  max?: string;
  min?: string;
  location?: string;
  province?: string;
  from?: string;
  guests?: string;
  q?: string;
};

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  let tours: Array<{
    _id: string;
    slug: string;
    title: string;
    description: string;
    types?: string[];
    price: number;
    pricePkr?: number;
    priceUsd?: number;
    perHeadPrices?: Array<{ persons: number; pricePkr?: number; priceUsd?: number }>;
    durationDays: number;
    location: string;
    images: string[];
    isActive: boolean;
  }> = [];

  try {
    const client = getConvexServer();
    tours = (await client.query(api.tours.listActiveToursForExplore, {})) as typeof tours;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[tours/page] Convex getTours failed:", e);
    }
    tours = [];
  }

  return (
    <main className="min-h-screen">
      <ToursExploreClient
        initialTours={tours}
        initialType={searchParams.type}
        initialLocation={searchParams.location}
        initialProvince={searchParams.province}
        initialQuery={searchParams.q}
      />
    </main>
  );
}
