import type { ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";

export type PackageStayRow = { location: string };

export type PackageTier = {
  name: string;
  pricePkr?: number;
  vehicle?: string;
  note?: string;
  hotels: Array<{ hotel: string; nights: number }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function alignHotelsToRows(tiers: PackageTier[], rowCount: number): PackageTier[] {
  return tiers.map((t) => {
    const hotels = Array.from({ length: rowCount }, (_, i) => ({
      hotel: t.hotels[i]?.hotel ?? "",
      nights: Math.max(1, t.hotels[i]?.nights ?? 1),
    }));
    return { ...t, hotels };
  });
}

export function tiersToPackagesForPdf(
  rows: PackageStayRow[],
  tiers: PackageTier[],
): NonNullable<ItineraryPdfModel["packages"]> {
  return tiers.map((t) => ({
    name: t.name,
    priceLabel:
      typeof t.pricePkr === "number" && Number.isFinite(t.pricePkr)
        ? `PKR ${t.pricePkr.toLocaleString()}`
        : "PKR —",
    vehicle: t.vehicle?.trim() || undefined,
    note: t.note?.trim() || undefined,
    stays: rows.map((r, i) => ({
      location: (r.location || `Stop ${i + 1}`).trim(),
      hotel: t.hotels[i]?.hotel ?? "",
      nights: clamp(Math.floor(t.hotels[i]?.nights ?? 1), 1, 365),
    })),
  }));
}
