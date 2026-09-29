/**
 * Thin, safe wrapper around Google's gtag.js.
 *
 * Every call is a no-op when gtag hasn't loaded (no GA4 ID configured, visitor
 * declined cookies, ad blocker, SSR) — callers never need to guard.
 *
 * Recommended event names (GA4 conventions):
 *   generate_lead   — enquiry / booking request submitted (thank-you page)
 *   contact         — WhatsApp / phone / email click   { method: "whatsapp" }
 *   view_item       — tour detail page viewed           { item_id, item_name }
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

/**
 * Google Consent Mode v2 signals derived from the cookie banner choice.
 * "Accept all" covers analytics and advertising measurement (Google Ads /
 * Meta); "Reject all" denies everything optional. See the privacy policy.
 */
export function consentSignals(accepted: boolean): Record<string, ConsentState> {
  const v: ConsentState = accepted ? "granted" : "denied";
  return {
    analytics_storage: v,
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
  };
}

// ---------------------------------------------------------------------------
// Paid-ads measurement (Meta Pixel / Conversions API, Google Ads). All of it is
// inert unless the matching NEXT_PUBLIC_* ID is configured AND the visitor
// accepted cookies (the pixel/tag scripts only load after consent).
// ---------------------------------------------------------------------------

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const f = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof f === "function" ? f : null;
}

const META_STANDARD_EVENTS = new Set(["PageView", "ViewContent", "Lead", "Contact"]);

/** Meta Pixel event. `eventId` lets Meta de-duplicate against the server event. */
export function trackMeta(
  name: string,
  params: GtagParams = {},
  eventId?: string,
): void {
  const fbq = getFbq();
  if (!fbq) return;
  try {
    const method = META_STANDARD_EVENTS.has(name) ? "track" : "trackCustom";
    if (eventId) fbq(method, name, params, { eventID: eventId });
    else fbq(method, name, params);
  } catch {
    // Analytics must never break the page.
  }
}

/** Google Ads conversion (needs NEXT_PUBLIC_GOOGLE_ADS_ID + _LEAD_LABEL). */
export function trackAdsLeadConversion(transactionId?: string): void {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL;
  if (!id || !label) return;
  const gtag = getGtag();
  if (!gtag) return;
  try {
    gtag("event", "conversion", {
      send_to: `${id}/${label}`,
      ...(transactionId ? { transaction_id: transactionId } : {}),
    });
  } catch {
    // Analytics must never break the page.
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : undefined;
}

/**
 * Server-side (Conversions API) copy of a pixel event, sharing `eventId` so
 * Meta counts it once. Sent only when the visitor accepted cookies; the route
 * is a no-op unless META_CAPI_ACCESS_TOKEN is configured.
 */
export function sendMetaServerEvent(eventName: string, eventId: string): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return;
  try {
    if (window.localStorage.getItem("jt_cookie_consent") !== "accepted") return;
    void fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        sourceUrl: window.location.href,
        fbp: readCookie("_fbp"),
        fbc: readCookie("_fbc"),
      }),
    }).catch(() => undefined);
  } catch {
    // Analytics must never break the page.
  }
}

export function updateConsent(accepted: boolean): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("consent", "update", consentSignals(accepted));
}
