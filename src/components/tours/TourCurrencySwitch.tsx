"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { setClientCurrency } from "@/lib/currency";
import { useCurrency } from "@/hooks/useCurrency";
import type { CurrencyCode } from "@/lib/money";

const OPTIONS: CurrencyCode[] = ["USD", "PKR"];

/**
 * USD/PKR switch for a tour priced in both currencies (render it only when
 * `tourHasBothCurrencies` is true). Middleware picks a first-visit default
 * from the visitor's country; this lets them override it (kept for a year).
 */
export function TourCurrencySwitch({
  initialCurrency,
  className,
}: {
  initialCurrency: CurrencyCode;
  className?: string;
}) {
  const currency = useCurrency(initialCurrency);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: CurrencyCode) {
    if (next === currency) return;
    setClientCurrency(next);
    // Re-render server components (this tour's prices) in the new currency.
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="Price currency"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-panel-elevated p-0.5",
        pending && "opacity-70",
        className,
      )}
    >
      {OPTIONS.map((code) => {
        const active = code === currency;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            title={`Show price in ${code}`}
            onClick={() => choose(code)}
            className={cn(
              "h-7 min-w-[2.75rem] rounded-full px-2.5 text-xs font-bold tracking-wide transition",
              active
                ? "bg-brand-primary text-white shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
