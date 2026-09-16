/**
 * Thin, safe wrapper around Google's gtag.js.
 *
 * Every call is a no-op when gtag hasn't loaded (no GA4 ID configured, visitor
 * declined cookies, ad blocker, SSR) — callers never need to guard.
 *
 * Recommended event names (GA4 conventions):
 *   generate_lead   — enquiry / booking request submitted (thank-you page)
 *   contact         — WhatsApp / phone / email click   { method: "whatsapp" }
 *   begin_checkout  — booking form opened on a tour     { tour_slug }
 *   search          — site search                       { search_term }
 *   sign_up / login — account flows                     { method }
 */

type GtagParams = Record<string, string | number | boolean | undefined>;
type ConsentState = "granted" | "denied";

type Gtag = (...args: unknown[]) => void;

function getGtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === "function" ? g : null;
}

export function isAnalyticsReady(): boolean {
  return getGtag() !== null;
}

export function trackEvent(name: string, params: GtagParams = {}): void {
  const gtag = getGtag();
  if (!gtag) return;
  try {
    gtag("event", name, params);
  } catch {
    // Analytics must never break the page.
  }
}

/** Google Consent Mode v2 signals derived from the cookie banner choice. */
export function consentSignals(accepted: boolean): Record<string, ConsentState> {
  const v: ConsentState = accepted ? "granted" : "denied";
  return {
    analytics_storage: v,
    // This site doesn't run ads; keep advertising signals denied unless the
    // client later adds Google Ads remarketing with an updated privacy policy.
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  };
}

export function updateConsent(accepted: boolean): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("consent", "update", consentSignals(accepted));
}
