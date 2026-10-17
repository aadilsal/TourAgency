import { formatMoney, type CurrencyCode } from "@/lib/money";

/** A per-head (per person) rate that applies to a given group size. */
export type PerHeadPrice = {
  persons: number;
  pricePkr?: number;
  priceUsd?: number;
};

type TourWithPrices = {
  price?: number;
  /** Total price for the whole tour. */
  pricePkr?: number;
  priceUsd?: number;
  /** Optional per-head rates by group size. Empty = no per-head pricing. */
  perHeadPrices?: PerHeadPrice[];
};

function isPositive(n: number | undefined): n is number {
  return Number.isFinite(n) && (n as number) > 0;
}

/**
 * An amount together with the currency it is actually priced in. When a tour
 * has no price in the visitor's currency we fall back to the other one (e.g. a
 * USD-only tour shown to a PKR visitor), so the amount's currency can differ
 * from the display preference — anything that records or formats the amount
 * must use this `currency`, never the preference.
 */
export type PricedAmount = { amount: number; currency: CurrencyCode };

/** First positive amount of the pair, preferring the visitor's currency. */
function pickPriced(
  pkr: number | undefined,
  usd: number | undefined,
  currency: CurrencyCode,
): PricedAmount | null {
  const other: CurrencyCode = currency === "PKR" ? "USD" : "PKR";
  const primary = currency === "PKR" ? pkr : usd;
  const secondary = currency === "PKR" ? usd : pkr;
  if (isPositive(primary)) return { amount: primary, currency };
  if (isPositive(secondary)) return { amount: secondary, currency: other };
  return null;
}

/**
 * Format the first positive amount of the pair, preferring the visitor's
 * currency and falling back to the other one. `null` when neither is set.
 */
function formatPair(
  pkr: number | undefined,
  usd: number | undefined,
  currency: CurrencyCode,
): string | null {
  const picked = pickPriced(pkr, usd, currency);
  return picked ? formatMoney(picked.amount, picked.currency) : null;
}

/**
 * Whether the tour is priced in both USD and PKR (total or per-head). Only
 * then is a USD/PKR switch meaningful — single-currency tours always show
 * the one price they have.
 */
export function tourHasBothCurrencies(tour: TourWithPrices): boolean {
  const rows = tour.perHeadPrices ?? [];
  const hasUsd = isPositive(tour.priceUsd) || rows.some((r) => isPositive(r.priceUsd));
  const hasPkr = isPositive(tour.pricePkr) || rows.some((r) => isPositive(r.pricePkr));
  return hasUsd && hasPkr;
}

/** Whether a total (whole-tour) price is published. */
export function tourHasTotalPrice(tour: TourWithPrices): boolean {
  return isPositive(tour.priceUsd) || isPositive(tour.pricePkr);
}

/**
 * A tour is "bookable" (shows a price + Book now) once any price is published —
 * a whole-tour total, a per-head rate, or both.
 */
export function tourHasPrice(tour: TourWithPrices): boolean {
  if (tourHasTotalPrice(tour)) return true;
  return (tour.perHeadPrices ?? []).some(
    (row) => isPositive(row.priceUsd) || isPositive(row.pricePkr),
  );
}

/**
 * Formatted total price for the whole tour, in the visitor's currency and
 * falling back to the other currency when only one is set. `null` when unset.
 */
export function formatTourPrice(
  tour: TourWithPrices,
  currency: CurrencyCode,
): string | null {
  return formatPair(tour.pricePkr, tour.priceUsd, currency);
}

/**
 * One short price label for lists and compact cards, in the visitor's
 * currency: the whole-tour total, else the cheapest per-person rate as
 * "From $600 / person", else `null` (show "Price on request").
 * Never reads the legacy `price` field, which is 0 on newer tours.
 */
export function formatTourPriceSummary(
  tour: TourWithPrices,
  currency: CurrencyCode,
): string | null {
  const total = formatTourPrice(tour, currency);
  if (total) return total;
  const cheapest = getPerHeadOptions(tour, currency).reduce<PerHeadOption | null>(
    (best, o) => (best === null || o.amount < best.amount ? o : best),
    null,
  );
  return cheapest ? `From ${cheapest.label} / person` : null;
}

export type PerHeadOption = {
  persons: number;
  amount: number;
  /** Currency `amount` is priced in (may differ from the display preference). */
  currency: CurrencyCode;
  /** Formatted amount, e.g. "$600". */
  label: string;
};

/**
 * Publishable per-head options for the visitor's currency, ascending by group
 * size. Rows without a usable price (or a sane group size) are dropped, so an
 * empty array means "hide the per-head block entirely".
 */
export function getPerHeadOptions(
  tour: TourWithPrices,
  currency: CurrencyCode,
): PerHeadOption[] {
  const rows = tour.perHeadPrices ?? [];
  return rows
    .map((row) => {
      const picked = pickPriced(row.pricePkr, row.priceUsd, currency);
      if (picked === null || !Number.isFinite(row.persons) || row.persons < 1) {
        return null;
      }
      return {
        persons: Math.round(row.persons),
        amount: picked.amount,
        currency: picked.currency,
        label: formatMoney(picked.amount, picked.currency),
      };
    })
    .filter((x): x is PerHeadOption => x !== null)
    .sort((a, b) => a.persons - b.persons);
}

/** Whether any per-head option is publishable in the visitor's currency. */
export function tourHasPerHeadPrices(
  tour: TourWithPrices,
  currency: CurrencyCode,
): boolean {
  return getPerHeadOptions(tour, currency).length > 0;
}

/**
 * The per-head option that applies to a group of `peopleCount`: the largest
 * option that the group is big enough for, or the smallest option when the
 * group is below every published tier.
 */
export function findPerHeadOption(
  tour: TourWithPrices,
  currency: CurrencyCode,
  peopleCount: number,
): PerHeadOption | null {
  const options = getPerHeadOptions(tour, currency);
  if (options.length === 0) return null;
  let match: PerHeadOption | null = null;
  for (const option of options) {
    if (option.persons <= peopleCount) match = option;
  }
  return match ?? options[0]!;
}

/**
 * Per-person price to record on a booking of `peopleCount` travelers, with the
 * currency it is actually in — record the booking in *that* currency, so a
 * USD-only tour booked by a PKR visitor is stored as USD, not as PKR.
 *
 * Bookings store `unitPrice` and derive `totalPrice = unitPrice * peopleCount`,
 * so when a tour is only priced as a whole-tour total we divide it across the
 * group to keep that total correct. `null` when the tour has no price.
 */
export function getTourUnitPricing(
  tour: TourWithPrices,
  currency: CurrencyCode,
  peopleCount = 1,
): PricedAmount | null {
  const people = Math.max(1, Math.round(peopleCount));
  const perHead = findPerHeadOption(tour, currency, people);
  if (perHead) return { amount: perHead.amount, currency: perHead.currency };

  const total =
    pickPriced(tour.pricePkr, tour.priceUsd, currency) ??
    // Legacy rows only ever carried a PKR figure in `price`.
    (currency === "PKR" && isPositive(tour.price)
      ? { amount: tour.price, currency: "PKR" as const }
      : null);
  if (total === null) return null;
  return { amount: total.amount / people, currency: total.currency };
}

/** Amount part of {@link getTourUnitPricing}; 0 when the tour has no price. */
export function getTourUnitPrice(
  tour: TourWithPrices,
  currency: CurrencyCode,
  peopleCount = 1,
): number {
  return getTourUnitPricing(tour, currency, peopleCount)?.amount ?? 0;
}
