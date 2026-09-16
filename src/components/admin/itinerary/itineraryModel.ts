/**
 * Single source of truth for itinerary editor/export helpers.
 *
 * The builder, the PDF download page and the Word download page all build the
 * same document from the same record — keep every mapping here so they can
 * never drift apart again (a drift made saved edits look "lost" in exports).
 */
import type { Id } from "@convex/_generated/dataModel";
import type { ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";
import { isoDateRangeLabel } from "@/lib/dates";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import {
  alignHotelsToRows,
  tiersToPackagesForPdf,
  type PackageStay,
  type PackageTier,
} from "@/lib/itineraryPackageMatrix";

export type Theme = "luxury" | "minimal" | "adventure";
export type ActivityIcon = "flight" | "hotel" | "food" | "sightseeing";

export type AtGlanceDay = {
  dayNumber: number;
  title: string;
  detail: string;
  overnight?: string;
};

export type LegacyActivity = { title: string; description: string; icon?: ActivityIcon };

export type LegacyDayPlan = {
  dayNumber: number;
  title: string;
  imageStorageId?: Id<"_storage">;
  highlights?: string[];
  overnight?: string;
  morning: LegacyActivity[];
  afternoon: LegacyActivity[];
  evening: LegacyActivity[];
};

export type LegacyPackage = {
  name: string;
  pricePkr?: number;
  vehicle?: string;
  note?: string;
  stays?: PackageStay[];
};

export type PaymentTerm = { percent: number; title: string; description?: string };
export type BankDetails = {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  instruction?: string;
};
export type TermsBlock = { title: string; body: string };

/** Every field an itinerary record can hold (current + legacy wizard fields). */
export type ItineraryRecord = {
  _id: Id<"itineraries">;
  headline?: string;
  variantLabel?: string;
  coverSubtitle?: string;
  complianceLine?: string;
  licenceNumber?: string;
  pickupDropoff?: string;
  title: string;
  clientName: string;
  startDate?: string;
  endDate?: string;
  days: number;
  theme: Theme;
  status: "draft" | "final";
  layoutVariant?: "simple" | "advanced";
  coverImageStorageId?: Id<"_storage">;
  logoStorageId?: Id<"_storage">;
  affiliationsStorageIds?: Id<"_storage">[];
  companyDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
  destinations?: string[];
  transportType?: string;
  accommodationType?: string;
  mealsIncluded?: string;
  atGlanceDays?: AtGlanceDay[];
  packageStayRows?: Array<{ location: string }>;
  packageTiers?: PackageTier[];
  dayPlans?: LegacyDayPlan[];
  accommodationDetails?: string;
  included?: string[];
  notIncluded?: string[];
  importantNotes?: string;
  packages?: LegacyPackage[];
  paymentTerms?: PaymentTerm[];
  bankDetails?: BankDetails;
  termsBlocks?: TermsBlock[];
  updatedAt?: number;
};

/** Site-wide constants the documents print (Settings + Itinerary constants). */
export type ItineraryDocumentSettings = {
  whatsappPhone?: string;
  contactEmail?: string;
  website?: string;
  officeAddress?: string;
  governmentLicenseNo?: string;
  governmentLicenseNo2?: string;
  paymentTerms?: PaymentTerm[];
  bankDetails?: BankDetails;
  termsBlocks?: TermsBlock[];
  defaultIncluded?: string[];
  defaultNotIncluded?: string[];
};

export type EditablePackageTier = Omit<PackageTier, "stays" | "hotels"> & {
  stays: PackageStay[];
};

export const DEFAULT_LOGO_URL = "/images-removebg-preview.png";
export const DEFAULT_HEADLINE = "Your Dream Trip Awaits —";
export const DEFAULT_VARIANT_LABEL = "Customised";
export const DEFAULT_COMPLIANCE_LINE =
  "JunketTours — Government Registered Tourism Company | DTS";
export const MAX_DAYS = 60;

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Textarea value -> list of non-empty trimmed lines. */
export function linesToList(input: string): string[] {
  return input
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function pickMapFallbackImage(input: string) {
  const v = input.toLowerCase();
  if (v.includes("hunza")) return "hunza.jpg";
  if (v.includes("gilgit")) return "gilgit.jpg";
  if (v.includes("khunjerab") || v.includes("khunerjab")) return "Khunerjab.jpg";
  if (v.includes("islamabad")) return "islamabad.jpg";
  if (v.includes("lahore")) return "lahore.jpg";
  if (v.includes("karachi")) return "karachi.jpg";
  return "hunza.jpg";
}

export function parseYmdLocal(ymd: string) {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

function formatYmdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysToYmd(ymd: string, offsetDays: number) {
  const d = parseYmdLocal(ymd);
  if (!d) return null;
  d.setDate(d.getDate() + offsetDays);
  return formatYmdLocal(d);
}

/** Inclusive day count between two YYYY-MM-DD dates, or null. */
export function daysBetween(startDate: string, endDate: string): number | null {
  const s = parseYmdLocal(startDate);
  const e = parseYmdLocal(endDate);
  if (!s || !e) return null;
  const diff = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
  return diff < 1 ? null : clamp(diff, 1, MAX_DAYS);
}

function isDefaultDayTitle(title: string, dayNumber: number) {
  return title.trim().toLowerCase().replace(/\s+/g, "") === `day${dayNumber}`;
}

/** Resizes the day list to `newDays`, never touching the content of kept days. */
export function syncAtGlanceToDayCount(prev: AtGlanceDay[], newDays: number): AtGlanceDay[] {
  const safe = clamp(newDays, 1, MAX_DAYS);
  const next = prev.slice(0, safe);
  while (next.length < safe) {
    next.push({ dayNumber: next.length + 1, title: "", detail: "" });
  }
  return next.map((row, i) => ({
    ...row,
    dayNumber: i + 1,
    title: isDefaultDayTitle(row.title, row.dayNumber) ? "" : row.title,
  }));
}

export function blankPackageTier(nights = 1, name = ""): EditablePackageTier {
  return {
    name,
    pricePkr: undefined,
    vehicle: "",
    note: "",
    stays: [{ location: "", hotel: "", nights: Math.max(1, nights) }],
  };
}

function normalizeTierStay(stay: Partial<PackageStay>, fallbackLocation: string): PackageStay {
  return {
    location: String(stay.location ?? fallbackLocation).trim() || fallbackLocation,
    hotel: String(stay.hotel ?? "").trim(),
    nights: Math.max(1, Math.floor(Number(stay.nights) || 1)),
  };
}

export function normalizePackageTier(
  tier: PackageTier,
  fallbackRows: Array<{ location: string }> = [],
): EditablePackageTier {
  const explicitStays = (tier.stays ?? []).map((stay, idx) =>
    normalizeTierStay(stay, fallbackRows[idx]?.location ?? `Stop ${idx + 1}`),
  );
  const stays =
    explicitStays.length > 0
      ? explicitStays
      : (tier.hotels ?? []).map((hotel, idx) =>
          normalizeTierStay(
            { hotel: hotel.hotel, nights: hotel.nights },
            fallbackRows[idx]?.location ?? `Stop ${idx + 1}`,
          ),
        );
  return {
    name: String(tier.name ?? "").trim(),
    pricePkr: typeof tier.pricePkr === "number" ? tier.pricePkr : undefined,
    vehicle: typeof tier.vehicle === "string" && tier.vehicle.trim() ? tier.vehicle.trim() : undefined,
    note: typeof tier.note === "string" && tier.note.trim() ? tier.note.trim() : undefined,
    stays: stays.length > 0 ? stays : [{ location: "", hotel: "", nights: 1 }],
  };
}

export function editablePackageTiersToPatchPayload(
  tiers: EditablePackageTier[],
): Array<PackageTier & { hotels: NonNullable<PackageTier["hotels"]> }> {
  return tiers.map((tier) => ({
    name: String(tier.name ?? "").trim(),
    pricePkr: typeof tier.pricePkr === "number" ? tier.pricePkr : undefined,
    vehicle: typeof tier.vehicle === "string" && tier.vehicle.trim() ? tier.vehicle.trim() : undefined,
    note: typeof tier.note === "string" && tier.note.trim() ? tier.note.trim() : undefined,
    stays: tier.stays.map((stay, idx) => ({
      location: String(stay.location ?? `Stop ${idx + 1}`).trim() || `Stop ${idx + 1}`,
      hotel: String(stay.hotel ?? "").trim(),
      nights: Math.max(1, Math.floor(Number(stay.nights) || 1)),
    })),
    hotels: tier.stays.map((stay) => ({
      hotel: String(stay.hotel ?? "").trim(),
      nights: Math.max(1, Math.floor(Number(stay.nights) || 1)),
    })),
  }));
}

const SLOT_LABELS = [
  ["morning", "Morning"],
  ["afternoon", "Afternoon"],
  ["evening", "Evening"],
] as const;

/**
 * Converts legacy wizard day plans into at-a-glance rows WITHOUT dropping text:
 * highlights plus every activity title and description are kept in `detail`.
 */
export function legacyDayPlansToAtGlance(dayPlans: LegacyDayPlan[]): AtGlanceDay[] {
  const sorted = [...dayPlans].sort((a, b) => a.dayNumber - b.dayNumber);
  return sorted.map((d, idx) => {
    const lines: string[] = [];
    const highlights = (d.highlights ?? []).map((s) => s.trim()).filter(Boolean);
    if (highlights.length) lines.push(highlights.join(" · "));
    for (const [key, label] of SLOT_LABELS) {
      for (const a of d[key] ?? []) {
        const title = (a.title ?? "").trim();
        const description = (a.description ?? "").trim();
        if (!title && !description) continue;
        lines.push(`${label}: ${[title, description].filter(Boolean).join(" — ")}`);
      }
    }
    return {
      dayNumber: idx + 1,
      title: String(d.title ?? "").trim(),
      detail: lines.join("\n"),
      overnight: typeof d.overnight === "string" && d.overnight.trim() ? d.overnight.trim() : undefined,
    };
  });
}

export function legacyPackagesToTiers(packages: LegacyPackage[]): EditablePackageTier[] {
  return packages.map((p) => ({
    name: String(p.name ?? "").trim() || "Package",
    pricePkr: typeof p.pricePkr === "number" ? p.pricePkr : undefined,
    vehicle: typeof p.vehicle === "string" && p.vehicle.trim() ? p.vehicle.trim() : undefined,
    note: typeof p.note === "string" && p.note.trim() ? p.note.trim() : undefined,
    stays: (p.stays ?? []).length
      ? (p.stays ?? []).map((s, idx) => normalizeTierStay(s, `Stop ${idx + 1}`))
      : [{ location: "", hotel: "", nights: 1 }],
  }));
}

/**
 * Whether the record is rendered with the simple (builder) layout. Anything
 * the builder has touched is simple, so exports always match what the admin
 * sees and edits in the builder.
 */
export function usesSimpleLayout(doc: Pick<ItineraryRecord, "layoutVariant" | "atGlanceDays" | "packageTiers">) {
  if (doc.layoutVariant === "simple") return true;
  return (doc.atGlanceDays?.length ?? 0) > 0 || (doc.packageTiers?.length ?? 0) > 0;
}

/** Storage ids a document export needs resolved to URLs. */
export function itineraryStorageIds(doc: ItineraryRecord): string[] {
  return [
    doc.coverImageStorageId,
    doc.logoStorageId,
    ...(doc.affiliationsStorageIds ?? []),
    ...(doc.dayPlans ?? []).map((d) => d.imageStorageId),
  ].filter(Boolean) as string[];
}

export type SimpleDocumentInput = {
  headline: string;
  variantLabel: string;
  title: string;
  coverSubtitle?: string;
  clientName: string;
  startDate?: string;
  endDate?: string;
  days: number;
  pickupDropoff?: string;
  complianceLine?: string;
  licenceNumber?: string;
  coverImageUrl: string | null;
  logoUrl: string | null;
  atGlanceDays: AtGlanceDay[];
  included: string[];
  notIncluded: string[];
  packageTiers: PackageTier[];
  packageStayRows?: Array<{ location: string }>;
};

/** Simple-layout document model — used by the live preview AND both exports. */
export function buildSimpleItineraryModel(
  input: SimpleDocumentInput,
  settings: ItineraryDocumentSettings | null | undefined,
): ItineraryPdfModel {
  const safeDays = clamp(Math.floor(input.days || 1), 1, MAX_DAYS);
  const nights = Math.max(0, safeDays - 1);
  const rows =
    input.packageStayRows && input.packageStayRows.length > 0
      ? input.packageStayRows
      : [{ location: "" }];
  const tiers = input.packageTiers.length ? alignHotelsToRows(input.packageTiers, rows.length) : [];
  return {
    layoutVariant: "simple",
    includeEmptySections: true,
    headline: input.headline,
    variantLabel: input.variantLabel,
    tripTitle: input.title || "Trip Itinerary",
    coverSubtitle: input.coverSubtitle || undefined,
    clientName: input.clientName ?? "",
    dateRangeLabel: isoDateRangeLabel(input.startDate, input.endDate),
    nightsLabel: `${nights}-Night`,
    daysLabel: `${safeDays}-Day`,
    pickupDropoff: input.pickupDropoff || undefined,
    complianceLine: input.complianceLine || undefined,
    licenceNumber:
      settings?.governmentLicenseNo?.trim() || input.licenceNumber?.trim() || undefined,
    licenceNumber2: settings?.governmentLicenseNo2?.trim() || undefined,
    companyName: "JunketTours",
    contact: {
      phone: settings?.whatsappPhone?.trim() || undefined,
      email: settings?.contactEmail?.trim() || undefined,
      website: settings?.website?.trim() || undefined,
      officeAddress: settings?.officeAddress?.trim() || undefined,
    },
    coverImageUrl: input.coverImageUrl,
    logoUrl: input.logoUrl,
    atGlanceDays: input.atGlanceDays,
    dayPlans: [],
    included: input.included,
    notIncluded: input.notIncluded,
    packages: tiers.length ? tiersToPackagesForPdf(rows, tiers) : [],
    paymentTerms: settings?.paymentTerms ?? [],
    bankDetails: settings?.bankDetails,
    termsBlocks: settings?.termsBlocks ?? [],
  };
}

/**
 * Builds the export model for a saved record. Returns null while something it
 * needs (settings, image URLs) is still loading, so exports never silently
 * omit content.
 */
export function buildItineraryDocumentModel(
  doc: ItineraryRecord,
  opts: {
    adminSettings: ItineraryDocumentSettings | null | undefined;
    publicSettings: ItineraryDocumentSettings | null | undefined;
    urlFor: (storageId: string) => string | null;
  },
): ItineraryPdfModel | null {
  const safeDays = Math.max(1, doc.days || 1);
  const nights = Math.max(0, safeDays - 1);
  const mapFallback = pickMapFallbackImage([doc.title, doc.pickupDropoff].filter(Boolean).join(" "));
  const coverImageUrl =
    (doc.coverImageStorageId ? toAbsoluteUrl(opts.urlFor(String(doc.coverImageStorageId))) : null) ??
    toAbsoluteUrl(`/maps/${mapFallback}`);
  const logoUrl =
    (doc.logoStorageId ? toAbsoluteUrl(opts.urlFor(String(doc.logoStorageId))) : null) ??
    toAbsoluteUrl(DEFAULT_LOGO_URL);

  if (usesSimpleLayout(doc)) {
    if (!opts.adminSettings) return null;
    return buildSimpleItineraryModel(
      {
        headline: doc.headline ?? DEFAULT_HEADLINE,
        variantLabel: doc.variantLabel ?? DEFAULT_VARIANT_LABEL,
        title: doc.title,
        coverSubtitle: doc.coverSubtitle,
        clientName: doc.clientName,
        startDate: doc.startDate,
        endDate: doc.endDate,
        days: doc.days,
        pickupDropoff: doc.pickupDropoff,
        complianceLine: doc.complianceLine,
        licenceNumber: doc.licenceNumber,
        coverImageUrl,
        logoUrl,
        atGlanceDays: doc.atGlanceDays ?? [],
        included: doc.included ?? [],
        notIncluded: doc.notIncluded ?? [],
        packageTiers: doc.packageTiers ?? [],
        packageStayRows: doc.packageStayRows,
      },
      opts.adminSettings,
    );
  }

  const pub = opts.publicSettings;
  return {
    layoutVariant: "advanced",
    headline: doc.headline ?? DEFAULT_HEADLINE,
    variantLabel: doc.variantLabel ?? DEFAULT_VARIANT_LABEL,
    tripTitle: doc.title,
    coverSubtitle: doc.coverSubtitle || undefined,
    clientName: doc.clientName ?? "",
    dateRangeLabel: isoDateRangeLabel(doc.startDate, doc.endDate),
    nightsLabel: `${nights}-Night`,
    daysLabel: `${safeDays}-Day`,
    pickupDropoff: doc.pickupDropoff || undefined,
    complianceLine: doc.complianceLine || undefined,
    licenceNumber: doc.licenceNumber?.trim() || pub?.governmentLicenseNo?.trim() || undefined,
    licenceNumber2: pub?.governmentLicenseNo2?.trim() || undefined,
    contact: {
      phone: doc.contactPhone,
      email: doc.contactEmail,
      website: doc.contactWebsite,
      officeAddress: pub?.officeAddress?.trim() || undefined,
    },
    coverImageUrl,
    logoUrl,
    dayPlans: (doc.dayPlans ?? []).map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title,
      imageUrl: d.imageStorageId ? toAbsoluteUrl(opts.urlFor(String(d.imageStorageId))) : null,
      highlights: d.highlights ?? [],
      overnight: d.overnight ?? undefined,
      morning: (d.morning ?? []).map((a) => ({ title: a.title, description: a.description })),
      afternoon: (d.afternoon ?? []).map((a) => ({ title: a.title, description: a.description })),
      evening: (d.evening ?? []).map((a) => ({ title: a.title, description: a.description })),
    })),
    included: doc.included ?? [],
    notIncluded: doc.notIncluded ?? [],
    packages: (doc.packages ?? []).map((p) => ({
      name: p.name,
      priceLabel: p.pricePkr != null ? `PKR ${p.pricePkr.toLocaleString()}` : "PKR —",
      vehicle: p.vehicle?.trim() || undefined,
      stays: (p.stays ?? []).map((s) => ({ location: s.location, hotel: s.hotel, nights: s.nights })),
      note: p.note?.trim() || undefined,
    })),
    paymentTerms: doc.paymentTerms ?? [],
    bankDetails: doc.bankDetails,
    termsBlocks: doc.termsBlocks ?? [],
  };
}

/** File name used for downloads. */
export function itineraryFileName(title: string, ext: "pdf" | "docx") {
  return `${(title || "itinerary").trim().replace(/\s+/g, "-").toLowerCase()}.${ext}`;
}
