/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { FieldHint, FieldLabel, SelectField, TextAreaField, TextInput } from "@/components/ui/FormField";
import { Button, ButtonLink } from "@/components/ui/Button";
import { isoDateRangeLabel } from "@/lib/dates";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";
import { PDFDownloadLink, PDFViewer, pdf } from "@react-pdf/renderer";
import { ItineraryPdf, type ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";
import { tiersToPackagesForPdf } from "@/lib/itineraryPackageMatrix";
import type { PackageStay, PackageTier } from "@/lib/itineraryPackageMatrix";

type Theme = "luxury" | "minimal" | "adventure";

type AtGlanceDay = {
  dayNumber: number;
  title: string;
  detail: string;
  overnight?: string;
};

type SimpleBuilderDraftSnapshot = {
  title: string;
  clientName: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  theme: Theme;
  headline: string;
  variantLabel: string;
  coverSubtitle: string;
  complianceLine: string;
  pickupDropoff: string;
  atGlanceDays: AtGlanceDay[];
  packageTiers: EditablePackageTier[];
  includedInput: string;
  notIncludedInput: string;
};

function isDefaultDayTitle(title: string, dayNumber: number) {
  const normalized = title.trim().toLowerCase().replace(/\s+/g, "");
  return normalized === `day${dayNumber}`;
}

const DEFAULT_LOGO_URL = "/images-removebg-preview.png";

const MAP_FALLBACK_IMAGES = [
  "hunza.jpg",
  "gilgit.jpg",
  "Khunerjab.jpg",
  "islamabad.jpg",
  "lahore.jpg",
  "karachi.jpg",
] as const;

function pickMapFallbackImage(input: string) {
  const v = input.toLowerCase();
  if (v.includes("hunza")) return "hunza.jpg";
  if (v.includes("gilgit")) return "gilgit.jpg";
  if (v.includes("khunjerab") || v.includes("khunerjab")) return "Khunerjab.jpg";
  if (v.includes("islamabad")) return "islamabad.jpg";
  if (v.includes("lahore")) return "lahore.jpg";
  if (v.includes("karachi")) return "karachi.jpg";
  return MAP_FALLBACK_IMAGES[0];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getSimpleBuilderStorageKey(itineraryId: string | null) {
  return itineraryId
    ? `jt:admin:itinerary-simple-builder:${itineraryId}`
    : "jt:admin:itinerary-simple-builder:unsaved";
}

function parseSimpleBuilderSnapshot(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<SimpleBuilderDraftSnapshot>;
  } catch {
    return null;
  }
}

function parseYmdLocal(ymd: string) {
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

function addDaysToYmd(ymd: string, offsetDays: number) {
  const d = parseYmdLocal(ymd);
  if (!d) return null;
  d.setDate(d.getDate() + offsetDays);
  return formatYmdLocal(d);
}

function syncAtGlanceToDayCount(
  prev: AtGlanceDay[],
  newDays: number,
): AtGlanceDay[] {
  const safe = clamp(newDays, 1, 60);
  const next = prev.slice(0, safe);
  while (next.length < safe) {
    next.push({ dayNumber: next.length + 1, title: "", detail: "" });
  }
  return next.map((row, i) => {
    const dayNumber = i + 1;
    return {
      ...row,
      dayNumber,
      title: isDefaultDayTitle(row.title, row.dayNumber) ? "" : row.title,
    };
  });
}

type ExistingItinerary = {
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
  layoutVariant?: "simple" | "advanced";
  atGlanceDays?: AtGlanceDay[];
  packageStayRows?: Array<{ location: string }>;
  packageTiers?: PackageTier[];
  coverImageStorageId?: Id<"_storage">;
  included?: string[];
  notIncluded?: string[];
  // Legacy fields (pre-simple-builder).
  dayPlans?: Array<{
    dayNumber: number;
    title: string;
    highlights?: string[];
    overnight?: string;
    morning: Array<{ title: string; description: string }>;
    afternoon: Array<{ title: string; description: string }>;
    evening: Array<{ title: string; description: string }>;
  }>;
  packages?: Array<{
    name: string;
    pricePkr?: number;
    vehicle?: string;
    note?: string;
    stays?: Array<{ location: string; hotel: string; nights: number }>;
  }>;
};

type EditablePackageTier = Omit<PackageTier, "stays" | "hotels"> & {
  stays: PackageStay[];
};

function normalizeTierStay(stay: Partial<PackageStay>, fallbackLocation: string): PackageStay {
  return {
    location: String(stay.location ?? fallbackLocation).trim() || fallbackLocation,
    hotel: String(stay.hotel ?? "").trim(),
    nights: Math.max(1, Math.floor(Number(stay.nights) || 1)),
  };
}

function normalizePackageTier(
  tier: NonNullable<ExistingItinerary["packageTiers"]>[number],
  fallbackRows?: Array<{ location: string }>,
): EditablePackageTier {
  const fallbackRowsSafe = fallbackRows ?? [];
  const explicitStays = (tier.stays ?? []).map((stay, idx) =>
    normalizeTierStay(stay, fallbackRowsSafe[idx]?.location ?? `Stop ${idx + 1}`),
  );

  const stays =
    explicitStays.length > 0
      ? explicitStays
      : ((tier as { hotels?: Array<{ hotel: string; nights: number }> }).hotels ?? []).map((hotel, idx) =>
          normalizeTierStay(
            { hotel: hotel.hotel, nights: hotel.nights },
            fallbackRowsSafe[idx]?.location ?? `Stop ${idx + 1}`,
          ),
        );

  return {
    name: String(tier.name ?? "").trim(),
    pricePkr: typeof tier.pricePkr === "number" ? tier.pricePkr : undefined,
    vehicle:
      typeof tier.vehicle === "string" && tier.vehicle.trim()
        ? tier.vehicle.trim()
        : undefined,
    note: typeof tier.note === "string" && tier.note.trim() ? tier.note.trim() : undefined,
    stays: stays.length > 0 ? stays : [{ location: "", hotel: "", nights: 1 }],
  };
}

function editablePackageTiersToPatchPayload(tiers: EditablePackageTier[]): PackageTier[] {
  return tiers.map((tier) => ({
    name: String(tier.name ?? "").trim(),
    pricePkr: typeof tier.pricePkr === "number" ? tier.pricePkr : undefined,
    vehicle:
      typeof tier.vehicle === "string" && tier.vehicle.trim()
        ? tier.vehicle.trim()
        : undefined,
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

function legacyDayPlansToAtGlance(
  dayPlans: NonNullable<ExistingItinerary["dayPlans"]>,
): AtGlanceDay[] {
  const sorted = [...dayPlans].sort((a, b) => a.dayNumber - b.dayNumber);
  return sorted.map((d, idx) => {
    const highlights = (d.highlights ?? []).map((s) => s.trim()).filter(Boolean);
    const slotTitles = [
      ...d.morning.map((s) => s.title),
      ...d.afternoon.map((s) => s.title),
      ...d.evening.map((s) => s.title),
    ]
      .map((s) => (s ?? "").trim())
      .filter(Boolean);

    const detail =
      highlights.length > 0
        ? highlights.join(" · ")
        : slotTitles.length > 0
          ? slotTitles.join(" · ")
          : "";

    return {
      dayNumber: idx + 1,
      title: String(d.title ?? "").trim(),
      detail,
      overnight:
        typeof d.overnight === "string" && d.overnight.trim()
          ? d.overnight.trim()
          : undefined,
    };
  });
}

function legacyPackagesToMatrix(
  packages: NonNullable<ExistingItinerary["packages"]>,
): { rows: Array<{ location: string }>; tiers: EditablePackageTier[] } {
  const locations: string[] = [];
  const ensureLocation = (locRaw: string) => {
    const loc = (locRaw ?? "").trim();
    if (!loc) return -1;
    const existingIdx = locations.findIndex(
      (x) => x.toLowerCase() === loc.toLowerCase(),
    );
    if (existingIdx >= 0) return existingIdx;
    locations.push(loc);
    return locations.length - 1;
  };

  for (const p of packages) {
    for (const s of p.stays ?? []) ensureLocation(s.location);
  }

  const rows = locations.map((location) => ({ location }));
  const tiers: EditablePackageTier[] = packages.map((p) => ({
    name: String(p.name ?? "").trim() || "Package",
    pricePkr: typeof p.pricePkr === "number" ? p.pricePkr : undefined,
    vehicle:
      typeof p.vehicle === "string" && p.vehicle.trim()
        ? p.vehicle.trim()
        : undefined,
    note: typeof p.note === "string" && p.note.trim() ? p.note.trim() : undefined,
    stays: (p.stays ?? []).map((s, idx) => ({
      location:
        String(s.location ?? rows[idx]?.location ?? `Stop ${idx + 1}`).trim() ||
        rows[idx]?.location ||
        `Stop ${idx + 1}`,
      hotel: String(s.hotel ?? "").trim(),
      nights: Math.max(1, Math.floor(Number(s.nights) || 1)),
    })),
  }));

  return { rows, tiers };
}

export function AdminItinerarySimpleBuilder({
  itineraryId: itineraryIdProp,
}: {
  itineraryId?: string;
}) {
  const router = useRouter();
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const minDate = useMemo(() => todayYmdLocal(), []);
  const defaultLogoUrlAbs = useMemo(() => toAbsoluteUrl(DEFAULT_LOGO_URL), []);

  const createDraft = useMutation(api.itineraries.createDraft);
  const patchDraft = useMutation(api.itineraries.patchDraft);
  const markFinal = useMutation(api.itineraries.markFinal);
  const generateUploadUrl = useMutation(api.media.generateItineraryImageUploadUrl);
  const addItineraryImageAsset = useMutation(api.media.addItineraryImageAsset);

  const [itineraryId, setItineraryId] = useState<Id<"itineraries"> | null>(
    itineraryIdProp ? (itineraryIdProp as Id<"itineraries">) : null,
  );

  const existing = useQuery(
    api.itineraries.getForAdmin,
    canMutate && itineraryId ? { sessionToken, itineraryId } : "skip",
  ) as ExistingItinerary | null | undefined;

  const adminSettings = useQuery(
    api.siteSettings.getAdminSiteSettings,
    canMutate ? { sessionToken } : "skip",
  );

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayCount, setDayCount] = useState(5);
  const [theme, setTheme] = useState<Theme>("luxury");
  const [headline, setHeadline] = useState("Your Dream Trip Awaits —");
  const [variantLabel, setVariantLabel] = useState("Customised");
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [coverStorageId, setCoverStorageId] = useState<Id<"_storage"> | null>(null);
  const [complianceLine, setComplianceLine] = useState(
    "JunketTours — Government Registered Tourism Company | DTS",
  );
  const [pickupDropoff, setPickupDropoff] = useState("");
  const [atGlanceDays, setAtGlanceDays] = useState<AtGlanceDay[]>([
    { dayNumber: 1, title: "", detail: "" },
  ]);
  const [packageTiers, setPackageTiers] = useState<EditablePackageTier[]>([
    {
      name: "Standard",
      pricePkr: undefined,
      vehicle: "",
      note: "",
      stays: [{ location: "", hotel: "", nights: 1 }],
    },
  ]);
  const [includedInput, setIncludedInput] = useState("");
  const [notIncludedInput, setNotIncludedInput] = useState("");

  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "pdf">("form");

  const hydratedKey = useRef<string | null>(null);
  const legacyMigratedKey = useRef<string | null>(null);
  const localDraftHydratedKey = useRef<string | null>(null);
  const localDraftJsonRef = useRef<string>("");

  const computedDaysFromDates = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T00:00:00`);
    if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) return null;
    const diff = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
    if (diff < 1) return null;
    return clamp(diff, 1, 60);
  }, [startDate, endDate]);

  const syncDatesToDayCount = useCallback(
    (targetDays: number) => {
      if (!startDate && !endDate) return;
      const baseStart = parseYmdLocal(startDate)
        ? startDate
        : parseYmdLocal(endDate)
          ? endDate
          : minDate;
      if (!startDate || startDate !== baseStart) {
        setStartDate(baseStart);
      }
      const nextEndDate = addDaysToYmd(baseStart, targetDays - 1);
      if (nextEndDate) {
        setEndDate(nextEndDate);
      }
    },
    [endDate, minDate, startDate],
  );

  const setDayCountAndSync = useCallback(
    (next: number) => {
      const safe = clamp(next, 1, 60);
      setDayCount(safe);
      setAtGlanceDays((prev) => syncAtGlanceToDayCount(prev, safe));
      if (startDate || endDate) {
        syncDatesToDayCount(safe);
      }
    },
    [syncDatesToDayCount, startDate, endDate],
  );

  useEffect(() => {
    if (!itineraryIdProp) return;
    setItineraryId(itineraryIdProp as Id<"itineraries">);
    hydratedKey.current = null;
  }, [itineraryIdProp]);

  useEffect(() => {
    if (!existing || !itineraryId) return;
    const key = String(itineraryId);
    if (hydratedKey.current === key) return;
    hydratedKey.current = key;

    setTitle(existing.title ?? "");
    setClientName(existing.clientName ?? "");
    setStartDate(existing.startDate ?? "");
    setEndDate(existing.endDate ?? "");
    setDayCount(clamp(existing.days ?? existing.atGlanceDays?.length ?? 5, 1, 60));
    setTheme(existing.theme ?? "luxury");
    setHeadline(existing.headline ?? "Your Dream Trip Awaits —");
    setVariantLabel(existing.variantLabel ?? "Customised");
    setCoverSubtitle(existing.coverSubtitle ?? "");
    setComplianceLine(
      existing.complianceLine ??
        "JunketTours — Government Registered Tourism Company | DTS",
    );
    setPickupDropoff(existing.pickupDropoff ?? "");
    setCoverStorageId(existing.coverImageStorageId ?? null);

    if (existing.atGlanceDays?.length) {
      setAtGlanceDays(
        syncAtGlanceToDayCount(
          existing.atGlanceDays.map((d) => ({
            dayNumber: d.dayNumber,
            title: d.title,
            detail: d.detail,
            overnight: d.overnight,
          })),
          existing.days ?? existing.atGlanceDays.length,
        ),
      );
    }

    if (existing.packageTiers?.length) {
      const fallbackRows = existing.packageStayRows ?? [];
      setPackageTiers(existing.packageTiers.map((tier) => normalizePackageTier(tier, fallbackRows)));
    }

    setIncludedInput((existing.included ?? []).join("\n"));
    setNotIncludedInput((existing.notIncluded ?? []).join("\n"));
  }, [existing, itineraryId]);

  useEffect(() => {
    if (!canMutate || !existing || !itineraryId) return;
    const key = String(itineraryId);
    if (legacyMigratedKey.current === key) return;

    const needsAtGlance =
      !existing.atGlanceDays || existing.atGlanceDays.length === 0;
    const needsMatrix = !existing.packageTiers || existing.packageTiers.length === 0;
    const hasLegacy =
      (existing.dayPlans && existing.dayPlans.length > 0) ||
      (existing.packages && existing.packages.length > 0);

    if (!hasLegacy) {
      legacyMigratedKey.current = key;
      return;
    }

    const patch: Record<string, unknown> = {};

    if (needsAtGlance && existing.dayPlans?.length) {
      const next = syncAtGlanceToDayCount(
        legacyDayPlansToAtGlance(existing.dayPlans),
        existing.days ?? existing.dayPlans.length,
      );
      setAtGlanceDays(next);
      patch.atGlanceDays = next;
    }

    if (needsMatrix && existing.packages?.length) {
      const { tiers } = legacyPackagesToMatrix(existing.packages);
      const safeTiers =
        tiers.length > 0
          ? tiers
          : [
              {
                name: "Standard",
                pricePkr: undefined,
                vehicle: "",
                note: "",
                stays: [{ location: "", hotel: "", nights: 1 }],
              },
            ];
      setPackageTiers(safeTiers);
      patch.packageTiers = editablePackageTiersToPatchPayload(safeTiers);
    }

    legacyMigratedKey.current = key;
    void patchDraft({
      sessionToken,
      itineraryId,
      ...(patch as unknown as Omit<Parameters<typeof patchDraft>[0], "sessionToken" | "itineraryId">),
    });
  }, [canMutate, existing, itineraryId, legacyMigratedKey, patchDraft, sessionToken]);

  useEffect(() => {
    if (!adminSettings || !itineraryId || !existing) return;
    const incEmpty = !(existing.included && existing.included.length);
    const excEmpty = !(existing.notIncluded && existing.notIncluded.length);
    if (incEmpty && adminSettings.defaultIncluded?.length) {
      setIncludedInput(adminSettings.defaultIncluded.join("\n"));
    }
    if (excEmpty && adminSettings.defaultNotIncluded?.length) {
      setNotIncludedInput(adminSettings.defaultNotIncluded.join("\n"));
    }
  }, [adminSettings, existing, itineraryId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = getSimpleBuilderStorageKey(itineraryId ? String(itineraryId) : null);
    if (localDraftHydratedKey.current === storageKey) return;

    const snapshot = parseSimpleBuilderSnapshot(window.localStorage.getItem(storageKey));
    if (!snapshot) {
      localDraftHydratedKey.current = storageKey;
      return;
    }

    localDraftHydratedKey.current = storageKey;

    if (typeof snapshot.title === "string") setTitle(snapshot.title);
    if (typeof snapshot.clientName === "string") setClientName(snapshot.clientName);
    if (typeof snapshot.startDate === "string") setStartDate(snapshot.startDate);
    if (typeof snapshot.endDate === "string") setEndDate(snapshot.endDate);
    if (typeof snapshot.dayCount === "number") {
      setDayCount(clamp(snapshot.dayCount, 1, 60));
    }
    if (snapshot.theme) setTheme(snapshot.theme);
    if (typeof snapshot.headline === "string") setHeadline(snapshot.headline);
    if (typeof snapshot.variantLabel === "string") setVariantLabel(snapshot.variantLabel);
    if (typeof snapshot.coverSubtitle === "string") setCoverSubtitle(snapshot.coverSubtitle);
    if (typeof snapshot.complianceLine === "string") setComplianceLine(snapshot.complianceLine);
    if (typeof snapshot.pickupDropoff === "string") setPickupDropoff(snapshot.pickupDropoff);
    if (Array.isArray(snapshot.atGlanceDays) && snapshot.atGlanceDays.length > 0) {
      setAtGlanceDays(snapshot.atGlanceDays);
    }
    if (Array.isArray(snapshot.packageTiers) && snapshot.packageTiers.length > 0) {
      const restoredTiers: EditablePackageTier[] = snapshot.packageTiers.map((tier) => ({
        name: String(tier.name ?? "").trim(),
        pricePkr: typeof tier.pricePkr === "number" ? tier.pricePkr : undefined,
        vehicle:
          typeof tier.vehicle === "string" && tier.vehicle.trim()
            ? tier.vehicle.trim()
            : undefined,
        note: typeof tier.note === "string" && tier.note.trim() ? tier.note.trim() : undefined,
        stays: tier.stays.map((stay, idx) => ({
          location:
            String(stay.location ?? `Stop ${idx + 1}`).trim() || `Stop ${idx + 1}`,
          hotel: String(stay.hotel ?? "").trim(),
          nights: Math.max(1, Math.floor(Number(stay.nights) || 1)),
        })),
      }));
      setPackageTiers(restoredTiers);
    }
    if (typeof snapshot.includedInput === "string") setIncludedInput(snapshot.includedInput);
    if (typeof snapshot.notIncludedInput === "string") setNotIncludedInput(snapshot.notIncludedInput);
  }, [itineraryId]);

  const saveTimer = useRef<number | null>(null);
  const lastPatchJson = useRef<string>("");

  const queuePatch = useCallback(
    (partial: Record<string, unknown> | null) => {
      if (!canMutate || !itineraryId || !partial) return;
      const payload = { sessionToken, itineraryId, ...partial };
      const json = JSON.stringify(payload);
      if (json === lastPatchJson.current) return;
      lastPatchJson.current = json;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      setSavingState("saving");
      saveTimer.current = window.setTimeout(() => {
        void (async () => {
          try {
            await patchDraft(payload as Parameters<typeof patchDraft>[0]);
            setSavingState("saved");
            setMsg(null);
          } catch (e) {
            setSavingState("error");
            setMsg(toUserFacingErrorMessage(e));
          }
        })();
      }, 350);
    },
    [canMutate, itineraryId, patchDraft, sessionToken],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const safeDays = clamp(dayCount, 1, 60);
  const nights = Math.max(0, safeDays - 1);
  const defaultHotelNights = Math.max(1, nights || 1);
  const mapFallback = pickMapFallbackImage(
    [title, pickupDropoff].filter(Boolean).join(" "),
  );

  // Keep the package matrix "Nights" default in sync with itinerary dates, but
  // only update cells that still match the previous auto-default.
  const lastAutoNights = useRef<number>(1);
  useEffect(() => {
    const prev = lastAutoNights.current;
    const next = defaultHotelNights;
    if (prev === next) return;
    lastAutoNights.current = next;
    setPackageTiers((prevTiers) =>
      prevTiers.map((tier) => ({
        ...tier,
        stays: tier.stays.map((stay) => ({
          ...stay,
          nights: stay.nights === prev ? next : stay.nights,
        })),
      })),
    );
  }, [defaultHotelNights]);

  // Resolve cover storage id to a URL for previewing/embedding
  const coverResolve = useQuery(
    api.media.resolveStorageIdsForAdmin,
    canMutate && coverStorageId ? { sessionToken, ids: [coverStorageId] } : "skip",
  ) as (string | null)[] | undefined;
  const coverUrlResolved = coverResolve?.[0] ?? undefined;
  let coverPreviewSrc = toAbsoluteUrl(`/maps/${mapFallback}`) ?? "";
  if (coverUrlResolved) {
    coverPreviewSrc = toAbsoluteUrl(coverUrlResolved) ?? coverPreviewSrc;
  }

  const pdfModel: ItineraryPdfModel = useMemo(() => {
    const included = includedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const notIncluded = notIncludedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const packages = tiersToPackagesForPdf([], packageTiers);

    const settings = adminSettings;
    const licence =
      (settings as { governmentLicenseNo?: string })?.governmentLicenseNo?.trim() ||
      "";
    const licence2 =
      (settings as { governmentLicenseNo2?: string })?.governmentLicenseNo2?.trim() ||
      "";

    return {
      layoutVariant: "simple",
      includeEmptySections: true,
      headline,
      variantLabel,
      tripTitle: title || "Trip Itinerary",
      coverSubtitle: coverSubtitle || undefined,
      clientName,
      dateRangeLabel: isoDateRangeLabel(startDate, endDate),
      nightsLabel: `${nights}-Night`,
      daysLabel: `${safeDays}-Day`,
      pickupDropoff: pickupDropoff || undefined,
      complianceLine: complianceLine || undefined,
      licenceNumber: licence || undefined,
      licenceNumber2: licence2 || undefined,
      companyName: "JunketTours",
      contact: {
        phone: settings?.whatsappPhone?.trim() || undefined,
        email: settings?.contactEmail?.trim() || undefined,
        website: (settings as { website?: string })?.website?.trim() || undefined,
        officeAddress: settings?.officeAddress?.trim() || undefined,
      },
      coverImageUrl: coverUrlResolved ? toAbsoluteUrl(coverUrlResolved) : toAbsoluteUrl(`/maps/${mapFallback}`),
      logoUrl: defaultLogoUrlAbs,
      atGlanceDays,
      dayPlans: [],
      included,
      notIncluded,
      packages,
      paymentTerms: settings?.paymentTerms ?? [],
      bankDetails: settings?.bankDetails,
      termsBlocks: settings?.termsBlocks ?? [],
    };
  }, [
    adminSettings,
    atGlanceDays,
    clientName,
    complianceLine,
    coverSubtitle,
    defaultLogoUrlAbs,
    headline,
    includedInput,
    mapFallback,
    nights,
    notIncludedInput,
    packageTiers,
    pickupDropoff,
    safeDays,
    startDate,
    endDate,
    title,
    variantLabel,
    coverUrlResolved,
  ]);
  

  async function uploadCoverImage(file: File) {
    if (!canMutate) throw new Error("Not authenticated");
    if (!itineraryId) throw new Error("Create the draft first.");
    const folderKey = `itineraries/${String(itineraryId)}`;
    const postUrl = await generateUploadUrl({ sessionToken, folderKey });
    const contentType = file.type || "application/octet-stream";
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = (await res.json()) as { storageId?: Id<"_storage"> };
    if (!data.storageId) throw new Error("No storageId returned");
    try {
      await addItineraryImageAsset({ sessionToken, itineraryId, folderKey, storageId: data.storageId });
    } catch (e) {
      console.warn("Failed to index itinerary image asset", e);
    }
    setCoverStorageId(data.storageId);
    try {
      await patchDraft({ sessionToken, itineraryId, coverImageStorageId: data.storageId });
    } catch (e) {
      console.warn("Failed to persist coverImageStorageId", e);
    }
  }

  const [previewModel, setPreviewModel] = useState<ItineraryPdfModel>(pdfModel);
  const previewTimer = useRef<number | null>(null);

  const localDraftSnapshot = useMemo<SimpleBuilderDraftSnapshot>(
    () => ({
      title,
      clientName,
      startDate,
      endDate,
      dayCount,
      theme,
      headline,
      variantLabel,
      coverSubtitle,
      complianceLine,
      pickupDropoff,
      atGlanceDays,
      packageTiers,
      includedInput,
      notIncludedInput,
    }),
    [
      title,
      clientName,
      startDate,
      endDate,
      dayCount,
      theme,
      headline,
      variantLabel,
      coverSubtitle,
      complianceLine,
      pickupDropoff,
      atGlanceDays,
      packageTiers,
      includedInput,
      notIncludedInput,
    ],
  );

  const localDraftStorageKey = useMemo(
    () => getSimpleBuilderStorageKey(itineraryId ? String(itineraryId) : null),
    [itineraryId],
  );

  useEffect(() => {
    const json = JSON.stringify(localDraftSnapshot);
    localDraftJsonRef.current = json;
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(localDraftStorageKey, json);
      } catch {
        // ignore storage failures
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [localDraftSnapshot, localDraftStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const flushSnapshot = () => {
      try {
        window.localStorage.setItem(localDraftStorageKey, localDraftJsonRef.current);
      } catch {
        // ignore storage failures
      }
    };

    window.addEventListener("pagehide", flushSnapshot);
    window.addEventListener("beforeunload", flushSnapshot);
    return () => {
      window.removeEventListener("pagehide", flushSnapshot);
      window.removeEventListener("beforeunload", flushSnapshot);
    };
  }, [localDraftStorageKey]);

  useEffect(() => {
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      setPreviewModel(pdfModel);
    }, 500);
    return () => {
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
    };
  }, [pdfModel]);

  useEffect(() => {
    if (!itineraryId) return;
    queuePatch({
      headline,
      variantLabel,
      coverSubtitle,
      coverImageStorageId: coverStorageId ?? null,
      complianceLine,
      pickupDropoff,
      title,
      clientName,
      startDate: startDate.trim() || undefined,
      endDate: endDate.trim() || undefined,
      days: safeDays,
      theme,
      atGlanceDays,
      packageTiers: editablePackageTiersToPatchPayload(packageTiers),
      included: includedInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      notIncluded: notIncludedInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }, [
    itineraryId,
    headline,
    variantLabel,
    coverSubtitle,
    coverStorageId,
    complianceLine,
    pickupDropoff,
    title,
    clientName,
    startDate,
    endDate,
    safeDays,
    theme,
    atGlanceDays,
    packageTiers,
    includedInput,
    notIncludedInput,
    queuePatch,
  ]);

  async function handleCreateDraft() {
    if (!canMutate) return;
    setCreatingDraft(true);
    setMsg(null);
    try {
      const id = await createDraft({
        sessionToken,
        title: title || "Untitled itinerary",
        clientName: clientName || "Client",
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
        days: safeDays,
        theme,
      });
      setItineraryId(id);
      router.replace(`/admin/itineraries/${id}`);
      await patchDraft({
        sessionToken,
        itineraryId: id,
        headline,
        variantLabel,
        coverSubtitle,
        complianceLine,
        pickupDropoff,
      });
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    } finally {
      setCreatingDraft(false);
    }
  }

  const primaryPrice =
    packageTiers[0]?.pricePkr != null ? packageTiers[0]!.pricePkr : null;

  async function copyWhatsappMessage() {
    const line1 = `Hi ${clientName?.trim() || ""}`.trim();
    const dateLine =
      startDate && endDate ? `Travel dates: ${startDate} → ${endDate}` : "";
    const titleLine = title?.trim() ? `Trip: ${title.trim()}` : "";
    const priceLine =
      primaryPrice != null
        ? `Starting from: PKR ${primaryPrice.toLocaleString()} (${packageTiers[0]?.name ?? "Package"})`
        : "";
    const text = [line1, titleLine, dateLine, priceLine].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied WhatsApp message.");
      window.setTimeout(() => setMsg(null), 2000);
    } catch {
      setMsg("Copy failed.");
    }
  }

  async function downloadPdfNow(model: ItineraryPdfModel) {
    const blob = await pdf(<ItineraryPdf model={model} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "itinerary").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  if (!canMutate) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading session…" : "Sign in required."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted">
          {itineraryId ? (
            <span>
              {savingState === "saving"
                ? "Saving…"
                : savingState === "saved"
                  ? "Saved"
                  : savingState === "error"
                    ? "Save error"
                    : ""}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/itinerary-template">
            <Button type="button" variant="secondary">
              Edit itinerary constants
            </Button>
          </Link>
          <Button type="button" variant="secondary" onClick={() => void copyWhatsappMessage()}>
            Copy WhatsApp blurb
          </Button>
          {itineraryId ? (
            <PDFDownloadLink
              document={<ItineraryPdf model={previewModel} />}
              fileName={`${(title || "itinerary").replace(/\s+/g, "-").toLowerCase()}.pdf`}
              className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Download PDF
            </PDFDownloadLink>
          ) : null}
          {itineraryId ? (
            <ButtonLink
              href={`/admin/itineraries/${itineraryId}/download-word`}
              variant="ghost"
              className="px-4 py-2"
            >
              Download Word
            </ButtonLink>
          ) : null}
        </div>
      </div>

      {msg ? (
        <div className="rounded-xl border border-border bg-panel-elevated p-3 text-sm">{msg}</div>
      ) : null}

      <div className="lg:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-panel-elevated p-2">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
              mobileTab === "form"
                ? "bg-brand-sun/18 text-foreground ring-1 ring-brand-sun/25"
                : "text-muted hover:bg-black/5 hover:text-foreground",
            )}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("pdf")}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
              mobileTab === "pdf"
                ? "bg-brand-sun/18 text-foreground ring-1 ring-brand-sun/25"
                : "text-muted hover:bg-black/5 hover:text-foreground",
            )}
          >
            PDF preview
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className={cn("space-y-6 pb-24", mobileTab !== "form" && "hidden lg:block")}>
          {!itineraryId ? (
            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <p className="text-sm font-semibold text-foreground">Start</p>
              <p className="mt-1 text-sm text-muted">
                Enter trip details, then create the draft. Everything autosaves after that.
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-panel-elevated p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Trip</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel required>Trip title</FieldLabel>
                <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel required>Client name</FieldLabel>
                <TextInput value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Start date (optional)</FieldLabel>
                <TextInput
                  type="date"
                  min={minDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>End date (optional)</FieldLabel>
                <TextInput
                  type="date"
                  min={startDate || minDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Number of days</FieldLabel>
                <TextInput
                  type="number"
                  min={1}
                  max={60}
                  value={safeDays}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    setDayCountAndSync(Math.floor(n));
                  }}
                />
                <FieldHint>
                  {computedDaysFromDates != null && computedDaysFromDates !== safeDays
                    ? `Date range spans ${computedDaysFromDates} days — day count is set independently.`
                    : "Leave dates blank to hide them on the PDF."}
                </FieldHint>
              </div>
              <div>
                <FieldLabel>Theme</FieldLabel>
                <SelectField value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
                  <option value="luxury">Luxury</option>
                  <option value="minimal">Minimal</option>
                  <option value="adventure">Adventure</option>
                </SelectField>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Pickup &amp; drop-off</FieldLabel>
                <TextInput
                  value={pickupDropoff}
                  onChange={(e) => setPickupDropoff(e.target.value)}
                  placeholder="Pickup & drop-off at Skardu Airport"
                />
              </div>
            </div>
            {!itineraryId ? (
              <div className="mt-4">
                <Button
                  type="button"
                  disabled={creatingDraft || !title.trim() || !clientName.trim()}
                  onClick={() => void handleCreateDraft()}
                >
                  {creatingDraft ? "Creating…" : "Create itinerary draft"}
                </Button>
              </div>
            ) : null}
          </div>

          {itineraryId ? (
            <>
              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Cover lines</p>
                <div className="mt-3 grid gap-3">
                  <div>
                    <FieldLabel>Headline</FieldLabel>
                    <TextInput value={headline} onChange={(e) => setHeadline(e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Variant label</FieldLabel>
                    <TextInput
                      value={variantLabel}
                      onChange={(e) => setVariantLabel(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Cover subtitle</FieldLabel>
                    <TextInput
                      value={coverSubtitle}
                      onChange={(e) => setCoverSubtitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Cover image</FieldLabel>
                    <div className="mt-2 flex items-center gap-3">
                      {coverStorageId ? (
                        <img
                          src={coverPreviewSrc}
                          alt="Cover preview"
                          className="h-16 w-28 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-16 w-28 rounded-md bg-panel flex items-center justify-center text-sm text-muted">
                          Map fallback
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          id="cover-upload"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setCreatingDraft(true);
                            try {
                              await uploadCoverImage(f);
                              setMsg("Cover image uploaded.");
                              window.setTimeout(() => setMsg(null), 2000);
                            } catch (err) {
                              setMsg(toUserFacingErrorMessage(err));
                            } finally {
                              setCreatingDraft(false);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                              onClick={async () => {
                            if (!itineraryId) return;
                            try {
                              await patchDraft({ sessionToken, itineraryId, coverImageStorageId: undefined });
                            } catch (e) {
                              console.warn(e);
                            }
                            setCoverStorageId(null);
                          }}
                        >
                          Use map fallback
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Compliance line</FieldLabel>
                    <TextAreaField
                      rows={2}
                      value={complianceLine}
                      onChange={(e) => setComplianceLine(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    Itinerary at a glance
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">{safeDays} days</span>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setDayCountAndSync(safeDays - 1)}
                      disabled={safeDays <= 1}
                    >
                      Remove Day
                    </Button>
                  </div>
                </div>
                <FieldHint>
                  {startDate || endDate
                    ? "If dates are set, changing day count updates the end date to match."
                    : "Add as many days as you need; dates are optional."}
                </FieldHint>
                <div className="mt-3 space-y-4">
                  {atGlanceDays.map((d, idx) => (
                    <div key={d.dayNumber} className="rounded-xl border border-border bg-panel p-3">
                      <p className="text-xs font-bold text-muted">Day {d.dayNumber}</p>
                      <div className="mt-2">
                        <FieldLabel>Title</FieldLabel>
                        <TextInput
                          value={d.title}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAtGlanceDays((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                            );
                          }}
                        />
                      </div>
                      <div className="mt-2">
                        <FieldLabel>Details</FieldLabel>
                        <TextAreaField
                          rows={3}
                          value={d.detail}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAtGlanceDays((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, detail: v } : x)),
                            );
                          }}
                        />
                      </div>
                      <div className="mt-2">
                        <FieldLabel>Overnight (optional)</FieldLabel>
                        <TextInput
                          value={d.overnight ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAtGlanceDays((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, overnight: v || undefined } : x,
                              ),
                            );
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDayCountAndSync(safeDays + 1)}
                    disabled={safeDays >= 60}
                  >
                    + Add Day
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Included / Not included
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Included (one per line)</FieldLabel>
                    <TextAreaField
                      rows={8}
                      value={includedInput}
                      onChange={(e) => setIncludedInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Not included (one per line)</FieldLabel>
                    <TextAreaField
                      rows={8}
                      value={notIncludedInput}
                      onChange={(e) => setNotIncludedInput(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Packages</p>
                </div>
                <div className="mt-4 space-y-6">
                  {packageTiers.map((tier, tIdx) => {
                    const stays = tier.stays;
                    return (
                      <div key={tIdx} className="rounded-xl border border-border bg-panel p-3">
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="min-w-[120px] flex-1">
                            <FieldLabel>Tier name</FieldLabel>
                            <TextInput
                              value={tier.name}
                              onChange={(e) => {
                                const v = e.target.value;
                                setPackageTiers((prev) =>
                                  prev.map((x, i) => (i === tIdx ? { ...x, name: v } : x)),
                                );
                              }}
                            />
                          </div>
                          <div className="w-28">
                            <FieldLabel>PKR</FieldLabel>
                            <TextInput
                              type="number"
                              min={0}
                              value={tier.pricePkr ?? ""}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                setPackageTiers((prev) =>
                                  prev.map((x, i) =>
                                    i === tIdx
                                      ? {
                                          ...x,
                                          pricePkr: Number.isFinite(n) ? n : undefined,
                                        }
                                      : x,
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="min-w-[100px] flex-1">
                            <FieldLabel>Vehicle (optional)</FieldLabel>
                            <TextInput
                              value={tier.vehicle ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setPackageTiers((prev) =>
                                  prev.map((x, i) => (i === tIdx ? { ...x, vehicle: v } : x)),
                                );
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setPackageTiers((prev) => {
                                const src = prev[tIdx];
                                if (!src) return prev;
                                const clone: EditablePackageTier = {
                                  name: src.name ? `${src.name} (copy)` : "",
                                  pricePkr: src.pricePkr,
                                  vehicle: src.vehicle,
                                  note: src.note,
                                  stays: src.stays.map((stay) => ({ ...stay })),
                                };
                                const next = [...prev];
                                next.splice(tIdx + 1, 0, clone);
                                return next;
                              });
                            }}
                          >
                            Duplicate tier
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="border-red-500/40 text-red-200 hover:border-red-400/60 hover:bg-red-500/10"
                            disabled={packageTiers.length <= 1}
                            onClick={() =>
                              setPackageTiers((prev) =>
                                prev.length <= 1 ? prev : prev.filter((_, i) => i !== tIdx),
                              )
                            }
                          >
                            Remove tier
                          </Button>
                        </div>

                        <div className="mt-3 space-y-3">
                          <div className="hidden md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_96px_28px] md:gap-2 md:text-xs md:font-bold md:uppercase md:tracking-wide md:text-muted">
                            <div>Location</div>
                            <div>Hotel</div>
                            <div>Nights</div>
                            <div />
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <FieldLabel className="text-xs uppercase tracking-wide text-muted">
                              Stay rows
                            </FieldLabel>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setPackageTiers((prev) =>
                                  prev.map((x, i) =>
                                    i === tIdx
                                      ? {
                                          ...x,
                                          stays: [
                                            ...x.stays,
                                            {
                                              location: "",
                                              hotel: "",
                                              nights: defaultHotelNights,
                                            },
                                          ],
                                        }
                                      : x,
                                  ),
                                );
                              }}
                            >
                              + Add row
                            </Button>
                          </div>

                          {stays.map((row, ri) => (
                            <div
                              key={ri}
                              className="rounded-xl border border-border/60 bg-panel p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0"
                            >
                              <div className="grid gap-2 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_96px_28px] md:items-start">
                                <div className="min-w-0">
                                  <p className="md:hidden text-[11px] font-bold uppercase tracking-wide text-muted">
                                    Location
                                  </p>
                                  <TextInput
                                    value={row.location}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setPackageTiers((prev) =>
                                        prev.map((x, i) => {
                                          if (i !== tIdx) return x;
                                          const nextStays = [...x.stays];
                                          nextStays[ri] = {
                                            location: v,
                                            hotel: nextStays[ri]?.hotel ?? "",
                                            nights: nextStays[ri]?.nights ?? 1,
                                          };
                                          return { ...x, stays: nextStays };
                                        }),
                                      );
                                    }}
                                    placeholder="e.g. Skardu"
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="md:hidden text-[11px] font-bold uppercase tracking-wide text-muted">
                                    Hotel
                                  </p>
                                  <TextInput
                                    value={row.hotel}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setPackageTiers((prev) =>
                                        prev.map((x, i) => {
                                          if (i !== tIdx) return x;
                                          const nextStays = [...x.stays];
                                          nextStays[ri] = {
                                            location: nextStays[ri]?.location ?? "",
                                            hotel: v,
                                            nights: nextStays[ri]?.nights ?? 1,
                                          };
                                          return { ...x, stays: nextStays };
                                        }),
                                      );
                                    }}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="md:hidden text-[11px] font-bold uppercase tracking-wide text-muted">
                                    Nights
                                  </p>
                                  <TextInput
                                    type="number"
                                    min={1}
                                    inputMode="numeric"
                                    value={row.nights}
                                    onChange={(e) => {
                                      const n = Number(e.target.value);
                                      setPackageTiers((prev) =>
                                        prev.map((x, i) => {
                                          if (i !== tIdx) return x;
                                          const nextStays = [...x.stays];
                                          nextStays[ri] = {
                                            location: nextStays[ri]?.location ?? "",
                                            hotel: nextStays[ri]?.hotel ?? "",
                                            nights: Math.max(1, n || 1),
                                          };
                                          return { ...x, stays: nextStays };
                                        }),
                                      );
                                    }}
                                  />
                                </div>

                                <div className="flex items-center justify-end">
                                  {stays.length > 1 ? (
                                    <button
                                      type="button"
                                      className="text-xs font-semibold text-red-600"
                                      onClick={() => {
                                        setPackageTiers((prev) =>
                                          prev.map((x, i) => {
                                            if (i !== tIdx) return x;
                                            return {
                                              ...x,
                                              stays: x.stays.filter((_, stayIdx) => stayIdx !== ri),
                                            };
                                          }),
                                        );
                                      }}
                                    >
                                      Remove
                                    </button>
                                  ) : (
                                    <span className="hidden md:block" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2">
                          <FieldLabel>Note (optional)</FieldLabel>
                          <TextInput
                            value={tier.note ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPackageTiers((prev) =>
                                prev.map((x, i) => (i === tIdx ? { ...x, note: v } : x)),
                              );
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setPackageTiers((prev) => [
                        ...prev,
                        {
                          name: "",
                          pricePkr: undefined,
                          vehicle: "",
                          note: "",
                          stays: [{ location: "", hotel: "", nights: defaultHotelNights }],
                        },
                      ]);
                    }}
                  >
                    + Add package tier
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  On every PDF (read-only)
                </p>
                <p className="mt-2 text-sm text-muted">
                  Payment terms, bank, and legal text come from{" "}
                  <Link href="/admin/itinerary-template" className="font-semibold underline">
                    Itinerary constants
                  </Link>
                  . Office &amp; license:{" "}
                  <Link href="/admin/settings" className="font-semibold underline">
                    Settings
                  </Link>
                  .
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={finishing}
                  onClick={() => {
                    if (!itineraryId) return;
                    void (async () => {
                      try {
                        setFinishing(true);
                        setMsg(null);
                        await markFinal({ sessionToken, itineraryId });
                        await downloadPdfNow(pdfModel);
                        router.push("/admin/itineraries");
                      } catch (e) {
                        setMsg(toUserFacingErrorMessage(e));
                      } finally {
                        setFinishing(false);
                      }
                    })();
                  }}
                >
                  {finishing ? "Finishing…" : "Finish (download + mark final)"}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <div className={cn("lg:sticky lg:top-24", mobileTab !== "pdf" && "hidden lg:block")}>
          <div className="rounded-2xl border border-border bg-panel-elevated p-2">
            <p className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-muted">
              Live PDF
            </p>
            <div className="h-[min(720px,75vh)] w-full overflow-hidden rounded-xl border border-border bg-white">
              <PDFViewer width="100%" height="100%" showToolbar className="border-0">
                <ItineraryPdf model={previewModel} />
              </PDFViewer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
