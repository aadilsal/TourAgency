import { getSiteUrl } from "@/lib/site";
import { BUSINESS } from "@/config/business";
import { JsonLdScript } from "@/components/JsonLdScript";
import { truncate } from "@/lib/seo";

type TourLike = {
  title: string;
  description: string;
  slug: string;
  durationDays: number;
  location: string;
  images: string[];
  pricePkr?: number;
  priceUsd?: number;
  perHeadPrices?: Array<{ persons: number; pricePkr?: number; priceUsd?: number }>;
  itinerary?: Array<{ day: number; title: string; description?: string }>;
};

const positive = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

/** Lowest published price, preferring USD (international audience). */
function pickOffer(tour: TourLike): { price: number; currency: "USD" | "PKR"; perPerson: boolean } | null {
  if (positive(tour.priceUsd)) return { price: tour.priceUsd, currency: "USD", perPerson: false };
  const rows = tour.perHeadPrices ?? [];
  const usd = rows.map((r) => r.priceUsd).filter(positive);
  if (usd.length) return { price: Math.min(...usd), currency: "USD", perPerson: true };
  if (positive(tour.pricePkr)) return { price: tour.pricePkr, currency: "PKR", perPerson: false };
  const pkr = rows.map((r) => r.pricePkr).filter(positive);
  if (pkr.length) return { price: Math.min(...pkr), currency: "PKR", perPerson: true };
  return null;
}

export function TourJsonLd({ tour }: { tour: TourLike }) {
  const base = getSiteUrl();
  const url = `${base}/tours/${tour.slug}`;
  const offer = pickOffer(tour);
  const itinerary = (tour.itinerary ?? []).filter((d) => d.title);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: tour.title,
    description: truncate(tour.description, 500),
    url,
    image: tour.images
      .filter(Boolean)
      .slice(0, 6)
      .map((src) => (/^https?:\/\//i.test(src) ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`)),
    touristType: ["Cultural tourism", "Heritage tourism"],
    duration: tour.durationDays > 0 ? `P${tour.durationDays}D` : undefined,
    ...(tour.location
      ? { contentLocation: { "@type": "Place", name: `${tour.location}, Pakistan` } }
      : {}),
    provider: {
      "@type": "TravelAgency",
      "@id": `${base}/#organization`,
      name: BUSINESS.name,
      url: base,
    },
  };

  if (itinerary.length) {
    data.itinerary = {
      "@type": "ItemList",
      numberOfItems: itinerary.length,
      itemListElement: itinerary.map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Day ${d.day}: ${d.title}`,
      })),
    };
  }

  if (offer) {
    data.offers = {
      "@type": "Offer",
      url,
      price: offer.price,
      priceCurrency: offer.currency,
      availability: "https://schema.org/InStock",
      ...(offer.perPerson
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: offer.price,
              priceCurrency: offer.currency,
              referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: "person" },
            },
          }
        : {}),
      offeredBy: { "@id": `${base}/#organization` },
    };
  }

  return <JsonLdScript data={JSON.parse(JSON.stringify(data))} />;
}
