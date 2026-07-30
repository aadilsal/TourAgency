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
 * Format the first positive amount of the pair, preferring the visitor's
 * currency and falling back to the other one. `null` when neither is set.
 */
function formatPair(
  pkr: number | undefined,
  usd: number | undefined,
  currency: CurrencyCode,
): string | null {
  const other: CurrencyCode = currency === "PKR" ? "USD" : "PKR";
  const primary = currency === "PKR" ? pkr : usd;
  const secondary = currency === "PKR" ? usd : pkr;
  if (isPositive(primary)) return formatMoney(primary, currency);
  if (isPositive(secondary)) return formatMoney(secondary, other);
  return null;
}

/** First positive amount of the pair, preferring the visitor's currency. */
function pickAmount(
  pkr: number | undefined,
  usd: number | undefined,
  currency: CurrencyCode,
): number | null {
  const primary = currency === "PKR" ? pkr : usd;
  const secondary = currency === "PKR" ? usd : pkr;
  if (isPositive(primary)) return primary;
  if (isPositive(secondary)) return secondary;
  return null;
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

export type PerHeadOption = {
  persons: number;
  amount: number;
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
      const amount = pickAmount(row.pricePkr, row.priceUsd, currency);
      if (amount === null || !Number.isFinite(row.persons) || row.persons < 1) {
        return null;
      }
      const label = formatPair(row.pricePkr, row.priceUsd, currency);
      if (!label) return null;
      return { persons: Math.round(row.persons), amount, label };
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
 * Per-person amount to record on a booking of `peopleCount` travelers.
 *
 * Bookings store `unitPrice` and derive `totalPrice = unitPrice * peopleCount`,
 * so when a tour is only priced as a whole-tour total we divide it across the
 * group to keep that total correct. Returns 0 when the tour has no price.
 */
export function getTourUnitPrice(
  tour: TourWithPrices,
  currency: CurrencyCode,
  peopleCount = 1,
): number {
  const people = Math.max(1, Math.round(peopleCount));
  const perHead = findPerHeadOption(tour, currency, people);
  if (perHead) return perHead.amount;

  const total =
    pickAmount(tour.pricePkr, tour.priceUsd, currency) ??
    // Legacy rows only ever carried a PKR figure in `price`.
    (currency === "PKR" && isPositive(tour.price) ? tour.price : null);
  if (total === null) return 0;
  return total / people;
}
