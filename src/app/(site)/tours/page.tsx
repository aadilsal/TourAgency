import Link from "next/link";
import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getConvexServer } from "@/lib/convex-server";
import { getServerCurrency } from "@/lib/currency-server";
import { getSiteUrl } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { JsonLdScript } from "@/components/JsonLdScript";
import { PageContainer } from "@/components/ui/PageContainer";
import { ToursExploreClient } from "@/components/tours/ToursExploreClient";

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

  const base = getSiteUrl();

  return (
    <main className="min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Tours", path: "/tours" },
        ]}
      />
      {tours.length > 0 ? (
        <JsonLdScript
          data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${base}/tours#page`,
            url: `${base}/tours`,
            name: "Pakistan Tour Packages & Heritage Tours",
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: tours.length,
              itemListElement: tours.slice(0, 50).map((t, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${base}/tours/${t.slug}`,
                name: t.title,
              })),
            },
          }}
        />
      ) : null}

      {/* Server-rendered (no ssr:false): the tour cards and this link list are in
          the initial HTML for search engines and AI crawlers. */}
      <ToursExploreClient
        initialTours={tours}
        initialType={searchParams.type}
        initialLocation={searchParams.location}
        initialProvince={searchParams.province}
        initialQuery={searchParams.q}
        initialCurrency={getServerCurrency()}
      />

      {tours.length > 0 ? (
        <PageContainer className="pb-16">
          <nav aria-label="All Pakistan tours" className="border-t border-border pt-8">
            <h2 className="text-lg font-bold text-foreground">All Pakistan tours</h2>
            <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((t) => (
                <li key={t._id}>
                  <Link
                    href={`/tours/${t.slug}`}
                    className="text-havezic-primary underline-offset-2 hover:underline"
                  >
                    {t.title}
                  </Link>
                  <span className="text-muted">
                    {" "}
                    · {t.durationDays} day{t.durationDays === 1 ? "" : "s"}
                    {t.location ? ` · ${t.location}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </PageContainer>
      ) : null}
    </main>
  );
}
