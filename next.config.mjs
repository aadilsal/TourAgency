const landingSlugs = [
  "hunza-trip-from-lahore",
  "skardu-tour-cost",
  "hunza-tour-package-price",
  "skardu-tour-by-air-vs-road",
  "swat-tour-from-lahore",
  "naran-kaghan-tour-from-lahore",
  "lahore-heritage-tour-package",
  "taxila-day-trip-from-islamabad",
  "multan-heritage-tour",
  "pakistan-cultural-tour-packages",
  "swat-buddhist-heritage-trail",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Smaller dev/client graphs; avoids occasional webpack module factory issues with lucide barrel.
    optimizePackageImports: ["lucide-react"],
    // Don't reuse cached RSC payloads for dynamic routes on client-side navigation.
    // Without this, Next serves a prefetched /tours/[slug] payload for up to 30s,
    // so an admin price edit showed on the (Convex-subscribed) tour cards while the
    // detail page still rendered the old price.
    staleTimes: { dynamic: 0, static: 0 },
  },
  webpack(config, { dev }) {
    // Windows can intermittently lose filesystem cache packs/chunks (AV/file-locking),
    // which shows up as “Cannot find module './xxxx.js'” from `.next/server/webpack-runtime.js`.
    // Use in-memory cache in dev to avoid this class of corruption.
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
  async headers() {
    // Baseline security headers (no CSP yet — GA4, Google Maps embeds, Convex
    // websockets and Vercel Analytics would all need careful allow-listing;
    // roll one out in Report-Only mode first).
    const securityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // The site embeds Google Maps (outbound iframes) but is never framed by
      // other origins; SAMEORIGIN still allows admin self-previews.
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
      },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Marketing images rarely change but keep stable filenames, so cache
        // for a day and serve stale while revalidating for up to a week.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  images: {
    // AVIF first (≈20–30% smaller than WebP), WebP fallback.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    // NOTE: hostname "**" allows next/image to load images from ANY host. This is
    // deliberately permissive so a legacy/admin-entered external image URL can
    // never hard-crash a page again ("hostname not configured"). New images are
    // upload-only (stored in Convex), so once legacy external URLs are migrated
    // this can be tightened back to the specific hosts below.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.convex.cloud" },
      { protocol: "https", hostname: "**.convex.site" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    return landingSlugs.map((slug) => ({
      source: `/${slug}`,
      destination: `/landings/${slug}`,
    }));
  },
};

export default nextConfig;
