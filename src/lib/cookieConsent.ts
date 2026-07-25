export const COOKIE_CONSENT_STORAGE_KEY = "jt_cookie_consent";
export const COOKIE_CONSENT_EVENT = "jt-cookie-consent-changed";

export type CookieConsentValue = "accepted" | "declined";

export function getStoredCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  return raw === "accepted" || raw === "declined" ? raw : null;
}

export function setStoredCookieConsent(value: CookieConsentValue) {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
}
