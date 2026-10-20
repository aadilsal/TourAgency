/**
 * Optional tour badge + /tours filter. A tour without one shows no badge.
 * "foreigners" is shown as "International". The old "pakistanis" value is no
 * longer offered (it made Pakistani visitors feel excluded); rows that still
 * have it are treated as "no badge".
 */
export type TourAudience = "popular" | "foreigners";

export const TOUR_AUDIENCE_OPTIONS: ReadonlyArray<{
  value: TourAudience;
  /** /tours filter + admin picker label. */
  label: string;
  /** Short badge on cards and the tour page. */
  badge: string;
}> = [
  { value: "popular", label: "Most popular", badge: "Most popular" },
  { value: "foreigners", label: "International tours", badge: "International tour" },
];

export function parseTourAudience(raw: string | null | undefined): TourAudience | null {
  return raw === "popular" || raw === "foreigners" ? raw : null;
}

export function tourAudienceBadge(audience: string | null | undefined): string | null {
  const a = parseTourAudience(audience);
  return a ? TOUR_AUDIENCE_OPTIONS.find((o) => o.value === a)!.badge : null;
}
