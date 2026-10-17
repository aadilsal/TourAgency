import type { CurrencyCode } from "@/lib/money";
import { parseCookieValue } from "@/lib/money";

export const CURRENCY_COOKIE = "jt_currency";
/** One year: a visitor's USD/PKR choice should outlast a single trip plan. */
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
/** Fired on `window` after the visitor switches currency (detail = code). */
export const CURRENCY_CHANGE_EVENT = "jt:currency-change";

export function normalizeCurrency(raw: unknown): CurrencyCode {
  return raw === "PKR" ? "PKR" : "USD";
}

export function getClientCurrency(): CurrencyCode {
  // Default to USD (international audience) until the cookie resolves.
  if (typeof document === "undefined") return "USD";
  return normalizeCurrency(parseCookieValue(document.cookie, CURRENCY_COOKIE));
}

/**
 * Save the visitor's display currency and tell mounted client components.
 * Server-rendered prices pick it up on the next render (`router.refresh()`).
 */
export function setClientCurrency(currency: CurrencyCode): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CURRENCY_COOKIE}=${currency}; Path=/; Max-Age=${CURRENCY_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: currency }));
}
