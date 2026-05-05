import type { CurrencyCode } from "@/lib/money";

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

