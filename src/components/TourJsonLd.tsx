import { getSiteUrl } from "@/lib/site";

type TourLike = {
  title: string;
  description: string;
  slug: string;
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
    image: tour.images.map((src) =>
      src.startsWith("http") ? src : `${base}${src}`,
    ),
    url: `${base}/tours/${tour.slug}`,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
