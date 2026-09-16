import type { Metadata } from "next";
import { BUSINESS } from "@/config/business";
import { getSiteUrl } from "@/lib/site";

export const SITE_NAME = BUSINESS.name;
export const DEFAULT_OG_IMAGE = {
  url: BUSINESS.ogImagePath,
  width: 1200,
  height: 630,
  alt: "Badshahi Mosque, Lahore — heritage tours of Pakistan with JunketTours",
};

type BuildMetadataInput = {
  /** Page title without the brand suffix (the root template adds " | JunketTours"). */
  title: string;
  /** ≤160 chars; longer strings are trimmed on a word boundary. */
  description: string;
  /** Site-relative path used for the canonical URL and og:url, e.g. "/tours". */
  path: string;
  /** Absolute or site-relative image URL. Defaults to the brand OG image. */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  /** Keep the page out of search results (private / transactional pages). */
  noindex?: boolean;
  /** Use the title verbatim (no " | JunketTours" suffix). */
  absoluteTitle?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
};

/** Trim to `max` chars on a word boundary, adding an ellipsis. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—-]+$/, "")}…`;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getSiteUrl();
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Consistent per-page metadata: unique title + description, self-referencing
 * canonical, full OpenGraph/Twitter cards (Next shallow-merges `openGraph`, so
 * every page must restate siteName/locale/images) and optional noindex.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  noindex = false,
  absoluteTitle = false,
  publishedTime,
  modifiedTime,
  keywords,
}: BuildMetadataInput): Metadata {
  const desc = truncate(description, 160);
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const canonicalPath = path === "" ? "/" : path;
  const ogImage =
    image && image.trim()
      ? { url: absoluteUrl(image), alt: imageAlt ?? title }
      : DEFAULT_OG_IMAGE;

  const metadata: Metadata = {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_US",
      title: fullTitle,
      description: desc,
      url: canonicalPath,
      images: [ogImage],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [ogImage.url],
    },
  };
  if (keywords?.length) metadata.keywords = keywords;
  if (noindex) {
    metadata.robots = { index: false, follow: false, googleBot: { index: false, follow: false } };
  }
  return metadata;
}

/** Metadata for private/transactional routes: titled, never indexed. */
export function privateMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}
