export type TourTypeFilter =
  | "family"
  | "honeymoon"
  | "adventure"
  | "corporate"
  | "budget";

export const TOUR_TYPE_OPTIONS: ReadonlyArray<{
  value: TourTypeFilter;
  label: string;
}> = [
  { value: "family", label: "Family" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "adventure", label: "Adventure" },
  { value: "corporate", label: "Corporate" },
  { value: "budget", label: "Budget" },
];

const TYPE_KEYWORDS: Record<TourTypeFilter, string[]> = {
  family: ["family", "kid", "child", "children", "parents"],
  honeymoon: ["honeymoon", "couple", "romantic", "wedding", "anniversary"],
  adventure: ["adventure", "trek", "trekking", "hike", "hiking", "jeep", "expedition"],
  corporate: ["corporate", "team", "business", "company", "retreat"],
  budget: ["budget", "economy", "affordable", "value"],
};

export function tourMatchesType(
  tour: { title: string; description: string; types?: string[] },
  type: TourTypeFilter,
): boolean {
  if (Array.isArray(tour.types) && tour.types.length > 0) {
    const normalized = tour.types.map((t) => t.trim().toLowerCase());
    return normalized.includes(type);
  }

  // Backward compatibility for older tours that haven't been assigned explicit types yet.
  const blob = `${tour.title} ${tour.description}`.toLowerCase();
  return TYPE_KEYWORDS[type].some((k) => blob.includes(k));
}

export function parseTourType(raw: string | undefined): TourTypeFilter | null {
  if (!raw) return null;
  const t = raw.toLowerCase();
  if (
    t === "family" ||
    t === "honeymoon" ||
    t === "adventure" ||
    t === "corporate" ||
    t === "budget"
  ) {
    return t;
  }
  return null;
}
