import { cookies } from "next/headers";
import { CURRENCY_COOKIE, normalizeCurrency } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/money";

/** Read the visitor's currency from the cookie set by middleware (server-side). */
export function getServerCurrency(): CurrencyCode {
  return normalizeCurrency(cookies().get(CURRENCY_COOKIE)?.value);
}
