/**
 * Free Google-reviews widget support (fallback when the Places API key isn't
 * set up). The admin pastes whatever code the provider gives them; we only
 * ever extract the widget id and load that provider's official script
 * ourselves — pasted HTML is never injected into the page.
 */
export type ReviewsWidget =
  | { provider: "trustindex"; id: string }
  | { provider: "elfsight"; id: string };

const TRUSTINDEX_IN_CODE = /trustindex\.io\/loader\.js\?([A-Za-z0-9]{8,64})/;
const ELFSIGHT_IN_CODE = /elfsight-app-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRUSTINDEX_ID = /^[A-Za-z0-9]{12,64}$/;

export function parseReviewsWidget(raw: string | null | undefined): ReviewsWidget | null {
  const code = (raw ?? "").trim();
  if (!code) return null;
  const ti = code.match(TRUSTINDEX_IN_CODE);
  if (ti) return { provider: "trustindex", id: ti[1]! };
  const el = code.match(ELFSIGHT_IN_CODE);
  if (el) return { provider: "elfsight", id: el[1]!.toLowerCase() };
  // A bare id: Elfsight ids are UUIDs, Trustindex ids are long alphanumerics.
  if (UUID.test(code)) return { provider: "elfsight", id: code.toLowerCase() };
  if (TRUSTINDEX_ID.test(code)) return { provider: "trustindex", id: code };
  return null;
}

/** "4.9" → 4.9 when it's a sensible star rating, else null. */
export function parseStarRating(raw: string | null | undefined): number | null {
  const n = Number.parseFloat((raw ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
}
