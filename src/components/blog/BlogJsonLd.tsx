import { getSiteUrl } from "@/lib/site";
import { BUSINESS } from "@/config/business";
import { JsonLdScript } from "@/components/JsonLdScript";

type Props = {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
};

/** BlogPosting structured data (eligible for Google article rich results). */
export function BlogArticleJsonLd({
  title,
  description,
  slug,
  datePublished,
  dateModified,
  image,
}: Props) {
  const base = getSiteUrl();
  const url = `${base}/blog/${slug}`;
  const img = image
    ? /^https?:\/\//i.test(image)
      ? image
      : `${base}${image.startsWith("/") ? "" : "/"}${image}`
    : `${base}${BUSINESS.ogImagePath}`;

  const json = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: title.slice(0, 110),
    description,
    url,
    image: [img],
    inLanguage: "en",
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      "@type": "Organization",
      name: BUSINESS.name,
      url: base,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: BUSINESS.name,
      url: base,
      logo: { "@type": "ImageObject", url: `${base}${BUSINESS.logoPath}` },
    },
  };

  return <JsonLdScript data={json} />;
}
