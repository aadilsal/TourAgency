"use client";

import { useEffect, useState } from "react";
import { getClientCurrency } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/money";

export function useCurrency(): CurrencyCode {
  const [currency, setCurrency] = useState<CurrencyCode>(() => getClientCurrency());

  useEffect(() => {
    setCurrency(getClientCurrency());
  }, []);

  return currency;
}

