/**
 * Route rules for bottom-anchored floating UI (sticky CTA, WhatsApp float,
 * trip-assistant launcher). Keeping them in one place stops the buttons from
 * doubling up or overlapping as pages add their own sticky bars.
 */

/** Tour detail pages render their own sticky booking bar (TourStickyBooking, < lg). */
export function isTourDetailRoute(pathname: string | null | undefined): boolean {
  return !!pathname && /^\/tours\/[^/]+\/?$/.test(pathname);
}

/**
 * Routes that must NOT show the site-wide mobile CTA:
 * - tour detail pages (own booking bar)
 * - conversion / auth / account screens, which should stay focused
 * - the planner page itself
 */
const MOBILE_CTA_EXCLUDED: RegExp[] = [
  /^\/tours\/[^/]+\/?$/,
  /^\/thank-you(\/|$)/,
  /^\/login(\/|$)/,
  /^\/register(\/|$)/,
  /^\/dashboard(\/|$)/,
  /^\/ai-planner(\/|$)/,
  /^\/admin(\/|$)/,
];

export function isMobileStickyCtaRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return !MOBILE_CTA_EXCLUDED.some((re) => re.test(pathname));
}
