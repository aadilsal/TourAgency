"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { CurrencyCode } from "@/lib/money";
import {
  formatTourPrice,
  getPerHeadOptions,
  tourHasPrice,
  type PerHeadPrice,
} from "@/lib/tourPricing";

export type TourPriceFields = {
  price?: number;
  /** Total price for the whole tour. */
  pricePkr?: number;
  priceUsd?: number;
  perHeadPrices?: PerHeadPrice[];
};

/**
 * Subscribe to a tour's prices, seeded by the server-rendered values.
 *
 * The detail page is a server component, so its HTML — and the RSC payload
 * Next caches client-side after a prefetch — can keep showing a stale price
 * after an admin edit, while tour cards (which subscribe to Convex) update
 * immediately. Subscribing here puts both surfaces on the same live data.
 */
export function useLiveTourPrices(
  slug: string,
  initial: TourPriceFields,
): TourPriceFields {
  const live = useQuery(api.tours.getTourPricingBySlug, { slug });
  return live ?? initial;
}

/** Per-head options as a compact list. Renders nothing when there are none. */
export function PerHeadPriceList({
  options,
  className,
}: {
  options: ReturnType<typeof getPerHeadOptions>;
  className?: string;
}) {
  if (options.length === 0) return null;
  return (
    <ul className={className}>
      {options.map((o) => (
        <li key={o.persons} className="flex items-baseline justify-between gap-4">
          <span className="text-muted">
            {o.persons} {o.persons === 1 ? "person" : "persons"}
          </span>
          <span className="font-bold text-foreground">
            {o.label}
            <span className="text-xs font-medium text-muted"> / person</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  slug: string;
  currency: CurrencyCode;
  /** Server-rendered prices, used until the subscription resolves. */
  initial: TourPriceFields;
  variant: "aside" | "inline";
};

export function TourLivePrice({ slug, currency, initial, variant }: Props) {
  const tour = useLiveTourPrices(slug, initial);
  const bookable = tourHasPrice(tour);
  const priceLabel = formatTourPrice(tour, currency);
  const perHead = getPerHeadOptions(tour, currency);

  if (variant === "inline") {
    return (
      <>
        {bookable && priceLabel ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Total tour
            </p>
            <p className="text-lg font-bold text-havezic-primary">{priceLabel}</p>
          </div>
        ) : null}
        {perHead.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Per head
            </p>
            <p className="text-lg font-bold text-havezic-primary">
              {perHead.map((o) => `${o.label} (${o.persons})`).join(" · ")}
            </p>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      {bookable && priceLabel ? (
        <p className="text-sm text-muted">
          <span className="text-2xl font-extrabold text-foreground">{priceLabel}</span>
          <span className="text-sm"> total tour</span>
        </p>
      ) : null}
      {perHead.length > 0 ? (
        <div className={bookable && priceLabel ? "mt-3" : ""}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Price per head
          </p>
          <PerHeadPriceList options={perHead} className="mt-1 space-y-1 text-sm" />
        </div>
      ) : null}
      {!(bookable && priceLabel) && perHead.length === 0 ? (
        <p className="text-base font-semibold text-foreground">
          Tailored quote on request
        </p>
      ) : null}
    </>
  );
}
