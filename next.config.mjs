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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "**.convex.site",
      },
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
