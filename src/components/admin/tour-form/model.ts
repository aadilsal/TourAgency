import type { Doc, Id } from "@convex/_generated/dataModel";
import { parseTourType } from "@/lib/tour-filters";
import type { TourPdfImportDraft } from "@/lib/tourPdf/types";

/**
 * Pure state model for the admin tour editor. Everything that decides WHAT gets
 * saved lives here (no React), so the rules are reusable and easy to reason about:
 *
 * - `TourFormValues` is the whole editable form as one object.
 * - `toServerFields` converts it to the exact shape the backend stores.
 * - `buildUpdatePatch` sends ONLY fields that differ from what was loaded, with
 *   `null` to clear optional fields — so a save can never overwrite fields the
 *   admin didn't touch (e.g. review-driven ratings or another admin's edits).
 * - `rebaseFormValues` merges "my edits" onto a newer server version.
 */

export type NumberInput = number | "";

/** One editable "price per head for N persons" row. `""` = left blank. */
export type PerHeadRow = {
  persons: NumberInput;
  priceUsd: NumberInput;
  pricePkr: NumberInput;
};

export type ItineraryDay = Doc<"tours">["itinerary"][number];

export type TourFormValues = {
  title: string;
  slug: string;
  description: string;
  /** Kept as raw strings so unknown/legacy type values survive a save. */
  types: string[];
  destinationIds: Id<"destinations">[];
  provinceIds: Id<"provinces">[];
  durationDays: number;
  location: string;
  maxPeople: NumberInput;
  minAge: NumberInput;
  tourTypeLabel: string;
  pricePkr: NumberInput;
  priceUsd: NumberInput;
  perHeadRows: PerHeadRow[];
  ratingAvg: NumberInput;
  reviewsCount: NumberInput;
  office: string;
  email: string;
  imageRefs: string[];
  itinerary: ItineraryDay[];
  highlightsInput: string;
  includedInput: string;
  excludedInput: string;
  timeSlotsInput: string;
  ticketGroupsInput: string;
  isActive: boolean;
};

export type TourFormPatch = (
  update: Partial<TourFormValues> | ((prev: TourFormValues) => Partial<TourFormValues>),
) => void;

export const PENDING_IMAGE_PREFIX = "__pending_";

export const emptyPerHeadRow: PerHeadRow = { persons: "", priceUsd: "", pricePkr: "" };

export const defaultItinerary: ItineraryDay[] = [
  {
    day: 0,
    title: "Day 0",
    description: "Update itinerary details in the editor.",
  },
];

const DEFAULT_TIME_SLOTS = "08:00\n10:00\n12:00";
const DEFAULT_TICKET_GROUPS = "Adult (18+)\nYouth (13-17)\nChildren (0-12)";

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function toNumberInput(n: number | undefined | null): NumberInput {
  return typeof n === "number" ? n : "";
}

function formatTicketGroups(groups: Array<{ label: string; ageRange?: string }>): string {
  return groups
    .map((g) => (g.ageRange ? `${g.label} (${g.ageRange})` : String(g.label)))
    .filter((x) => x.trim().length > 0)
    .join("\n");
}

export function emptyTourForm(): TourFormValues {
  return {
    title: "",
    slug: "",
    description: "",
    types: [],
    destinationIds: [],
    provinceIds: [],
    durationDays: 5,
    location: "Gilgit-Baltistan",
    maxPeople: "",
    minAge: "",
    tourTypeLabel: "",
    pricePkr: "",
    priceUsd: "",
    perHeadRows: [],
    ratingAvg: "",
    reviewsCount: "",
    office: "",
    email: "",
    imageRefs: [],
    itinerary: [...defaultItinerary],
    highlightsInput:
      "Discover scenic viewpoints\nLocal culture & food\nComfortable private transport",
    includedInput:
      "24/7 Expert assistance\nProfessional driver\nFuel & tolls\nHotel pickup & drop off",
    excludedInput: "Flights\nPersonal expenses\nTips",
    timeSlotsInput: DEFAULT_TIME_SLOTS,
    ticketGroupsInput: DEFAULT_TICKET_GROUPS,
    isActive: true,
  };
}

