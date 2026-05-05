import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { PageLoadingSpinner } from "@/components/ui/PageLoadingSpinner";

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
  description: "Filter and book northern Pakistan tours — Hunza, Skardu, Swat, and more.",
};

type Search = { type?: string; max?: string; min?: string; location?: string; from?: string; guests?: string };

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
    tours = (await client.query(api.tours.getTours, {})) as typeof tours;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[tours/page] Convex getTours failed:", e);
    }
    tours = [];
  }

  const active = tours.filter((t) => t.isActive);

  return (
    <main className="min-h-screen">
      <ToursExploreClient
        initialTours={active}
        initialType={searchParams.type}
        initialMax={searchParams.max}
        initialMin={searchParams.min}
        initialLocation={searchParams.location}
      />
    </main>
  );
}
