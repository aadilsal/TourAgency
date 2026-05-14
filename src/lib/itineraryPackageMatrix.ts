import type { ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";

export type PackageStayRow = { location: string };

export type PackageStay = {
  location: string;
  hotel: string;
  nights: number;
};

export type PackageTier = {
  name: string;
  pricePkr?: number;
  vehicle?: string;
  note?: string;
  stays?: PackageStay[];
  hotels?: Array<{ hotel: string; nights: number }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function alignHotelsToRows(tiers: PackageTier[], rowCount: number): PackageTier[] {
  return tiers.map((t) => {
    const stayCount = Math.max(rowCount, t.stays?.length ?? 0, t.hotels?.length ?? 0);
    const sourceStays = t.stays?.length
      ? t.stays
      : Array.from({ length: stayCount }, (_, i) => ({
          location: `Stop ${i + 1}`,
          hotel: t.hotels?.[i]?.hotel ?? "",
          nights: Math.max(1, t.hotels?.[i]?.nights ?? 1),
        }));

    const stays = Array.from({ length: stayCount }, (_, i) => ({
      location: sourceStays[i]?.location ?? `Stop ${i + 1}`,
      hotel: sourceStays[i]?.hotel ?? t.hotels?.[i]?.hotel ?? "",
      nights: Math.max(1, sourceStays[i]?.nights ?? t.hotels?.[i]?.nights ?? 1),
    }));

    return { ...t, stays };
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
    stays:
      (t.stays?.length
        ? t.stays
        : rows.map((r, i) => ({
            location: (r.location || `Stop ${i + 1}`).trim(),
            hotel: t.hotels?.[i]?.hotel ?? "",
            nights: clamp(Math.floor(t.hotels?.[i]?.nights ?? 1), 1, 365),
          }))
      ).map((stay, i) => ({
        location: (stay.location || rows[i]?.location || `Stop ${i + 1}`).trim(),
        hotel: stay.hotel ?? "",
        nights: clamp(Math.floor(stay.nights ?? 1), 1, 365),
      })),
  }));
}

// Ensures TS always treats this file as a module in all moduleDetection modes.
export {};
