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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