/** Form values for an existing tour. Never invents values for missing fields. */
export function tourDocToForm(t: Doc<"tours">): TourFormValues {
  return {
    title: t.title,
    slug: t.slug,
    description: t.description,
    types: Array.isArray(t.types) ? [...t.types] : [],
    destinationIds: [
      ...(Array.isArray(t.destinationIds) ? t.destinationIds : []),
      ...(t.destinationId ? [t.destinationId] : []),
    ].filter((id, index, all) => all.indexOf(id) === index),
    provinceIds: Array.isArray(t.provinceIds) ? [...t.provinceIds] : [],
    durationDays: t.durationDays,
    location: t.location,
    maxPeople: toNumberInput(t.maxPeople),
    minAge: toNumberInput(t.minAge),
    tourTypeLabel: typeof t.tourTypeLabel === "string" ? t.tourTypeLabel : "",
    pricePkr: toNumberInput(t.pricePkr),
    priceUsd: toNumberInput(t.priceUsd),
    perHeadRows: (Array.isArray(t.perHeadPrices) ? t.perHeadPrices : []).map((r) => ({
      persons: toNumberInput(r.persons),
      priceUsd: toNumberInput(r.priceUsd),
      pricePkr: toNumberInput(r.pricePkr),
    })),
    ratingAvg: toNumberInput(t.ratingAvg),
    reviewsCount: toNumberInput(t.reviewsCount),
    office: t.office ?? "",
    email: t.email ?? "",
    imageRefs: [...t.images],
    itinerary: t.itinerary.length ? t.itinerary.map((d) => ({ ...d })) : [...defaultItinerary],
    highlightsInput: Array.isArray(t.highlights) ? t.highlights.join("\n") : "",
    includedInput: Array.isArray(t.included) ? t.included.join("\n") : "",
    excludedInput: Array.isArray(t.excluded) ? t.excluded.join("\n") : "",
    timeSlotsInput: Array.isArray(t.timeSlots) ? t.timeSlots.join("\n") : "",
    ticketGroupsInput: Array.isArray(t.ticketGroups) ? formatTicketGroups(t.ticketGroups) : "",
    isActive: t.isActive,
  };
}

/** Form values pre-filled from a PDF/Word import (create mode). */
export function pdfDraftToForm(
  draft: TourPdfImportDraft,
  destinations: ReadonlyArray<{ _id: Id<"destinations">; slug: string }>,
  provinces: ReadonlyArray<{ _id: Id<"provinces">; slug: string }>,
): TourFormValues {
  return {
    ...emptyTourForm(),
    title: draft.title,
    slug: draft.slug,
    description: draft.description,
    types: draft.types
      .map((t) => parseTourType(t))
      .filter((t): t is NonNullable<typeof t> => t !== null),
    destinationIds: draft.destinationSlugs
      .map((s) => destinations.find((d) => d.slug === s)?._id)
      .filter((id): id is Id<"destinations"> => Boolean(id)),
    provinceIds: draft.provinceSlugs
      .map((s) => provinces.find((p) => p.slug === s)?._id)
      .filter((id): id is Id<"provinces"> => Boolean(id)),
    durationDays: draft.durationDays,
    location: draft.location,
    maxPeople: toNumberInput(draft.maxPeople),
    minAge: toNumberInput(draft.minAge),
    tourTypeLabel: draft.tourTypeLabel ?? "Heritage & Culture tours",
    pricePkr: toNumberInput(draft.pricePkr),
    priceUsd: toNumberInput(draft.priceUsd),
    itinerary: draft.itinerary.length ? draft.itinerary : [...defaultItinerary],
    highlightsInput: draft.highlights.join("\n"),
    includedInput: draft.included.join("\n"),
    excludedInput: draft.excluded.join("\n"),
    timeSlotsInput:
      Array.isArray(draft.timeSlots) && draft.timeSlots.length > 0
        ? draft.timeSlots.join("\n")
        : DEFAULT_TIME_SLOTS,
    ticketGroupsInput:
      Array.isArray(draft.ticketGroups) && draft.ticketGroups.length > 0
        ? formatTicketGroups(draft.ticketGroups)
        : DEFAULT_TICKET_GROUPS,
    isActive: false,
  };
}

function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Drop rows the admin left incomplete: a row only publishes when it has a
 * group size and at least one currency amount.
 */
export function toPerHeadPrices(rows: PerHeadRow[]) {
  return rows
    .filter(
      (r) =>
        typeof r.persons === "number" &&
        r.persons > 0 &&
        (typeof r.priceUsd === "number" || typeof r.pricePkr === "number"),
    )
    .map((r) => ({
      persons: r.persons as number,
      priceUsd: typeof r.priceUsd === "number" ? r.priceUsd : undefined,
      pricePkr: typeof r.pricePkr === "number" ? r.pricePkr : undefined,
    }))
    .sort((a, b) => a.persons - b.persons);
}

const numOrNull = (n: NumberInput) => (n === "" ? null : n);
const textOrNull = (s: string) => s.trim() || null;

