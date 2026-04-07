import { getSiteUrl } from "@/lib/site";

type TourLike = {
  title: string;
  description: string;
  slug: string;
  price: number;
  durationDays: number;
  location: string;
  images: string[];
};

export function TourJsonLd({ tour }: { tour: TourLike }) {
  const base = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.description,
    touristType: "Adventure traveler",
    itinerary: {
      "@type": "ItemList",
      numberOfItems: tour.durationDays,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: tour.price,
      availability: "https://schema.org/InStock",
      url: `${base}/tours/${tour.slug}`,
    },
    image: tour.images.map((src) =>
      src.startsWith("http") ? src : `${base}${src}`,
    ),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
