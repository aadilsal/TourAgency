import { getSiteUrl } from "@/lib/site";

type Props = {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
};

/** Article structured data for SEO. */
export function BlogArticleJsonLd({
  title,
  description,
  slug,
  datePublished,
}: Props) {
  const base = getSiteUrl();
  const url = `${base}/blog/${slug}`;
  const json = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished,
    publisher: {
      "@type": "Organization",
      name: "JunketTours",
      url: base,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
