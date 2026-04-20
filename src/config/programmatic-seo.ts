export type LandingPage = {
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
};

export const landingPages: LandingPage[] = [
  {
    slug: "hunza-trip-from-lahore",
    title: "Hunza trip from Lahore — itineraries & costs | JunketTours",
    description:
      "Plan a Hunza Valley trip from Lahore: typical routing, duration, and how to book a guided JunketTours package.",
    keywords: ["Hunza", "Lahore", "Gilgit-Baltistan", "tour package"],
  },
  {
    slug: "skardu-tour-cost",
    title: "Skardu tour cost guide | JunketTours",
    description:
      "Understand what drives Skardu tour pricing — seasonality, flights, and group size — before you book.",
    keywords: ["Skardu", "tour cost", "Pakistan travel"],
  },
  {
    slug: "hunza-tour-package-price",
    title: "Hunza tour package price (2026 guide) | JunketTours",
    description:
      "A clear breakdown of Hunza tour package pricing — season, transport, hotel category, and group size — plus how to book the right itinerary.",
    keywords: ["Hunza", "tour package price", "Pakistan travel", "2026"],
  },
  {
    slug: "skardu-tour-by-air-vs-road",
    title: "Skardu tour by air vs road — which is better? | JunketTours",
    description:
      "Compare Skardu travel by flight vs road: time, comfort, typical costs, and who each option fits — with booking tips for peak season.",
    keywords: ["Skardu", "flight vs road", "tour planning", "Pakistan"],
  },
  {
    slug: "swat-tour-from-lahore",
    title: "Swat tour from Lahore — route, timing & costs | JunketTours",
    description:
      "Plan a Swat trip from Lahore: the best route, ideal trip length, and how to book a tour package with clear inclusions and support.",
    keywords: ["Swat", "Lahore", "tour package", "Pakistan travel"],
  },
  {
    slug: "naran-kaghan-tour-from-lahore",
    title: "Naran Kaghan tour from Lahore — best time & itinerary | JunketTours",
    description:
      "A practical Naran Kaghan itinerary from Lahore, including best months to travel, budget expectations, and how to choose a reliable tour operator.",
    keywords: ["Naran", "Kaghan", "Lahore", "tour operator"],
  },
];
