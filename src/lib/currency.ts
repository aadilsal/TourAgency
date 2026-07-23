import type { CurrencyCode } from "@/lib/money";
import { parseCookieValue } from "@/lib/money";

export const CURRENCY_COOKIE = "jt_currency";

export function normalizeCurrency(raw: unknown): CurrencyCode {
  return raw === "PKR" ? "PKR" : "USD";
}

export function getClientCurrency(): CurrencyCode {
  // Default to USD (international audience) until the cookie resolves.
  if (typeof document === "undefined") return "USD";
  return normalizeCurrency(parseCookieValue(document.cookie, CURRENCY_COOKIE));
}

