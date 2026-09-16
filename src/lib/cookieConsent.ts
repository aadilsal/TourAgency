export const COOKIE_CONSENT_STORAGE_KEY = "jt_cookie_consent";
/** Fired on window with `detail: CookieConsentValue` whenever the visitor chooses. */
export const COOKIE_CONSENT_EVENT = "jt-cookie-consent-changed";
/** Dispatch (via `openCookieSettings()`) to re-open the banner, e.g. from a footer link. */
export const COOKIE_SETTINGS_OPEN_EVENT = "jt-cookie-settings-open";
/**
 * Fired on window with `detail: boolean` when the banner shows/hides. Bottom
 * sticky UI (mobile booking CTA, WhatsApp float) can listen and step aside.
 * The current state is also mirrored on `<html data-cookie-banner="open">`.
 */
export const COOKIE_BANNER_VISIBILITY_EVENT = "jt-cookie-banner-visibility";

export type CookieConsentValue = "accepted" | "declined";

export function getStoredCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return raw === "accepted" || raw === "declined" ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredCookieConsent(value: CookieConsentValue) {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage blocked (private mode / strict settings) — still apply for this page view.
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
}

/** Re-open the cookie banner so the visitor can change or withdraw consent. */
export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT));
}

export function isCookieBannerVisible(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.cookieBanner === "open";
}

/** Internal: called by CookieConsentBanner. */
export function announceCookieBannerVisibility(visible: boolean) {
  if (typeof window === "undefined") return;
  if (visible) document.documentElement.dataset.cookieBanner = "open";
  else delete document.documentElement.dataset.cookieBanner;
  window.dispatchEvent(new CustomEvent(COOKIE_BANNER_VISIBILITY_EVENT, { detail: visible }));
}
