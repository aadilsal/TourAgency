import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, transactional or API routes. These pages also send
        // `noindex`; keep the two in sync (a disallowed page can't be crawled
        // to see its noindex, but also won't be fetched for content).
        disallow: [
          "/admin",
          "/dashboard",
          "/api/",
          "/login",
          "/register",
          "/thank-you",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
