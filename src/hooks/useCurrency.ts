"use client";

import { useEffect, useState } from "react";
import { CURRENCY_CHANGE_EVENT, getClientCurrency } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/money";

/**
 * `initial` should be the server-resolved currency so server and first client
 * render agree (reading document.cookie in the initializer would mismatch for
 * visitors whose cookie says PKR and cause a hydration error).
 *
 * Follows the header USD/PKR switch live, without a page reload.
 */
export function useCurrency(initial: CurrencyCode = "USD"): CurrencyCode {
  const [currency, setCurrency] = useState<CurrencyCode>(initial);

  useEffect(() => {
    setCurrency(getClientCurrency());
    const onChange = () => setCurrency(getClientCurrency());
    window.addEventListener(CURRENCY_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CURRENCY_CHANGE_EVENT, onChange);
  }, []);

  return currency;
}
