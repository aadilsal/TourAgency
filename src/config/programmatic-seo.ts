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
  {
    slug: "lahore-heritage-tour-package",
    title: "Lahore heritage tour package | JunketTours",
    description:
      "Book a Lahore heritage tour — Badshahi Mosque, Lahore Fort, Walled City walks, and old-city food streets with clear inclusions.",
    keywords: ["Lahore", "heritage tour", "Mughal", "Pakistan culture"],
  },
  {
    slug: "taxila-day-trip-from-islamabad",
    title: "Taxila day trip from Islamabad | JunketTours",
    description:
      "Plan a Taxila Gandhara day trip from Islamabad — museum, Buddhist stupa sites, and licensed guide options.",
    keywords: ["Taxila", "Gandhara", "Islamabad", "heritage day trip"],
  },
  {
    slug: "multan-heritage-tour",
    title: "Multan heritage tour — shrines & tilework | JunketTours",
    description:
      "Explore Multan's Sufi shrines, blue tilework, and old-city bazaars on a guided heritage circuit.",
    keywords: ["Multan", "heritage", "Sufi shrines", "Pakistan culture"],
  },
  {
    slug: "pakistan-cultural-tour-packages",
    title: "Pakistan cultural tour packages | JunketTours",
    description:
      "Culture and history tours across Pakistan — Lahore, Taxila, Swat Gandhara, and northern valley heritage. Browse packages or request a custom plan.",
    keywords: ["Pakistan culture", "heritage tours", "history travel"],
  },
  {
    slug: "swat-buddhist-heritage-trail",
    title: "Swat Buddhist heritage trail | JunketTours",
    description:
      "A Swat heritage itinerary — Gandhara archaeological sites, Buddhist stupas, and emerald valley scenery.",
    keywords: ["Swat", "Buddhist heritage", "Gandhara", "Pakistan culture"],
  },
];

/**
 * Landing slugs that next.config.mjs `rewrites()` serves at the site root
 * (`/<slug>` → `/landings/<slug>`). KEEP IN SYNC with `landingSlugs` in
 * next.config.mjs. Slugs not listed here are only reachable at
 * `/landings/<slug>`, so canonical + sitemap URLs must use that path.
 */
export const ROOT_REWRITTEN_LANDING_SLUGS: readonly string[] = [
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

/** Public, crawlable path for a landing page (never a 404). */
export function landingPath(slug: string): string {
  return ROOT_REWRITTEN_LANDING_SLUGS.includes(slug)
    ? `/${slug}`
    : `/landings/${slug}`;
}
