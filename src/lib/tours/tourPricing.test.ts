import { describe, expect, test } from "vitest";
import { formatMoney } from "@/lib/money";
import {
  formatTourPrice,
  formatTourPriceSummary,
  getPerHeadOptions,
  getTourUnitPrice,
  getTourUnitPricing,
  tourHasBothCurrencies,
} from "@/lib/tours/tourPricing";

describe("USD/PKR switch only for tours priced in both currencies", () => {
  test("single-currency tours get no switch", () => {
    expect(tourHasBothCurrencies({ price: 0, priceUsd: 1870 })).toBe(false);
    expect(tourHasBothCurrencies({ price: 0, pricePkr: 98000 })).toBe(false);
    expect(tourHasBothCurrencies({ price: 50000 })).toBe(false); // legacy PKR only
  });

  test("total price in both currencies gets the switch", () => {
    expect(tourHasBothCurrencies({ price: 0, priceUsd: 500, pricePkr: 140000 })).toBe(true);
  });

  test("per-head rates count too", () => {
    expect(
      tourHasBothCurrencies({
        price: 0,
        priceUsd: 1870,
        perHeadPrices: [{ persons: 2, pricePkr: 250000 }],
      }),
    ).toBe(true);
  });
});

// Shape of the live tours today: USD only, no PKR price.
const usdOnly = { price: 0, priceUsd: 1870 };
const both = { price: 0, priceUsd: 500, pricePkr: 140000 };
const pkrOnly = { price: 0, pricePkr: 98000 };

describe("display falls back to USD when no PKR price is set", () => {
  test("PKR visitor sees the dollar price, not a PKR label on a USD amount", () => {
    expect(formatTourPrice(usdOnly, "PKR")).toBe(formatMoney(1870, "USD"));
    expect(formatTourPriceSummary(usdOnly, "PKR")).toBe(formatMoney(1870, "USD"));
  });

  test("each currency shows its own price when both are set", () => {
    expect(formatTourPrice(both, "PKR")).toBe(formatMoney(140000, "PKR"));
    expect(formatTourPrice(both, "USD")).toBe(formatMoney(500, "USD"));
  });

  test("USD visitor falls back to PKR when only PKR is set", () => {
    expect(formatTourPrice(pkrOnly, "USD")).toBe(formatMoney(98000, "PKR"));
  });
});

describe("booking price is recorded in the currency it is actually in", () => {
  test("USD-only tour booked by a PKR visitor is recorded as USD", () => {
    // Regression: this used to return 1870 with the caller labelling it PKR.
    expect(getTourUnitPricing(usdOnly, "PKR", 1)).toEqual({ amount: 1870, currency: "USD" });
  });

  test("whole-tour total is split across the group", () => {
    expect(getTourUnitPricing(usdOnly, "USD", 2)).toEqual({ amount: 935, currency: "USD" });
  });

  test("PKR visitor gets the PKR price when one exists", () => {
    expect(getTourUnitPricing(both, "PKR", 1)).toEqual({ amount: 140000, currency: "PKR" });
  });

  test("legacy PKR-only `price` still books in PKR", () => {
    expect(getTourUnitPricing({ price: 50000 }, "PKR", 2)).toEqual({
      amount: 25000,
      currency: "PKR",
    });
  });

  test("unpriced tour has no unit price", () => {
    expect(getTourUnitPricing({ price: 0 }, "PKR", 2)).toBeNull();
    expect(getTourUnitPrice({ price: 0 }, "USD", 2)).toBe(0);
  });
});

describe("per-head rates carry their real currency", () => {
  const tour = {
    price: 0,
    perHeadPrices: [
      { persons: 1, priceUsd: 900 },
      { persons: 4, priceUsd: 600 },
    ],
  };

  test("USD-only per-head rates stay USD for a PKR visitor", () => {
    const opts = getPerHeadOptions(tour, "PKR");
    expect(opts.map((o) => o.currency)).toEqual(["USD", "USD"]);
    expect(opts[0]!.label).toBe(formatMoney(900, "USD"));
  });

  test("group size picks the matching tier, in its own currency", () => {
    expect(getTourUnitPricing(tour, "PKR", 5)).toEqual({ amount: 600, currency: "USD" });
    expect(getTourUnitPricing(tour, "PKR", 2)).toEqual({ amount: 900, currency: "USD" });
  });
});
