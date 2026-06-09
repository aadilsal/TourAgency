import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { PageLoadingSpinner } from "@/components/ui/PageLoadingSpinner";
import { getConvexServer } from "@/lib/convex-server";

const ToursExploreClient = nextDynamic(
  () =>
    import("@/components/tours/ToursExploreClient").then((m) => ({
      default: m.ToursExploreClient,
    })),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <PageLoadingSpinner label="Loading tours…" variant="dark" />
      </div>
    ),
    ssr: false,
  },
);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore tours",
  description:
    "Culture & history tours across Pakistan — heritage cities, ancient sites, and northern valley packages. Hunza, Skardu, Swat & more.",
};

type Search = {
  type?: string;
  max?: string;
  min?: string;
  location?: string;
  province?: string;
  from?: string;
  guests?: string;
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
      />
    </main>
  );
}
