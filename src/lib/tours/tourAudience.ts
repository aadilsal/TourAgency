/**
 * Who a tour is marketed to. A tour without one is for everyone (no badge).
 * The stored value stays "foreigners"; visitors see it as "International".
 */
export type TourAudience = "foreigners" | "pakistanis";

export const TOUR_AUDIENCE_OPTIONS: ReadonlyArray<{
  value: TourAudience;
  /** /tours filter + admin picker label. */
  label: string;
  /** Short badge on cards and the tour page. */
  badge: string;
}> = [
  { value: "foreigners", label: "International tours", badge: "International tour" },
  { value: "pakistanis", label: "Pakistani tours", badge: "Pakistani tour" },
];

export function parseTourAudience(raw: string | null | undefined): TourAudience | null {
  return raw === "foreigners" || raw === "pakistanis" ? raw : null;
}

export function tourAudienceBadge(audience: string | null | undefined): string | null {
  const a = parseTourAudience(audience);
  return a ? TOUR_AUDIENCE_OPTIONS.find((o) => o.value === a)!.badge : null;
}
