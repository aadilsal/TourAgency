/**
 * The one rule for tour URL slugs, shared by Convex and the admin editor.
 *
 * Slugs end up in URLs, so only `a-z`, `0-9` and single dashes survive. A raw
 * `&` in a slug once made a live tour 404 (Next hands the route param over as
 * `%26`, which never matched the stored slug).
 */
export function normalizeTourSlug(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "café" → "cafe"
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "") // "hunza's" → "hunzas", not "hunza-s"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The pre-2026-10 rule (trim + lowercase + spaces → dashes), for matching old imports. */
export function legacyNormalizeTourSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

export function isCleanTourSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
