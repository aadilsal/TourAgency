"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { setClientCurrency } from "@/lib/currency";
import { useCurrency } from "@/hooks/useCurrency";
import type { CurrencyCode } from "@/lib/money";

const OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: "USD", label: "USD" },
  { code: "PKR", label: "PKR" },
];

/**
 * Header USD/PKR switch. Middleware picks a first-visit default from the
 * visitor's country; this lets them override it (kept for a year). Tours with
 * no PKR price still show their USD price either way.
 */
export function CurrencySwitch({
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
    // Re-render server components (tour pages, lists) with the new currency.
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="Display currency"
      className={cn(
        "inline-flex h-10 items-center rounded-full bg-white/10 p-1 ring-1 ring-white/15",
        pending && "opacity-70",
        className,
      )}
    >
      {OPTIONS.map(({ code, label }) => {
        const active = code === currency;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            title={`Show prices in ${code}`}
            onClick={() => choose(code)}
            className={cn(
              "h-8 min-w-[2.75rem] rounded-full px-2.5 text-xs font-bold tracking-wide transition",
              active
                ? "bg-white text-brand-primary shadow-sm"
                : "text-white/80 hover:text-white",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