/** The backend representation of the form. `null` = field cleared. */
export function toServerFields(values: TourFormValues) {
  const destinationIds = Array.from(new Set(values.destinationIds));
  return {
    title: values.title.trim(),
    slug: slugify(values.slug || values.title),
    description: values.description,
    types: values.types,
    destinationIds,
    destinationId: destinationIds[0] ?? null,
    provinceIds: Array.from(new Set(values.provinceIds)),
    durationDays: values.durationDays,
    location: values.location,
    pricePkr: numOrNull(values.pricePkr),
    priceUsd: numOrNull(values.priceUsd),
    perHeadPrices: toPerHeadPrices(values.perHeadRows),
    maxPeople: numOrNull(values.maxPeople),
    minAge: numOrNull(values.minAge),
    tourTypeLabel: textOrNull(values.tourTypeLabel),
    ratingAvg: numOrNull(values.ratingAvg),
    reviewsCount: numOrNull(values.reviewsCount),
    office: textOrNull(values.office),
    email: textOrNull(values.email),
    images: values.imageRefs.filter((r) => Boolean(r) && !r.startsWith(PENDING_IMAGE_PREFIX)),
    itinerary: values.itinerary
      .map((d, i) => ({
        day: typeof d.day === "number" && Number.isFinite(d.day) ? d.day : i + 1,
        title: d.title.trim(),
        description: d.description.trim(),
      }))
      .filter((d) => d.title || d.description),
    highlights: parseLines(values.highlightsInput),
    included: parseLines(values.includedInput),
    excluded: parseLines(values.excludedInput),
    timeSlots: parseLines(values.timeSlotsInput),
    ticketGroups: parseLines(values.ticketGroupsInput).map((line) => {
      const m = line.match(/^(.*?)(?:\s*\((.+)\))?$/);
      const label = (m?.[1] ?? line).trim();
      const ageRange = (m?.[2] ?? "").trim() || undefined;
      return ageRange ? { label, ageRange } : { label };
    }),
    isActive: values.isActive,
  };
}

export type TourServerFields = ReturnType<typeof toServerFields>;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Only the fields that changed since `baseline` was loaded. */
export function buildUpdatePatch(
  values: TourFormValues,
  baseline: TourFormValues,
): Partial<TourServerFields> {
  const next = toServerFields(values);
  const prev = toServerFields(baseline);
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(next) as Array<keyof TourServerFields>) {
    if (!same(next[key], prev[key])) patch[key] = next[key];
  }
  // The legacy single destination always travels with the list it mirrors.
  if ("destinationIds" in patch) patch.destinationId = next.destinationId;
  else delete patch.destinationId;
  return patch as Partial<TourServerFields>;
}

/** Create-mutation args (`undefined` instead of `null` for empty optionals). */
export function buildCreateArgs(values: TourFormValues) {
  const f = toServerFields(values);
  const orUndef = <T,>(v: T | null) => (v === null ? undefined : v);
  return {
    ...f,
    destinationId: orUndef(f.destinationId),
    pricePkr: orUndef(f.pricePkr),
    priceUsd: orUndef(f.priceUsd),
    maxPeople: orUndef(f.maxPeople),
    minAge: orUndef(f.minAge),
    tourTypeLabel: orUndef(f.tourTypeLabel),
    ratingAvg: orUndef(f.ratingAvg),
    reviewsCount: orUndef(f.reviewsCount),
    office: orUndef(f.office),
    email: orUndef(f.email),
  };
}

export function formValuesEqual(a: TourFormValues, b: TourFormValues): boolean {
  return same(a, b);
}

/** Drops upload placeholders (e.g. from a backup taken mid-upload). */
export function withoutPendingImages(values: TourFormValues): TourFormValues {
  return {
    ...values,
    imageRefs: values.imageRefs.filter((r) => !r.startsWith(PENDING_IMAGE_PREFIX)),
  };
}

const FIELD_LABELS: Record<keyof TourFormValues, string> = {
  title: "Title",
  slug: "Slug",
  description: "Description",
  types: "Tour types",
  destinationIds: "Destinations",
  provinceIds: "Provinces",
  durationDays: "Duration",
  location: "Location",
  maxPeople: "Max people",
  minAge: "Min age",
  tourTypeLabel: "Tour type label",
  pricePkr: "Price (PKR)",
  priceUsd: "Price (USD)",
  perHeadRows: "Per head prices",
  ratingAvg: "Rating avg",
  reviewsCount: "Reviews count",
  office: "Office",
  email: "Email",
  imageRefs: "Images",
  itinerary: "Itinerary",
  highlightsInput: "Highlights",
  includedInput: "Included",
  excludedInput: "Not included",
  timeSlotsInput: "Time slots",
  ticketGroupsInput: "Ticket groups",
  isActive: "Active",
};

/**
 * Merge my unsaved edits onto a newer server version: fields I changed keep my
 * value, everything else takes the server's latest. `overlaps` lists fields
 * both sides changed (mine wins) so the UI can point them out.
 */
export function rebaseFormValues(
  mine: TourFormValues,
  myBaseline: TourFormValues,
  latest: TourFormValues,
): { values: TourFormValues; overlaps: string[] } {
  const values = { ...latest };
  const overlaps: string[] = [];
  for (const key of Object.keys(FIELD_LABELS) as Array<keyof TourFormValues>) {
    const iChanged = !same(mine[key], myBaseline[key]);
    if (!iChanged) continue;
    (values as Record<string, unknown>)[key] = mine[key];
    if (!same(latest[key], myBaseline[key]) && !same(latest[key], mine[key])) {
      overlaps.push(FIELD_LABELS[key]);
    }
  }
  return { values, overlaps };
}
