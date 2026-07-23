import { formatMoney, type CurrencyCode } from "@/lib/money";

type TourWithPrices = {
  price?: number;
  pricePkr?: number;
  priceUsd?: number;
};

export function getTourUnitPrice(tour: TourWithPrices, currency: CurrencyCode): number {
  if (currency === "PKR") {
    if (Number.isFinite(tour.pricePkr)) return tour.pricePkr as number;
    if (Number.isFinite(tour.price)) return tour.price as number; // legacy
    return 0;
  }
  if (Number.isFinite(tour.priceUsd)) return tour.priceUsd as number;
  return 0;
}

/** A tour is "bookable" (shows price + Book now) once any real price is set. */
export function tourHasPrice(tour: TourWithPrices): boolean {
  return (
    (Number.isFinite(tour.priceUsd) && (tour.priceUsd as number) > 0) ||
    (Number.isFinite(tour.pricePkr) && (tour.pricePkr as number) > 0)
  );
}

/**
 * Formatted display price in the visitor's currency, falling back to the other
 * currency when only one is set. Returns null when no price is available.
 */
export function formatTourPrice(
  tour: TourWithPrices,
  currency: CurrencyCode,
): string | null {
  const other: CurrencyCode = currency === "PKR" ? "USD" : "PKR";
  const primary = currency === "PKR" ? tour.pricePkr : tour.priceUsd;
  const secondary = currency === "PKR" ? tour.priceUsd : tour.pricePkr;
  if (Number.isFinite(primary) && (primary as number) > 0) {
    return formatMoney(primary as number, currency);
  }
  if (Number.isFinite(secondary) && (secondary as number) > 0) {
    return formatMoney(secondary as number, other);
  }
  return null;
}

