"use client";

import { useEffect, useState } from "react";
import { getClientCurrency } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/money";

/**
 * `initial` should be the server-resolved currency so server and first client
 * render agree (reading document.cookie in the initializer would mismatch for
 * visitors whose cookie says PKR and cause a hydration error).
 */
export function useCurrency(initial: CurrencyCode = "USD"): CurrencyCode {
  const [currency, setCurrency] = useState<CurrencyCode>(initial);

  useEffect(() => {
    setCurrency(getClientCurrency());
  }, []);

  return currency;
}

