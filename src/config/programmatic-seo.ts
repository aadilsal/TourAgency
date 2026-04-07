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
];
