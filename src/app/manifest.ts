import type { MetadataRoute } from "next";
import { BUSINESS } from "@/config/business";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BUSINESS.name} — Pakistan Heritage & Culture Tours`,
    short_name: BUSINESS.name,
    description: BUSINESS.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: BUSINESS.backgroundColor,
    theme_color: BUSINESS.themeColor,
    lang: "en",
    categories: ["travel"],
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
