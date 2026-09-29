import { getSiteUrl } from "@/lib/site";
import { JsonLdScript } from "@/components/JsonLdScript";
import { truncate } from "@/lib/seo";

type Props = {
  name: string;
  slug: string;
  description: string;
  image?: string | null;
  /** Province the destination sits in (e.g. "Gilgit-Baltistan"), when known. */
  provinceName?: string | null;
};

/** schema.org TouristDestination for /destinations/[slug]. */
export function DestinationJsonLd({ name, slug, description, image, provinceName }: Props) {
  const base = getSiteUrl();
  const url = `${base}/destinations/${slug}`;
  const img = image
    ? /^https?:\/\//i.test(image)
      ? image
      : `${base}${image.startsWith("/") ? "" : "/"}${image}`
    : undefined;

  const data = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "@id": `${url}#destination`,
    name,
    description: truncate(description, 500),
    url,
    ...(img ? { image: img } : {}),
    containedInPlace: provinceName
      ? {
          "@type": "AdministrativeArea",
          name: provinceName,
          containedInPlace: { "@type": "Country", name: "Pakistan" },
        }
      : { "@type": "Country", name: "Pakistan" },
  };

  return <JsonLdScript data={data} />;
}
