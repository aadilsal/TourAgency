const landingSlugs = ["hunza-trip-from-lahore", "skardu-tour-cost"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Smaller dev/client graphs; avoids occasional webpack module factory issues with lucide barrel.
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    return landingSlugs.map((slug) => ({
      source: `/${slug}`,
      destination: `/landings/${slug}`,
    }));
  },
};

export default nextConfig;
