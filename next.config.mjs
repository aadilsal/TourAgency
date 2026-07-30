const landingSlugs = [
  "hunza-trip-from-lahore",
  "skardu-tour-cost",
  "hunza-tour-package-price",
  "skardu-tour-by-air-vs-road",
  "swat-tour-from-lahore",
  "naran-kaghan-tour-from-lahore",
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
  images: {
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
