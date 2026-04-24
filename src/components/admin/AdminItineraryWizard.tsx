/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { WizardLayout } from "@/components/admin/WizardLayout";
import {
  FieldHint,
  FieldLabel,
  SelectField,
  TextAreaField,
  TextInput,
} from "@/components/ui/FormField";
import { Button, buttonClass } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PopoverMenu } from "@/components/ui/PopoverMenu";
import { isoDateRangeLabel } from "@/lib/dates";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { ItineraryPdf, type ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";

type Theme = "luxury" | "minimal" | "adventure";
type ActivityIcon = "flight" | "hotel" | "food" | "sightseeing";

const DEFAULT_LOGO_URL = "/images-removebg-preview.png";

type TripPreset = {
  key: string;
  label: string;
  defaults: Partial<{
    title: string;
    destinations: string[];
    pickupDropoff: string;
    transportType: string;
    accommodationType: string;
    mealsIncluded: string;
    days: number;
  }>;
};

type PackagePreset = {
  key: string;
  label: string;
  packages: NonNullable<ItineraryDoc["packages"]>;
};

const CUSTOM_TRIP_PRESETS_KEY = "jt:customTripPresets:v1";
const CUSTOM_PACKAGE_PRESETS_KEY = "jt:customPackagePresets:v1";

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

const TRIP_PRESETS: TripPreset[] = [
  {
    key: "generic",
    label: "Generic trip (fast)",
    defaults: {
      title: "Custom Trip",
      pickupDropoff: "Pickup & drop included.",
      transportType: "4x4",
      accommodationType: "3-star",
      mealsIncluded: "Breakfast",
      days: 5,
      destinations: [],
    },
  },
  {
    key: "hunza-5d",
    label: "Hunza (5D/4N) starter",
    defaults: {
      title: "Hunza Trip",
      pickupDropoff: "Pickup & drop included.",
      transportType: "4x4",
      accommodationType: "3-star",
      mealsIncluded: "Breakfast",
      days: 5,
      destinations: ["Hunza", "Attabad", "Passu"],
    },
  },
  {
    key: "skardu-7d",
    label: "Skardu (7D/6N) starter",
    defaults: {
      title: "Skardu Trip",
      pickupDropoff: "Pickup & drop included.",
      transportType: "4x4",
      accommodationType: "3-star",
      mealsIncluded: "Breakfast",
      days: 7,
      destinations: ["Skardu", "Shigar", "Khaplu"],
    },
  },
];

const PACKAGE_PRESETS: PackagePreset[] = [
  {
    key: "none",
    label: "No preset (start empty)",
    packages: [],
  },
  {
    key: "3-tiers",
    label: "3 tiers (Standard / Deluxe / Platinum)",
    packages: [
      {
        name: "Standard",
        pricePkr: undefined,
        vehicle: "Sedan",
        note: "",
        stays: [
          { location: "Destination 1", hotel: "", nights: 2 },
          { location: "Destination 2", hotel: "", nights: 2 },
        ],
      },
      {
        name: "Deluxe",
        pricePkr: undefined,
        vehicle: "Prado",
        note: "",
        stays: [
          { location: "Destination 1", hotel: "", nights: 2 },
          { location: "Destination 2", hotel: "", nights: 2 },
        ],
      },
      {
        name: "Platinum",
        pricePkr: undefined,
        vehicle: "Land Cruiser",
        note: "",
        stays: [
          { location: "Destination 1", hotel: "", nights: 2 },
          { location: "Destination 2", hotel: "", nights: 2 },
        ],
      },
    ],
  },
  {
    key: "standard-only",
    label: "One package (Standard only)",
    packages: [
      {
        name: "Standard",
        pricePkr: undefined,
        vehicle: "Sedan",
        note: "",
        stays: [
          { location: "Destination 1", hotel: "", nights: 2 },
          { location: "Destination 2", hotel: "", nights: 2 },
        ],
      },
    ],
  },
];

type ItineraryDoc = {
  _id: Id<"itineraries">;
  headline: string;
  variantLabel: string;
  coverSubtitle: string;
  complianceLine: string;
  licenceNumber: string;
  pickupDropoff: string;
  title: string;
  clientName: string;
  startDate: string;
  endDate: string;
  days: number;
  theme: Theme;
  status: "draft" | "final";
  coverImageStorageId?: Id<"_storage">;
  companyDescription?: string;
  logoStorageId?: Id<"_storage">;
  affiliationsStorageIds?: Id<"_storage">[];
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
  destinations?: string[];
  transportType?: string;
  accommodationType?: string;
  mealsIncluded?: string;
  dayPlans?: Array<{
    dayNumber: number;
    title: string;
    imageStorageId?: Id<"_storage">;
    highlights?: string[];
    overnight?: string;
    morning: Array<{ title: string; description: string; icon: ActivityIcon }>;
    afternoon: Array<{ title: string; description: string; icon: ActivityIcon }>;
    evening: Array<{ title: string; description: string; icon: ActivityIcon }>;
  }>;
  accommodationDetails?: string;
  included?: string[];
  notIncluded?: string[];
  importantNotes?: string;
  packages?: Array<{
    name: string;
    pricePkr?: number;
    vehicle?: string;
    note?: string;
    stays?: Array<{ location: string; hotel: string; nights: number }>;
  }>;
  paymentTerms?: Array<{ percent: number; title: string; description?: string }>;
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    instruction?: string;
  };
  termsBlocks?: Array<{ title: string; body: string }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function emptyActivity(): { title: string; description: string; icon: ActivityIcon } {
  return { title: "", description: "", icon: "sightseeing" };
}

function emptyDay(dayNumber: number) {
  return {
    dayNumber,
    title: `Day ${dayNumber}`,
    highlights: [],
    overnight: "",
    morning: [emptyActivity()],
    afternoon: [emptyActivity()],
    evening: [emptyActivity()],
  } as NonNullable<ItineraryDoc["dayPlans"]>[number];
}

export function AdminItineraryWizard({
  itineraryId: itineraryIdProp,
}: {
  itineraryId?: string;
}) {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const minDate = useMemo(() => todayYmdLocal(), []);
  const publicSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const defaultLogoUrlAbs = useMemo(() => toAbsoluteUrl(DEFAULT_LOGO_URL), []);

  const createDraft = useMutation(api.itineraries.createDraft);
  const patchDraft = useMutation(api.itineraries.patchDraft);
  const markFinal = useMutation(api.itineraries.markFinal);
  const exportDocx = useAction(api.documentsActions.exportItineraryDocx);
  const generateUploadUrl = useMutation(api.media.generateItineraryImageUploadUrl);
  const addItineraryImageAsset = useMutation(api.media.addItineraryImageAsset);
  const resolveUrls = useQuery(
    api.media.resolveStorageIdsForAdmin,
    "skip",
  );
  void resolveUrls;

  const [quickMode, setQuickMode] = useState(true);

  const flows = useMemo(() => {
    const quick = {
      ids: ["basic", "daysQuick", "packages", "export"] as const,
      labels: ["Trip details", "Day-by-day (short)", "Packages & hotels", "Preview & send"],
    };
    const advanced = {
      ids: ["basic", "brand", "overview", "days", "details", "export"] as const,
      labels: ["Trip details", "Branding", "Overview", "Day plan", "Packages & terms", "Preview & send"],
    };
    return quickMode ? quick : advanced;
  }, [quickMode]);

  const [step, setStep] = useState(1);
  const activeStepId = flows.ids[clamp(step - 1, 0, flows.ids.length - 1)];
  const [itineraryId, setItineraryId] = useState<Id<"itineraries"> | null>(
    itineraryIdProp ? (itineraryIdProp as Id<"itineraries">) : null,
  );

  // Step 1
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(5);
  const [theme, setTheme] = useState<Theme>("luxury");
  const [coverStorageId, setCoverStorageId] = useState<Id<"_storage"> | null>(null);
  const [tripPresetKey, setTripPresetKey] = useState("");
  const [packagePresetKey, setPackagePresetKey] = useState("");
  const [customTripPresets, setCustomTripPresets] = useState<TripPreset[]>([]);
  const [customPackagePresets, setCustomPackagePresets] = useState<PackagePreset[]>([]);
  const [tripPresetModalOpen, setTripPresetModalOpen] = useState(false);
  const [packagePresetModalOpen, setPackagePresetModalOpen] = useState(false);
  const [newTripPresetName, setNewTripPresetName] = useState("");
  const [newPackagePresetName, setNewPackagePresetName] = useState("");

  const computedDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T00:00:00`);
    if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) return null;
    const diff = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : null;
  }, [startDate, endDate]);

  // Step 2
  const [headline, setHeadline] = useState("Your Dream Trip Awaits —");
  const [variantLabel, setVariantLabel] = useState("Built by Junket Tours");
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [pickupDropoff, setPickupDropoff] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");
  const [complianceLine, setComplianceLine] = useState(
    "JunketTours — Government Registered Tourism Company | DTS",
  );

  const [companyDescription, setCompanyDescription] = useState("");
  const [logoStorageId, setLogoStorageId] = useState<Id<"_storage"> | null>(null);
  const [affiliations, setAffiliations] = useState<Id<"_storage">[]>([]);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWebsite, setContactWebsite] = useState("");

  // Step 3
  const [destinationsInput, setDestinationsInput] = useState("");
  const [transportType, setTransportType] = useState("4x4");
  const [accommodationType, setAccommodationType] = useState("3-star");
  const [mealsIncluded, setMealsIncluded] = useState("Breakfast");

  // Step 4
  const [dayPlans, setDayPlans] = useState<NonNullable<ItineraryDoc["dayPlans"]>>([
    emptyDay(1),
  ]);

  // Step 5
  const [accommodationDetails, setAccommodationDetails] = useState("");
  const [includedInput, setIncludedInput] = useState("");
  const [notIncludedInput, setNotIncludedInput] = useState("");
  const [importantNotes, setImportantNotes] = useState("");

  const [packages, setPackages] = useState<NonNullable<ItineraryDoc["packages"]>>([]);
  const [bulkHotelFind, setBulkHotelFind] = useState("");
  const [bulkHotelReplace, setBulkHotelReplace] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<
    NonNullable<ItineraryDoc["paymentTerms"]>
  >([
    { percent: 50, title: "On Registration", description: "Advance payment at time of booking" },
    { percent: 30, title: "Before Tour", description: "Due before trip commencement" },
    { percent: 20, title: "Cash to Driver", description: "Payable on trip day" },
  ]);
  const [bankDetails, setBankDetails] = useState<NonNullable<ItineraryDoc["bankDetails"]>>({
    bankName: "Bank Alfalah",
    accountTitle: "Junket Tours",
    accountNumber: "",
    iban: "",
    instruction: "",
  });
  const [termsBlocks, setTermsBlocks] = useState<
    NonNullable<ItineraryDoc["termsBlocks"]>
  >([
    {
      title: "ID Requirements",
      body: "Pakistani nationals must carry valid CNIC. Foreign nationals must carry passport + visa.",
    },
    {
      title: "Code of Conduct",
      body: "Guests must maintain respectful behaviour. Misconduct may result in termination of services without refund.",
    },
    {
      title: "Plan Alterations",
      body: "Itinerary may change due to weather, road closures, or other situations. Safety and comfort come first.",
    },
    {
      title: "Liability Disclaimer",
      body: "The company is not liable for losses or delays arising from factors beyond its control. Travel insurance is recommended.",
    },
    {
      title: "Prohibited Items",
      body: "Weapons, firearms, explosives, hazardous materials, and illegal substances are strictly prohibited.",
    },
  ]);

  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOM_TRIP_PRESETS_KEY);
      if (raw) setCustomTripPresets(JSON.parse(raw) as TripPreset[]);
    } catch {
      // ignore
    }
    try {
      const raw = window.localStorage.getItem(CUSTOM_PACKAGE_PRESETS_KEY);
      if (raw) setCustomPackagePresets(JSON.parse(raw) as PackagePreset[]);
    } catch {
      // ignore
    }
  }, []);

  function persistCustomTripPresets(next: TripPreset[]) {
    setCustomTripPresets(next);
    try {
      window.localStorage.setItem(CUSTOM_TRIP_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function persistCustomPackagePresets(next: PackagePreset[]) {
    setCustomPackagePresets(next);
    try {
      window.localStorage.setItem(CUSTOM_PACKAGE_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function applyTripPreset(key: string) {
    const preset = [...TRIP_PRESETS, ...customTripPresets].find((p) => p.key === key);
    if (!preset) return;
    const d = preset.defaults;
    if (d.title) setTitle((prev) => (prev.trim() ? prev : d.title || ""));
    if (typeof d.days === "number") setDays(d.days);
    if (d.pickupDropoff)
      setPickupDropoff((prev) => (prev.trim() ? prev : d.pickupDropoff || ""));
    if (d.transportType) setTransportType(d.transportType);
    if (d.accommodationType) setAccommodationType(d.accommodationType);
    if (d.mealsIncluded) setMealsIncluded(d.mealsIncluded);
    if (d.destinations) setDestinationsInput(d.destinations.join(", "));
  }

  function applyPackagePreset(key: string) {
    const preset = [...PACKAGE_PRESETS, ...customPackagePresets].find((p) => p.key === key);
    if (!preset) return;
    setPackages(preset.packages);
    queuePatch({ packages: preset.packages });
  }
  const [highlightsInputByDay, setHighlightsInputByDay] = useState<Record<number, string>>(
    {},
  );

  const existing = useQuery(
    api.itineraries.getForAdmin,
    canMutate && itineraryId ? { sessionToken, itineraryId } : "skip",
  ) as ItineraryDoc | null | undefined;

  const folderKey = useMemo(() => {
    return itineraryId ? `itineraries/${itineraryId}` : null;
  }, [itineraryId]);

  const existingAssets = useQuery(
    api.media.listItineraryImageAssetsForAdmin,
    canMutate && itineraryId ? { sessionToken, itineraryId } : "skip",
  ) as
    | Array<{ storageId: Id<"_storage">; url: string | null; createdAt: number }>
    | undefined;

  useEffect(() => {
    if (!publicSettings) return;
    setContactPhone((p) => (p.trim() ? p : publicSettings.whatsappPhone?.trim() || ""));
    setContactEmail((p) => (p.trim() ? p : publicSettings.contactEmail?.trim() || ""));
    setContactWebsite((p) => (p.trim() ? p : (publicSettings as { website?: string }).website?.trim() || ""));
    setLicenceNumber((p) =>
      p.trim()
        ? p
        : (publicSettings as { governmentLicenseNo?: string }).governmentLicenseNo?.trim() || "",
    );
  }, [publicSettings]);

  useEffect(() => {
    if (!computedDays) return;
    const safe = clamp(computedDays, 1, 60);
    setDays(safe);
    setDayPlans((prev) => {
      const out = [...prev];
      if (out.length > safe) out.length = safe;
      while (out.length < safe) out.push(emptyDay(out.length + 1));
      const normalized = out.map((d, i) => ({ ...d, dayNumber: i + 1, title: d.title || `Day ${i + 1}` }));
      if (itineraryId) queuePatch({ days: safe, dayPlans: normalized });
      return normalized;
    });
  }, [computedDays, itineraryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveTimer = useRef<number | null>(null);
  const lastPatchJson = useRef<string>("");

  function queuePatch(
    partial:
      | Omit<Parameters<typeof patchDraft>[0], "sessionToken" | "itineraryId">
      | null,
  ) {
    if (!canMutate || !itineraryId || !partial) return;
    const payload = { sessionToken, itineraryId, ...partial } as const;
    const json = JSON.stringify(payload);
    if (json === lastPatchJson.current) return;
    lastPatchJson.current = json;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSavingState("saving");
    saveTimer.current = window.setTimeout(() => {
      void (async () => {
        try {
          await patchDraft(payload);
          setSavingState("saved");
          setMsg(null);
        } catch (e) {
          setSavingState("error");
          setMsg(toUserFacingErrorMessage(e));
        }
      })();
    }, 350);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  async function uploadOne(file: File): Promise<Id<"_storage">> {
    if (!canMutate) throw new Error("Not authenticated");
    if (!itineraryId || !folderKey) throw new Error("Create the draft first.");
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
    // Don't block the user if indexing fails; the upload itself succeeded.
    try {
      await addItineraryImageAsset({
        sessionToken,
        itineraryId,
        folderKey,
        storageId: data.storageId,
      });
    } catch (e) {
      console.warn("Failed to index itinerary image asset", e);
    }
    return data.storageId;
  }

  const pdfStorageIds = useMemo(() => {
    const ids: string[] = [];
    if (coverStorageId) ids.push(coverStorageId);
    if (logoStorageId) ids.push(logoStorageId);
    for (const id of affiliations) ids.push(id);
    if (!quickMode) {
      for (const d of dayPlans) {
        if (d.imageStorageId) ids.push(d.imageStorageId);
      }
    }
    return ids;
  }, [coverStorageId, logoStorageId, affiliations, dayPlans, quickMode]);

  const pdfUrls = useQuery(
    api.media.resolveStorageIdsForAdmin,
    canMutate && pdfStorageIds.length > 0 ? { sessionToken, ids: pdfStorageIds } : "skip",
  ) as (string | null)[] | undefined;

  const idToUrl = useMemo(() => {
    const m = new Map<string, string | null>();
    for (let i = 0; i < pdfStorageIds.length; i++) {
      m.set(pdfStorageIds[i]!, pdfUrls?.[i] ?? null);
    }
    return m;
  }, [pdfStorageIds, pdfUrls]);

  const pdfRenderKey = useMemo(() => {
    const urls = (pdfUrls ?? []).map((u) => u ?? "").join("|");
    return `${pdfStorageIds.join(",")}::${urls}`;
  }, [pdfStorageIds, pdfUrls]);

  const pdfHasUnresolvedImages = useMemo(() => {
    if (pdfStorageIds.length === 0) return false;
    if (!pdfUrls) return true;
    for (const u of pdfUrls) {
      if (u === null) return true;
    }
    return false;
  }, [pdfStorageIds.length, pdfUrls]);

  const pdfModel: ItineraryPdfModel = useMemo(() => {
    const included = includedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const notIncluded = notIncludedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const safeDays = clamp(computedDays ?? days, 1, 60);
    const nights = Math.max(0, safeDays - 1);
    const mapFallback = pickMapFallbackImage(
      [title, destinationsInput, pickupDropoff].filter(Boolean).join(" "),
    );
    return {
      includeEmptySections: !quickMode,
      headline,
      variantLabel,
      tripTitle: title || "Trip Itinerary",
      coverSubtitle: coverSubtitle || undefined,
      clientName: clientName,
      dateRangeLabel: isoDateRangeLabel(startDate, endDate),
      nightsLabel: `${nights}-Night`,
      daysLabel: `${safeDays}-Day`,
      pickupDropoff: pickupDropoff || undefined,
      complianceLine: complianceLine || undefined,
      licenceNumber: licenceNumber || undefined,
      companyName: "JunketTours",
      contact: {
        phone: contactPhone || undefined,
        email: contactEmail || undefined,
        website: contactWebsite || undefined,
        officeAddress: publicSettings?.officeAddress?.trim() || undefined,
      },
      coverImageUrl: coverStorageId
        ? (toAbsoluteUrl(idToUrl.get(coverStorageId)) ?? null)
        : toAbsoluteUrl(`/maps/${mapFallback}`),
      logoUrl: logoStorageId
        ? (toAbsoluteUrl(idToUrl.get(logoStorageId)) ?? null)
        : defaultLogoUrlAbs,
      dayPlans: (dayPlans ?? []).map((d) => {
        const rawHighlights =
          (highlightsInputByDay[d.dayNumber] ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean) ?? [];
        const highlights = quickMode ? rawHighlights.slice(0, 4) : (d.highlights ?? []);
        return {
          dayNumber: d.dayNumber,
          title: d.title,
          imageUrl: d.imageStorageId
            ? (toAbsoluteUrl(idToUrl.get(String(d.imageStorageId)) ?? null) ?? null)
            : toAbsoluteUrl(`/maps/${mapFallback}`),
          highlights,
          overnight: d.overnight ?? undefined,
          // Quick mode: keep it short (no detailed slots on PDF).
          morning: quickMode ? [] : (d.morning ?? []).map((a) => ({ title: a.title, description: a.description })),
          afternoon: quickMode ? [] : (d.afternoon ?? []).map((a) => ({ title: a.title, description: a.description })),
          evening: quickMode ? [] : (d.evening ?? []).map((a) => ({ title: a.title, description: a.description })),
        };
      }),
      included: quickMode ? [] : included,
      notIncluded: quickMode ? [] : notIncluded,
      packages: (packages ?? []).map((p) => ({
        name: p.name,
        priceLabel: p.pricePkr ? `PKR ${p.pricePkr.toLocaleString()}` : "PKR —",
        vehicle: p.vehicle?.trim() || undefined,
        stays: (p.stays ?? []).map((s) => ({
          location: s.location,
          hotel: s.hotel,
          nights: s.nights,
        })),
        note: p.note?.trim() || undefined,
      })),
      paymentTerms: quickMode ? [] : paymentTerms,
      bankDetails: quickMode ? undefined : bankDetails,
      termsBlocks: quickMode ? [] : termsBlocks,
    };
  }, [
    quickMode,
    headline,
    variantLabel,
    title,
    coverSubtitle,
    clientName,
    startDate,
    endDate,
    coverStorageId,
    computedDays,
    days,
    pickupDropoff,
    complianceLine,
    licenceNumber,
    contactPhone,
    contactEmail,
    contactWebsite,
    publicSettings?.officeAddress,
    logoStorageId,
    dayPlans,
    includedInput,
    notIncludedInput,
    destinationsInput,
    highlightsInputByDay,
    packages,
    paymentTerms,
    bankDetails,
    termsBlocks,
    idToUrl,
    defaultLogoUrlAbs,
  ]);

  const primaryPackage = useMemo(() => {
    const p = (packages ?? [])[0];
    if (!p) return null;
    const name = p.name?.trim() || "Package";
    const price = typeof p.pricePkr === "number" ? p.pricePkr : null;
    return { name, price };
  }, [packages]);

  async function copyWhatsappMessage() {
    const line1 = `Hi ${clientName?.trim() || ""}`.trim();
    const dateLine =
      startDate && endDate ? `Travel dates: ${startDate} → ${endDate}` : "";
    const titleLine = title?.trim() ? `Trip: ${title.trim()}` : "";
    const priceLine =
      primaryPackage?.price != null
        ? `Starting from: PKR ${primaryPackage.price.toLocaleString()} (${primaryPackage.name})`
        : "";
    const lines = [line1, titleLine, dateLine, priceLine].filter(Boolean);
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("Copied WhatsApp message.");
      window.setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg("Copy failed — your browser may block clipboard access.");
      window.setTimeout(() => setCopyMsg(null), 2500);
    }
  }

  function buildWhatsappText() {
    const line1 = `Hi ${clientName?.trim() || ""}`.trim();
    const dateLine = startDate && endDate ? `Travel dates: ${startDate} → ${endDate}` : "";
    const titleLine = title?.trim() ? `Trip: ${title.trim()}` : "";
    const priceLine =
      primaryPackage?.price != null
        ? `Starting from: PKR ${primaryPackage.price.toLocaleString()} (${primaryPackage.name})`
        : "";
    return [line1, titleLine, dateLine, priceLine].filter(Boolean).join("\n");
  }

  async function onCreateDraft() {
    if (!canMutate) return;
    if (!clientName.trim()) {
      setMsg("Enter client name to continue.");
      return;
    }
    if (creatingDraft) return;
    setMsg(null);
    setCreatingDraft(true);
    try {
      const id = await createDraft({
        sessionToken,
        title: title || "Untitled itinerary",
        clientName,
        startDate: startDate || new Date().toISOString().slice(0, 10),
        endDate: endDate || new Date().toISOString().slice(0, 10),
        days: clamp(computedDays ?? days, 1, 60),
        theme,
      });
      setItineraryId(id);
      await patchDraft({
        sessionToken,
        itineraryId: id,
        headline,
        variantLabel,
        coverSubtitle,
        complianceLine,
        licenceNumber,
        pickupDropoff,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        contactWebsite: contactWebsite || undefined,
        packages,
        paymentTerms,
        bankDetails,
        termsBlocks,
      });
      setStep(2);
      setSavingState("saved");
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    } finally {
      setCreatingDraft(false);
    }
  }

  function next() {
    if (step === 1) {
      void onCreateDraft();
      return;
    }
    if (step === flows.ids.length) {
      if (!itineraryId) return;
      void (async () => {
        try {
          await markFinal({ sessionToken: sessionToken as string, itineraryId });
        } finally {
          window.dispatchEvent(new Event("jt:routing:start"));
          window.location.href = "/admin/itineraries";
        }
      })();
      return;
    }
    setStep((s) => clamp(s + 1, 1, flows.ids.length));
  }

  function back() {
    setStep((s) => clamp(s - 1, 1, flows.ids.length));
  }

  useEffect(() => {
    if (!existing) return;
    // Keep local state stable after initial create; don't aggressively overwrite.
  }, [existing]);

  const rightActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {/* Mobile: show BOTH options, no hidden menu */}
      <div className="flex items-center gap-1 rounded-full border border-border bg-panel-elevated p-1 sm:hidden">
        <button
          type="button"
          className={[
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            quickMode
              ? "bg-brand-cta text-white shadow-sm"
              : "text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
          ].join(" ")}
          onClick={() => {
            setQuickMode(true);
            setStep(1);
          }}
        >
          Quick
        </button>
        <button
          type="button"
          className={[
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            !quickMode
              ? "bg-brand-cta text-white shadow-sm"
              : "text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
          ].join(" ")}
          onClick={() => {
            setQuickMode(false);
            setStep(1);
          }}
        >
          Advanced
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-1 rounded-full border border-border bg-panel-elevated p-1">
        <button
          type="button"
          className={[
            "rounded-full px-3 py-1 text-xs font-bold transition-colors",
            quickMode
              ? "bg-brand-cta text-white shadow-sm"
              : "text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
          ].join(" ")}
          onClick={() => {
            setQuickMode(true);
            setStep(1);
          }}
        >
          Quick
        </button>
        <button
          type="button"
          className={[
            "rounded-full px-3 py-1 text-xs font-bold transition-colors",
            !quickMode
              ? "bg-brand-cta text-white shadow-sm"
              : "text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
          ].join(" ")}
          onClick={() => {
            setQuickMode(false);
            setStep(1);
          }}
        >
          Advanced
        </button>
      </div>
      <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
        Preview PDF
      </Button>
    </div>
  );

  if (!canMutate) {
    return (
      <p className="text-sm text-amber-800">
        {sessionToken === undefined
          ? "Loading your session…"
          : "You need an admin session to create itineraries."}
      </p>
    );
  }

  return (
    <>
      {msg ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {msg}
        </div>
      ) : null}

      <Modal
        open={tripPresetModalOpen}
        onClose={() => setTripPresetModalOpen(false)}
        title="Save trip preset"
        description="Save the current trip details as a reusable preset for this browser."
      >
        <div className="space-y-3">
          <div>
            <FieldLabel required>Preset name</FieldLabel>
            <TextInput
              value={newTripPresetName}
              onChange={(e) => setNewTripPresetName(e.target.value)}
              placeholder="e.g. Hunza 5D (my version)"
            />
            <FieldHint>Stored on this device only (not shared).</FieldHint>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!newTripPresetName.trim()}
              onClick={() => {
                const name = newTripPresetName.trim();
                if (!name) return;
                const key = `custom-${Date.now()}`;
                const next: TripPreset[] = [
                  ...customTripPresets,
                  {
                    key,
                    label: name,
                    defaults: {
                      title: title.trim() || undefined,
                      days: days,
                      destinations: destinationsInput
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                      pickupDropoff: pickupDropoff.trim() || undefined,
                      transportType: transportType.trim() || undefined,
                      accommodationType: accommodationType.trim() || undefined,
                      mealsIncluded: mealsIncluded.trim() || undefined,
                    },
                  },
                ];
                persistCustomTripPresets(next);
                setTripPresetKey(key);
                setTripPresetModalOpen(false);
              }}
            >
              Save preset
            </Button>
            <Button type="button" variant="secondary" onClick={() => setTripPresetModalOpen(false)}>
              Cancel
            </Button>
          </div>

          {customTripPresets.length ? (
            <div className="rounded-2xl border border-border bg-panel p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Your saved presets</p>
              <div className="mt-2 space-y-2">
                {customTripPresets.map((p) => (
                  <div key={p.key} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-sm font-semibold text-foreground hover:underline"
                      onClick={() => {
                        setTripPresetKey(p.key);
                        applyTripPreset(p.key);
                        setTripPresetModalOpen(false);
                      }}
                    >
                      {p.label}
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700 hover:underline"
                      onClick={() => {
                        const next = customTripPresets.filter((x) => x.key !== p.key);
                        persistCustomTripPresets(next);
                        if (tripPresetKey === p.key) setTripPresetKey("");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={packagePresetModalOpen}
        onClose={() => setPackagePresetModalOpen(false)}
        title="Save package preset"
        description="Save the current packages + stays as a reusable preset for this browser."
      >
        <div className="space-y-3">
          <div>
            <FieldLabel required>Preset name</FieldLabel>
            <TextInput
              value={newPackagePresetName}
              onChange={(e) => setNewPackagePresetName(e.target.value)}
              placeholder="e.g. May pricing tiers"
            />
            <FieldHint>Stored on this device only (not shared).</FieldHint>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!newPackagePresetName.trim()}
              onClick={() => {
                const name = newPackagePresetName.trim();
                if (!name) return;
                const key = `custom-${Date.now()}`;
                const clone = (packages ?? []).map((p) => ({
                  ...p,
                  stays: (p.stays ?? []).map((s) => ({ ...s })),
                }));
                const next: PackagePreset[] = [
                  ...customPackagePresets,
                  {
                    key,
                    label: name,
                    packages: clone,
                  },
                ];
                persistCustomPackagePresets(next);
                setPackagePresetKey(key);
                setPackagePresetModalOpen(false);
              }}
            >
              Save preset
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPackagePresetModalOpen(false)}
            >
              Cancel
            </Button>
          </div>

          {customPackagePresets.length ? (
            <div className="rounded-2xl border border-border bg-panel p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Your saved presets</p>
              <div className="mt-2 space-y-2">
                {customPackagePresets.map((p) => (
                  <div key={p.key} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-sm font-semibold text-foreground hover:underline"
                      onClick={() => {
                        setPackagePresetKey(p.key);
                        applyPackagePreset(p.key);
                        setPackagePresetModalOpen(false);
                      }}
                    >
                      {p.label}
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700 hover:underline"
                      onClick={() => {
                        const next = customPackagePresets.filter((x) => x.key !== p.key);
                        persistCustomPackagePresets(next);
                        if (packagePresetKey === p.key) setPackagePresetKey("");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <WizardLayout
        title="Itinerary"
        steps={flows.labels}
        currentStep={step}
        onBack={step === 1 ? undefined : back}
        onNext={next}
        backDisabled={step === 1}
        nextDisabled={step === 1 ? !clientName.trim() || creatingDraft : false}
        nextLabel={
          step === 1
            ? creatingDraft
              ? "Creating…"
              : "Generate itinerary"
            : step === flows.ids.length
              ? "Mark final"
              : step === flows.ids.length - 1
                ? "Preview & send"
                : "Next"
        }
        savingState={itineraryId ? savingState : "idle"}
        rightActions={rightActions}
      >
        {activeStepId === "basic" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Start fast (recommended)
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Trip preset</FieldLabel>
                  <SelectField
                    value={tripPresetKey}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom_new__") {
                        setTripPresetKey("");
                        setNewTripPresetName("");
                        setTripPresetModalOpen(true);
                        return;
                      }
                      setTripPresetKey(v);
                      applyTripPreset(v);
                    }}
                  >
                    <option value="">No preset</option>
                    {TRIP_PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                    {customTripPresets.length ? (
                      <>
                        <option disabled value="__divider__">
                          ──────────
                        </option>
                        {customTripPresets.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </>
                    ) : null}
                    <option value="__custom_new__">+ Custom…</option>
                  </SelectField>
                  <FieldHint>Auto-fills common trip fields to save time.</FieldHint>
                </div>
                <div>
                  <FieldLabel>Package preset</FieldLabel>
                  <SelectField
                    value={packagePresetKey}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom_new__") {
                        setPackagePresetKey("");
                        setNewPackagePresetName("");
                        setPackagePresetModalOpen(true);
                        return;
                      }
                      setPackagePresetKey(v);
                      applyPackagePreset(v);
                    }}
                  >
                    {PACKAGE_PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                    {customPackagePresets.length ? (
                      <>
                        <option disabled value="__divider__">
                          ──────────
                        </option>
                        {customPackagePresets.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </>
                    ) : null}
                    <option value="__custom_new__">+ Custom…</option>
                  </SelectField>
                  <FieldHint>Pre-creates package tiers + stay rows.</FieldHint>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel required>Trip title</FieldLabel>
              <TextInput
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Hunza Trip"
              />
            </div>

            <div>
              <FieldLabel required>Client name</FieldLabel>
              <TextInput
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ahmed Ali"
              />
              <FieldHint>This is stored inside the itinerary.</FieldHint>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel required>Start date</FieldLabel>
                <TextInput
                  required
                  type="date"
                  min={minDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>End date</FieldLabel>
                <TextInput
                  required
                  type="date"
                  min={startDate || minDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel required>Number of days</FieldLabel>
                <TextInput
                  required
                  type="number"
                  min={1}
                  max={60}
                  value={computedDays ?? days}
                  readOnly
                />
                <FieldHint>Calculated from start & end date.</FieldHint>
              </div>
              <div>
                <FieldLabel required>Theme</FieldLabel>
                <SelectField
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                >
                  <option value="luxury">Luxury</option>
                  <option value="minimal">Minimal</option>
                  <option value="adventure">Adventure</option>
                </SelectField>
              </div>
            </div>
          </div>
        ) : activeStepId === "brand" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Proposal header
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Headline</FieldLabel>
                  <TextInput
                    value={headline}
                    onChange={(e) => {
                      setHeadline(e.target.value);
                      queuePatch({ headline: e.target.value });
                    }}
                    placeholder="Your Dream Skardu Awaits —"
                  />
                </div>
                <div>
                  <FieldLabel>Variant label</FieldLabel>
                  <TextInput
                    value={variantLabel}
                    onChange={(e) => {
                      setVariantLabel(e.target.value);
                      queuePatch({ variantLabel: e.target.value });
                    }}
                    placeholder="Customised by Air"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Cover subtitle</FieldLabel>
                  <TextInput
                    value={coverSubtitle}
                    onChange={(e) => {
                      setCoverSubtitle(e.target.value);
                      queuePatch({ coverSubtitle: e.target.value });
                    }}
                    placeholder="A personalised trip crafted exclusively for…"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Compliance line</FieldLabel>
                  <TextInput
                    value={complianceLine}
                    onChange={(e) => {
                      setComplianceLine(e.target.value);
                      queuePatch({ complianceLine: e.target.value });
                    }}
                    placeholder="JunketTours — Government Registered Tourism Company | DTS"
                  />
                </div>
                <div>
                  <FieldLabel>Government license #</FieldLabel>
                  <TextInput value={licenceNumber} readOnly />
                  <FieldHint>Set in Admin Settings (super admin only).</FieldHint>
                </div>
                <div>
                  <FieldLabel>Pickup & drop-off</FieldLabel>
                  <TextInput
                    value={pickupDropoff}
                    onChange={(e) => {
                      setPickupDropoff(e.target.value);
                      queuePatch({ pickupDropoff: e.target.value });
                    }}
                    placeholder="Pickup & drop-off at Skardu Airport"
                  />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Cover image (optional)</FieldLabel>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm sm:max-w-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void (async () => {
                      try {
                        const id = await uploadOne(f);
                        setCoverStorageId(id);
                        queuePatch({ coverImageStorageId: id });
                      } catch (err) {
                        setMsg(toUserFacingErrorMessage(err));
                      } finally {
                        e.target.value = "";
                      }
                    })();
                  }}
                />
                {existingAssets?.length ? (
                  <SelectField
                    value={coverStorageId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const id = v ? (v as Id<"_storage">) : null;
                      setCoverStorageId(id);
                      if (id) queuePatch({ coverImageStorageId: id });
                    }}
                  >
                    <option value="">Choose existing…</option>
                    {existingAssets.map((a) => (
                      <option key={a.storageId} value={a.storageId}>
                        {a.storageId}
                      </option>
                    ))}
                  </SelectField>
                ) : null}
              </div>
              {coverStorageId ? (
                <div className="mt-2">
                  <img
                    src={existingAssets?.find((x) => x.storageId === coverStorageId)?.url ?? undefined}
                    alt=""
                    className="h-20 w-32 rounded-lg border border-border object-cover"
                  />
                </div>
              ) : null}
              <FieldHint>Cover image will be used for the PDF cover page.</FieldHint>
            </div>

            <div>
              <FieldLabel>Company description</FieldLabel>
              <TextAreaField
                rows={6}
                value={companyDescription}
                onChange={(e) => {
                  setCompanyDescription(e.target.value);
                  queuePatch({ companyDescription: e.target.value });
                }}
                placeholder="Write a short company introduction…"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Phone</FieldLabel>
                <TextInput
                  value={contactPhone}
                  onChange={(e) => {
                    setContactPhone(e.target.value);
                    queuePatch({ contactPhone: e.target.value });
                  }}
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    queuePatch({ contactEmail: e.target.value });
                  }}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Website</FieldLabel>
              <TextInput
                value={contactWebsite}
                onChange={(e) => {
                  setContactWebsite(e.target.value);
                  queuePatch({ contactWebsite: e.target.value });
                }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Logo (optional)</FieldLabel>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm sm:max-w-sm"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void (async () => {
                        try {
                          const id = await uploadOne(f);
                          setLogoStorageId(id);
                          queuePatch({ logoStorageId: id });
                        } catch (err) {
                          setMsg(toUserFacingErrorMessage(err));
                        } finally {
                          e.target.value = "";
                        }
                      })();
                    }}
                  />
                  {existingAssets?.length ? (
                    <SelectField
                      value={logoStorageId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const id = v ? (v as Id<"_storage">) : null;
                        setLogoStorageId(id);
                        if (id) queuePatch({ logoStorageId: id });
                      }}
                    >
                      <option value="">Choose existing…</option>
                      {existingAssets.map((a) => (
                        <option key={a.storageId} value={a.storageId}>
                          {a.storageId}
                        </option>
                      ))}
                    </SelectField>
                  ) : null}
                </div>
                <div className="mt-2">
                  <img
                    src={
                      logoStorageId
                        ? (existingAssets?.find((x) => x.storageId === logoStorageId)?.url ?? undefined)
                        : defaultLogoUrlAbs ?? undefined
                    }
                    alt=""
                    className="h-20 w-32 rounded-lg border border-border object-contain bg-white"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Affiliations (optional)</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-2 block w-full text-sm"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length === 0) return;
                    void (async () => {
                      try {
                        const ids: Id<"_storage">[] = [];
                        for (const f of files) ids.push(await uploadOne(f));
                        const next = [...affiliations, ...ids];
                        setAffiliations(next);
                        queuePatch({ affiliationsStorageIds: next });
                      } catch (err) {
                        setMsg(toUserFacingErrorMessage(err));
                      } finally {
                        e.target.value = "";
                      }
                    })();
                  }}
                />
                {existingAssets?.length ? (
                  <div className="mt-2">
                    <SelectField
                      value=""
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        const id = v as Id<"_storage">;
                        const next = [...affiliations, id];
                        setAffiliations(next);
                        queuePatch({ affiliationsStorageIds: next });
                        e.target.value = "";
                      }}
                    >
                      <option value="">Add existing affiliation…</option>
                      {existingAssets.map((a) => (
                        <option key={a.storageId} value={a.storageId}>
                          {a.storageId}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                ) : null}
                {affiliations.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {affiliations.slice(0, 12).map((id) => {
                      const url = existingAssets?.find((x) => x.storageId === id)?.url ?? null;
                      return (
                        <img
                          key={id}
                          src={url ?? undefined}
                          alt=""
                          className="h-10 w-14 rounded-md border border-border object-contain bg-white"
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : activeStepId === "overview" ? (
          <div className="space-y-4">
            <div>
              <FieldLabel>Destinations</FieldLabel>
              <TextInput
                value={destinationsInput}
                onChange={(e) => {
                  setDestinationsInput(e.target.value);
                  const tags = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  queuePatch({ destinations: tags });
                }}
                placeholder="Skardu, Hunza, Fairy Meadows"
              />
              <FieldHint>Comma-separated tags.</FieldHint>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel>Transport</FieldLabel>
                <SelectField
                  value={transportType}
                  onChange={(e) => {
                    setTransportType(e.target.value);
                    queuePatch({ transportType: e.target.value });
                  }}
                >
                  <option value="4x4">4x4</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Coaster">Coaster</option>
                </SelectField>
              </div>
              <div>
                <FieldLabel>Accommodation</FieldLabel>
                <SelectField
                  value={accommodationType}
                  onChange={(e) => {
                    setAccommodationType(e.target.value);
                    queuePatch({ accommodationType: e.target.value });
                  }}
                >
                  <option value="3-star">3-star</option>
                  <option value="4-star">4-star</option>
                  <option value="Luxury">Luxury</option>
                </SelectField>
              </div>
              <div>
                <FieldLabel>Meals</FieldLabel>
                <SelectField
                  value={mealsIncluded}
                  onChange={(e) => {
                    setMealsIncluded(e.target.value);
                    queuePatch({ mealsIncluded: e.target.value });
                  }}
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="All meals">All meals</option>
                  <option value="None">None</option>
                </SelectField>
              </div>
            </div>
          </div>
        ) : activeStepId === "daysQuick" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Keep it simple. Add 2–4 highlights per day so the client understands the plan.
            </p>

            <div className="space-y-3">
              {(dayPlans ?? []).map((d, idx) => (
                <div key={d.dayNumber} className="rounded-2xl border border-border bg-panel-elevated p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">
                      Day {d.dayNumber}
                    </p>
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand-cta hover:underline"
                      onClick={() => {
                        setDayPlans((prev) => {
                          const next = prev.map((x, i) =>
                            i === idx ? { ...x, title: `Day ${x.dayNumber}` } : x,
                          );
                          queuePatch({ dayPlans: next });
                          return next;
                        });
                      }}
                    >
                      Reset title
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Title</FieldLabel>
                      <TextInput
                        value={d.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDayPlans((prev) => {
                            const next = prev.map((x, i) => (i === idx ? { ...x, title: v } : x));
                            queuePatch({ dayPlans: next });
                            return next;
                          });
                        }}
                        placeholder={`Day ${d.dayNumber} — Arrival & explore`}
                      />
                    </div>
                    <div>
                      <FieldLabel>Overnight (optional)</FieldLabel>
                      <TextInput
                        value={d.overnight ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDayPlans((prev) => {
                            const next = prev.map((x, i) =>
                              i === idx ? { ...x, overnight: v } : x,
                            );
                            queuePatch({ dayPlans: next });
                            return next;
                          });
                        }}
                        placeholder="Overnight in Hunza"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <FieldLabel>Highlights (one per line)</FieldLabel>
                    <TextAreaField
                      rows={4}
                      value={highlightsInputByDay[d.dayNumber] ?? (d.highlights ?? []).join("\n")}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHighlightsInputByDay((prev) => ({ ...prev, [d.dayNumber]: v }));
                        const parsed = v
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .slice(0, 8);
                        setDayPlans((prev) => {
                          const next = prev.map((x, i) =>
                            i === idx ? { ...x, highlights: parsed } : x,
                          );
                          queuePatch({ dayPlans: next });
                          return next;
                        });
                      }}
                      placeholder={"- Travel\n- Sightseeing\n- Hotel check-in"}
                    />
                    <FieldHint>Quick PDF will show up to 4 highlights per day.</FieldHint>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeStepId === "days" ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Day builder</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDayPlans((prev) => {
                    const next = [...prev, emptyDay(prev.length + 1)];
                    queuePatch({ dayPlans: next });
                    return next;
                  });
                }}
              >
                + Add day
              </Button>
            </div>

            <div className="space-y-4">
              {dayPlans.map((d, idx) => (
                <div key={d.dayNumber} className="rounded-2xl border border-border bg-panel-elevated p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        Day {d.dayNumber}
                      </p>
                      <TextInput
                        value={d.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDayPlans((prev) => {
                            const next = prev.map((x) =>
                              x.dayNumber === d.dayNumber ? { ...x, title: v } : x,
                            );
                            queuePatch({ dayPlans: next });
                            return next;
                          });
                        }}
                        placeholder="Arrival in Skardu"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setDayPlans((prev) => {
                            const copy = { ...prev[idx], dayNumber: prev.length + 1 };
                            const next = [...prev, copy];
                            queuePatch({ dayPlans: next });
                            return next;
                          });
                        }}
                      >
                        Duplicate day
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setDayPlans((prev) => {
                            const next = prev.filter((_, i) => i !== idx).map((x, i) => ({
                              ...x,
                              dayNumber: i + 1,
                            }));
                            queuePatch({ dayPlans: next });
                            return next;
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <FieldLabel>Day image (optional)</FieldLabel>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm sm:max-w-sm"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          void (async () => {
                            try {
                              const id = await uploadOne(f);
                              setDayPlans((prev) => {
                                const next = prev.map((x) =>
                                  x.dayNumber === d.dayNumber ? { ...x, imageStorageId: id } : x,
                                );
                                queuePatch({ dayPlans: next });
                                return next;
                              });
                            } catch (err) {
                              setMsg(toUserFacingErrorMessage(err));
                            } finally {
                              e.target.value = "";
                            }
                          })();
                        }}
                      />
                      {existingAssets?.length ? (
                        <SelectField
                          value={d.imageStorageId ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            const id = v ? (v as Id<"_storage">) : undefined;
                            setDayPlans((prev) => {
                              const next = prev.map((x) =>
                                x.dayNumber === d.dayNumber ? { ...x, imageStorageId: id } : x,
                              );
                              queuePatch({ dayPlans: next });
                              return next;
                            });
                          }}
                        >
                          <option value="">Choose existing…</option>
                          {existingAssets.map((a) => (
                            <option key={a.storageId} value={a.storageId}>
                              {a.storageId}
                            </option>
                          ))}
                        </SelectField>
                      ) : null}
                    </div>
                    {d.imageStorageId ? (
                      <div className="mt-2">
                        <img
                          src={
                            existingAssets?.find((x) => x.storageId === d.imageStorageId)?.url ??
                            undefined
                          }
                          alt=""
                          className="h-20 w-32 rounded-lg border border-border object-cover"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Overnight</FieldLabel>
                      <TextInput
                        value={d.overnight ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDayPlans((prev) => {
                            const next = prev.map((x) =>
                              x.dayNumber === d.dayNumber ? { ...x, overnight: v } : x,
                            );
                            queuePatch({ dayPlans: next });
                            return next;
                          });
                        }}
                        placeholder="Overnight Skardu"
                      />
                    </div>
                    <div>
                      <FieldLabel>Highlights</FieldLabel>
                      <TextInput
                        value={
                          highlightsInputByDay[d.dayNumber] ??
                          (d.highlights ?? []).join(", ")
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          setHighlightsInputByDay((prev) => ({
                            ...prev,
                            [d.dayNumber]: raw,
                          }));
                          const parts = raw
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setDayPlans((prev) => {
                            const next = prev.map((x) =>
                              x.dayNumber === d.dayNumber ? { ...x, highlights: parts } : x,
                            );
                            queuePatch({ dayPlans: next });
                            return next;
                          });
                        }}
                        placeholder="Airport pickup, Hotel check-in, Upper Kachura Lake"
                      />
                      <FieldHint>Use commas to separate highlights (like the PDF).</FieldHint>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(["morning", "afternoon", "evening"] as const).map((slot) => (
                      <div key={slot} className="rounded-xl border border-border bg-panel p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted">
                          {slot}
                        </p>
                        <div className="mt-2 space-y-2">
                          {d[slot].map((a, aIdx) => (
                            <div key={`${slot}-${aIdx}`} className="rounded-xl border border-border bg-panel-elevated p-2">
                              <TextInput
                                value={a.title}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setDayPlans((prev) => {
                                    const next = prev.map((x) => {
                                      if (x.dayNumber !== d.dayNumber) return x;
                                      const list = [...x[slot]];
                                      list[aIdx] = { ...list[aIdx], title: v };
                                      return { ...x, [slot]: list };
                                    });
                                    queuePatch({ dayPlans: next });
                                    return next;
                                  });
                                }}
                                placeholder="Activity title"
                              />
                              <TextAreaField
                                rows={2}
                                className="mt-2"
                                value={a.description}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setDayPlans((prev) => {
                                    const next = prev.map((x) => {
                                      if (x.dayNumber !== d.dayNumber) return x;
                                      const list = [...x[slot]];
                                      list[aIdx] = { ...list[aIdx], description: v };
                                      return { ...x, [slot]: list };
                                    });
                                    queuePatch({ dayPlans: next });
                                    return next;
                                  });
                                }}
                                placeholder="Short description"
                              />
                              <div className="mt-2">
                                <SelectField
                                  value={a.icon}
                                  onChange={(e) => {
                                    const v = e.target.value as ActivityIcon;
                                    setDayPlans((prev) => {
                                      const next = prev.map((x) => {
                                        if (x.dayNumber !== d.dayNumber) return x;
                                        const list = [...x[slot]];
                                        list[aIdx] = { ...list[aIdx], icon: v };
                                        return { ...x, [slot]: list };
                                      });
                                      queuePatch({ dayPlans: next });
                                      return next;
                                    });
                                  }}
                                >
                                  <option value="flight">Flight</option>
                                  <option value="hotel">Hotel</option>
                                  <option value="food">Food</option>
                                  <option value="sightseeing">Sightseeing</option>
                                </SelectField>
                              </div>
                              <button
                                type="button"
                                className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                                onClick={() => {
                                  setDayPlans((prev) => {
                                    const next = prev.map((x) => {
                                      if (x.dayNumber !== d.dayNumber) return x;
                                      const list = x[slot].filter((_, i) => i !== aIdx);
                                      return { ...x, [slot]: list.length ? list : [emptyActivity()] };
                                    });
                                    queuePatch({ dayPlans: next });
                                    return next;
                                  });
                                }}
                              >
                                Remove activity
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="mt-3 text-xs font-semibold text-brand-cta hover:underline"
                          onClick={() => {
                            setDayPlans((prev) => {
                              const next = prev.map((x) => {
                                if (x.dayNumber !== d.dayNumber) return x;
                                return { ...x, [slot]: [...x[slot], emptyActivity()] };
                              });
                              queuePatch({ dayPlans: next });
                              return next;
                            });
                          }}
                        >
                          + Add activity
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeStepId === "packages" ? (
          <div className="space-y-4 pb-24">
            <p className="text-sm text-muted">
              Packages are the fastest part. Build 1, then duplicate tiers.
            </p>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Choose your package</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const next = [
                      ...packages,
                      { name: "", pricePkr: undefined, vehicle: "", note: "", stays: [] },
                    ];
                    setPackages(next);
                    queuePatch({ packages: next });
                  }}
                >
                  + Add package
                </Button>
              </div>

              <div className="mt-3 rounded-2xl border border-border bg-panel p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Bulk edit (time saver)
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <FieldLabel>Find hotel</FieldLabel>
                    <TextInput
                      value={bulkHotelFind}
                      onChange={(e) => setBulkHotelFind(e.target.value)}
                      placeholder="e.g. Shangrila Resort"
                    />
                  </div>
                  <div>
                    <FieldLabel>Replace with</FieldLabel>
                    <TextInput
                      value={bulkHotelReplace}
                      onChange={(e) => setBulkHotelReplace(e.target.value)}
                      placeholder="e.g. Serena Shigar"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      disabled={!bulkHotelFind.trim()}
                      onClick={() => {
                        const find = bulkHotelFind.trim();
                        const replace = bulkHotelReplace;
                        const escapeRegExp = (s: string) =>
                          s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        const re = new RegExp(escapeRegExp(find), "gi");
                        setPackages((prev) => {
                          const next = prev.map((p) => ({
                            ...p,
                            stays: (p.stays ?? []).map((s) => ({
                              ...s,
                              hotel: (s.hotel ?? "").replace(re, replace),
                            })),
                          }));
                          queuePatch({ packages: next });
                          return next;
                        });
                      }}
                    >
                      Apply to all tiers
                    </Button>
                  </div>
                </div>
                <FieldHint>
                  Replaces matching hotel text across all packages (all tiers).
                </FieldHint>
              </div>

              <div className="mt-3 space-y-3">
                {packages.length === 0 ? (
                  <p className="text-sm text-muted">No packages added yet.</p>
                ) : (
                  packages.map((p, idx) => (
                    <div key={idx} className="rounded-2xl border border-border bg-panel p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted">
                          Package {idx + 1}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="sm:hidden">
                            <PopoverMenu
                              buttonLabel="Actions"
                              buttonClassName="rounded-xl border border-border bg-panel-elevated px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-panel"
                              menuClassName="w-44 bg-white"
                              items={[
                                {
                                  label: "Duplicate",
                                  onClick: () => {
                                    setPackages((prev) => {
                                      const src = prev[idx];
                                      if (!src) return prev;
                                      const copy = {
                                        ...src,
                                        stays: (src.stays ?? []).map((s) => ({ ...s })),
                                      };
                                      const next = [
                                        ...prev.slice(0, idx + 1),
                                        copy,
                                        ...prev.slice(idx + 1),
                                      ];
                                      queuePatch({ packages: next });
                                      return next;
                                    });
                                  },
                                },
                                {
                                  label: "Move up",
                                  disabled: idx === 0,
                                  onClick: () => {
                                    setPackages((prev) => {
                                      if (idx <= 0) return prev;
                                      const next = [...prev];
                                      const tmp = next[idx - 1]!;
                                      next[idx - 1] = next[idx]!;
                                      next[idx] = tmp;
                                      queuePatch({ packages: next });
                                      return next;
                                    });
                                  },
                                },
                                {
                                  label: "Move down",
                                  disabled: idx >= packages.length - 1,
                                  onClick: () => {
                                    setPackages((prev) => {
                                      if (idx >= prev.length - 1) return prev;
                                      const next = [...prev];
                                      const tmp = next[idx + 1]!;
                                      next[idx + 1] = next[idx]!;
                                      next[idx] = tmp;
                                      queuePatch({ packages: next });
                                      return next;
                                    });
                                  },
                                },
                                {
                                  label: "Remove",
                                  tone: "danger",
                                  onClick: () => {
                                    const next = packages.filter((_, i) => i !== idx);
                                    setPackages(next);
                                    queuePatch({ packages: next });
                                  },
                                },
                              ]}
                            />
                          </div>

                          <div className="hidden items-center gap-2 sm:flex">
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-lg px-3 py-1.5 text-xs"
                              onClick={() => {
                                setPackages((prev) => {
                                  const src = prev[idx];
                                  if (!src) return prev;
                                  const copy = {
                                    ...src,
                                    stays: (src.stays ?? []).map((s) => ({ ...s })),
                                  };
                                  const next = [
                                    ...prev.slice(0, idx + 1),
                                    copy,
                                    ...prev.slice(idx + 1),
                                  ];
                                  queuePatch({ packages: next });
                                  return next;
                                });
                              }}
                            >
                              Duplicate
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-lg px-3 py-1.5 text-xs"
                              disabled={idx === 0}
                              onClick={() => {
                                setPackages((prev) => {
                                  if (idx <= 0) return prev;
                                  const next = [...prev];
                                  const tmp = next[idx - 1]!;
                                  next[idx - 1] = next[idx]!;
                                  next[idx] = tmp;
                                  queuePatch({ packages: next });
                                  return next;
                                });
                              }}
                            >
                              Up
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-lg px-3 py-1.5 text-xs"
                              disabled={idx >= packages.length - 1}
                              onClick={() => {
                                setPackages((prev) => {
                                  if (idx >= prev.length - 1) return prev;
                                  const next = [...prev];
                                  const tmp = next[idx + 1]!;
                                  next[idx + 1] = next[idx]!;
                                  next[idx] = tmp;
                                  queuePatch({ packages: next });
                                  return next;
                                });
                              }}
                            >
                              Down
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-lg px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                              onClick={() => {
                                const next = packages.filter((_, i) => i !== idx);
                                setPackages(next);
                                queuePatch({ packages: next });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Name</FieldLabel>
                          <TextInput
                            value={p.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPackages((prev) => {
                                const next = prev.map((x, i) => (i === idx ? { ...x, name: v } : x));
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                            placeholder="Deluxe Plus"
                          />
                        </div>
                        <div>
                          <FieldLabel>Price (PKR)</FieldLabel>
                          <TextInput
                            type="number"
                            min={0}
                            value={p.pricePkr ?? ""}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setPackages((prev) => {
                                const next = prev.map((x, i) =>
                                  i === idx ? { ...x, pricePkr: Number.isFinite(v) ? v : undefined } : x,
                                );
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div>
                          <FieldLabel>Vehicle</FieldLabel>
                          <TextInput
                            value={p.vehicle ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPackages((prev) => {
                                const next = prev.map((x, i) => (i === idx ? { ...x, vehicle: v } : x));
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                            placeholder="Sedan / Prado"
                          />
                        </div>
                        <div>
                          <FieldLabel>Note</FieldLabel>
                          <TextInput
                            value={p.note ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPackages((prev) => {
                                const next = prev.map((x, i) => (i === idx ? { ...x, note: v } : x));
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                            placeholder="For two adults (airfare excluded)"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted">
                            Stays
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              className="text-xs font-semibold text-brand-cta hover:underline disabled:opacity-50"
                              disabled={idx === 0 || (packages[0]?.stays?.length ?? 0) === 0}
                              onClick={() => {
                                setPackages((prev) => {
                                  const base = prev[0];
                                  if (!base?.stays?.length) return prev;
                                  const next = prev.map((x, i) => {
                                    if (i !== idx) return x;
                                    return {
                                      ...x,
                                      stays: base.stays!.map((s) => ({ ...s })),
                                    };
                                  });
                                  queuePatch({ packages: next });
                                  return next;
                                });
                              }}
                            >
                              Duplicate stays from Package 1
                            </button>
                            <button
                              type="button"
                              className="text-xs font-semibold text-brand-cta hover:underline"
                              onClick={() => {
                                setPackages((prev) => {
                                  const next = prev.map((x, i) => {
                                    if (i !== idx) return x;
                                    const stays = [
                                      ...(x.stays ?? []),
                                      { location: "", hotel: "", nights: 1 },
                                    ];
                                    return { ...x, stays };
                                  });
                                  queuePatch({ packages: next });
                                  return next;
                                });
                              }}
                            >
                              + Add stay
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 space-y-2">
                          {(p.stays ?? []).length ? (
                            <div className="hidden grid-cols-4 gap-2 text-xs font-bold uppercase tracking-wide text-muted sm:grid">
                              <span>Location</span>
                              <span>Hotel</span>
                              <span>Nights</span>
                              <span className="text-right">Action</span>
                            </div>
                          ) : null}
                          {(p.stays ?? []).length ? (
                            <div className="grid grid-cols-3 gap-2 text-xs font-bold uppercase tracking-wide text-muted sm:hidden">
                              <span>Location</span>
                              <span>Hotel</span>
                              <span>Nights</span>
                            </div>
                          ) : null}
                          {(p.stays ?? []).map((s, sIdx) => (
                            <div key={sIdx} className="grid gap-2 sm:grid-cols-4">
                              <TextInput
                                value={s.location}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setPackages((prev) => {
                                    const next = prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const stays = [...(x.stays ?? [])];
                                      stays[sIdx] = { ...stays[sIdx], location: v };
                                      return { ...x, stays };
                                    });
                                    queuePatch({ packages: next });
                                    return next;
                                  });
                                }}
                                placeholder="Skardu"
                              />
                              <TextInput
                                value={s.hotel}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setPackages((prev) => {
                                    const next = prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const stays = [...(x.stays ?? [])];
                                      stays[sIdx] = { ...stays[sIdx], hotel: v };
                                      return { ...x, stays };
                                    });
                                    queuePatch({ packages: next });
                                    return next;
                                  });
                                }}
                                placeholder="Arcadian Skardu"
                              />
                              <TextInput
                                type="number"
                                min={1}
                                value={s.nights}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setPackages((prev) => {
                                    const next = prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const stays = [...(x.stays ?? [])];
                                      stays[sIdx] = { ...stays[sIdx], nights: Math.max(1, v || 1) };
                                      return { ...x, stays };
                                    });
                                    queuePatch({ packages: next });
                                    return next;
                                  });
                                }}
                              />
                              <button
                                type="button"
                                className="text-xs font-semibold text-red-600 hover:underline"
                                onClick={() => {
                                  setPackages((prev) => {
                                    const next = prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const stays = (x.stays ?? []).filter((_, j) => j !== sIdx);
                                      return { ...x, stays };
                                    });
                                    queuePatch({ packages: next });
                                    return next;
                                  });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : activeStepId === "details" ? (
          <div className="space-y-4">
            <div>
              <FieldLabel>Accommodation details</FieldLabel>
              <TextAreaField
                rows={4}
                value={accommodationDetails}
                onChange={(e) => {
                  setAccommodationDetails(e.target.value);
                  queuePatch({ accommodationDetails: e.target.value });
                }}
                placeholder="Hotels, room types, etc."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Included</FieldLabel>
                <TextAreaField
                  rows={6}
                  value={includedInput}
                  onChange={(e) => {
                    setIncludedInput(e.target.value);
                    const items = e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    queuePatch({ included: items });
                  }}
                  placeholder="+ Add one per line"
                />
              </div>
              <div>
                <FieldLabel>Not included</FieldLabel>
                <TextAreaField
                  rows={6}
                  value={notIncludedInput}
                  onChange={(e) => {
                    setNotIncludedInput(e.target.value);
                    const items = e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    queuePatch({ notIncluded: items });
                  }}
                  placeholder="+ Add one per line"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Important notes</FieldLabel>
              <TextAreaField
                rows={4}
                value={importantNotes}
                onChange={(e) => {
                  setImportantNotes(e.target.value);
                  queuePatch({ importantNotes: e.target.value });
                }}
              />
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Choose your package</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const next = [
                      ...packages,
                      { name: "", pricePkr: undefined, vehicle: "", note: "", stays: [] },
                    ];
                    setPackages(next);
                    queuePatch({ packages: next });
                  }}
                >
                  + Add package
                </Button>
              </div>

              <div className="mt-3 rounded-2xl border border-border bg-panel p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Bulk edit (time saver)
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <FieldLabel>Find hotel</FieldLabel>
                    <TextInput
                      value={bulkHotelFind}
                      onChange={(e) => setBulkHotelFind(e.target.value)}
                      placeholder="e.g. Shangrila Resort"
                    />
                  </div>
                  <div>
                    <FieldLabel>Replace with</FieldLabel>
                    <TextInput
                      value={bulkHotelReplace}
                      onChange={(e) => setBulkHotelReplace(e.target.value)}
                      placeholder="e.g. Serena Shigar"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      disabled={!bulkHotelFind.trim()}
                      onClick={() => {
                        const find = bulkHotelFind.trim();
                        const replace = bulkHotelReplace;
                        const escapeRegExp = (s: string) =>
                          s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        const re = new RegExp(escapeRegExp(find), "gi");
                        setPackages((prev) => {
                          const next = prev.map((p) => ({
                            ...p,
                            stays: (p.stays ?? []).map((s) => ({
                              ...s,
                              hotel: (s.hotel ?? "").replace(re, replace),
                            })),
                          }));
                          queuePatch({ packages: next });
                          return next;
                        });
                      }}
                    >
                      Apply to all tiers
                    </Button>
                  </div>
                </div>
                <FieldHint>
                  Replaces matching hotel text across all packages (all tiers).
                </FieldHint>
              </div>

              <div className="mt-3 space-y-3">
                {packages.length === 0 ? (
                  <p className="text-sm text-muted">No packages added yet.</p>
                ) : (
                  packages.map((p, idx) => (
                    <div key={idx} className="rounded-2xl border border-border bg-panel p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted">
                          Package {idx + 1}
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-xs font-semibold text-brand-cta hover:underline"
                            onClick={() => {
                              setPackages((prev) => {
                                const src = prev[idx];
                                if (!src) return prev;
                                const copy = {
                                  ...src,
                                  stays: (src.stays ?? []).map((s) => ({ ...s })),
                                };
                                const next = [
                                  ...prev.slice(0, idx + 1),
                                  copy,
                                  ...prev.slice(idx + 1),
                                ];
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-foreground/80 hover:underline disabled:opacity-40"
                            disabled={idx === 0}
                            onClick={() => {
                              setPackages((prev) => {
                                if (idx <= 0) return prev;
                                const next = [...prev];
                                const tmp = next[idx - 1]!;
                                next[idx - 1] = next[idx]!;
                                next[idx] = tmp;
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-foreground/80 hover:underline disabled:opacity-40"
                            disabled={idx >= packages.length - 1}
                            onClick={() => {
                              setPackages((prev) => {
                                if (idx >= prev.length - 1) return prev;
                                const next = [...prev];
                                const tmp = next[idx + 1]!;
                                next[idx + 1] = next[idx]!;
                                next[idx] = tmp;
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 hover:underline"
                            onClick={() => {
                              const next = packages.filter((_, i) => i !== idx);
                              setPackages(next);
                              queuePatch({ packages: next });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Name</FieldLabel>
                          <TextInput
                            value={p.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPackages((prev) => {
                                const next = prev.map((x, i) => (i === idx ? { ...x, name: v } : x));
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                            placeholder="Deluxe Plus"
                          />
                        </div>
                        <div>
                          <FieldLabel>Price (PKR)</FieldLabel>
                          <TextInput
                            type="number"
                            min={0}
                            value={p.pricePkr ?? ""}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setPackages((prev) => {
                                const next = prev.map((x, i) =>
                                  i === idx ? { ...x, pricePkr: Number.isFinite(v) ? v : undefined } : x,
                                );
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div>
                          <FieldLabel>Vehicle</FieldLabel>
                          <TextInput
                            value={p.vehicle ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPackages((prev) => {
                                const next = prev.map((x, i) => (i === idx ? { ...x, vehicle: v } : x));
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                            placeholder="Sedan / Prado"
                          />
                        </div>
                        <div>
                          <FieldLabel>Note</FieldLabel>
                          <TextInput
                            value={p.note ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPackages((prev) => {
                                const next = prev.map((x, i) => (i === idx ? { ...x, note: v } : x));
                                queuePatch({ packages: next });
                                return next;
                              });
                            }}
                            placeholder="For two adults (airfare excluded)"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted">
                            Stays
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              className="text-xs font-semibold text-brand-cta hover:underline disabled:opacity-50"
                              disabled={idx === 0 || (packages[0]?.stays?.length ?? 0) === 0}
                              onClick={() => {
                                setPackages((prev) => {
                                  const base = prev[0];
                                  if (!base?.stays?.length) return prev;
                                  const next = prev.map((x, i) => {
                                    if (i !== idx) return x;
                                    return {
                                      ...x,
                                      stays: base.stays!.map((s) => ({ ...s })),
                                    };
                                  });
                                  queuePatch({ packages: next });
                                  return next;
                                });
                              }}
                            >
                              Duplicate stays from Package 1
                            </button>
                            <button
                              type="button"
                              className="text-xs font-semibold text-brand-cta hover:underline"
                              onClick={() => {
                                setPackages((prev) => {
                                  const next = prev.map((x, i) => {
                                    if (i !== idx) return x;
                                    const stays = [
                                      ...(x.stays ?? []),
                                      { location: "", hotel: "", nights: 1 },
                                    ];
                                    return { ...x, stays };
                                  });
                                  queuePatch({ packages: next });
                                  return next;
                                });
                              }}
                            >
                              + Add stay
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-2">
                          {(p.stays ?? []).map((s, sIdx) => (
                            <div key={sIdx} className="grid gap-2 sm:grid-cols-4">
                              <TextInput
                                value={s.location}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setPackages((prev) => {
                                    const next = prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const stays = [...(x.stays ?? [])];
                                      stays[sIdx] = { ...stays[sIdx], location: v };
                                      return { ...x, stays };
                                    });
                                    queuePatch({ packages: next });
                                    return next;
                                  });
                                }}
                                placeholder="Skardu"
                              />
                              <TextInput
                                value={s.hotel}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setPackages((prev) => {
                                    const next = prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const stays = [...(x.stays ?? [])];
                                      stays[sIdx] = { ...stays[sIdx], hotel: v };
                                      return { ...x, stays };
                                    });
                                    queuePatch({ packages: next });
                                    return next;
                                  });
                                }}
                                placeholder="Arcadian Skardu"
                              />
                              <TextInput
                                type="number"
                                min={1}
                                value={s.nights}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setPackages((prev) => {
                                    const next = prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const stays = [...(x.stays ?? [])];
                                      stays[sIdx] = { ...stays[sIdx], nights: Math.max(1, v || 1) };
                                      return { ...x, stays };
                                    });
                                    queuePatch({ packages: next });
                                    return next;
                                  });
                                }}
                              />
                              <button
                                type="button"
                                className="text-xs font-semibold text-red-600 hover:underline"
                                onClick={() => {
                                  setPackages((prev) => {
                                    const next = prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const stays = (x.stays ?? []).filter((_, j) => j !== sIdx);
                                      return { ...x, stays };
                                    });
                                    queuePatch({ packages: next });
                                    return next;
                                  });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <p className="text-sm font-semibold text-foreground">Payment terms</p>
              <div className="mt-3 space-y-2">
                {paymentTerms.map((t, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-6">
                    <TextInput
                      type="number"
                      min={0}
                      max={100}
                      value={t.percent}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setPaymentTerms((prev) => {
                          const next = prev.map((x, i) =>
                            i === idx ? { ...x, percent: Math.max(0, Math.min(100, v || 0)) } : x,
                          );
                          queuePatch({ paymentTerms: next });
                          return next;
                        });
                      }}
                      placeholder="%"
                    />
                    <div className="sm:col-span-2">
                      <TextInput
                        value={t.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPaymentTerms((prev) => {
                            const next = prev.map((x, i) => (i === idx ? { ...x, title: v } : x));
                            queuePatch({ paymentTerms: next });
                            return next;
                          });
                        }}
                        placeholder="On Registration"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <TextInput
                        value={t.description ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPaymentTerms((prev) => {
                            const next = prev.map((x, i) =>
                              i === idx ? { ...x, description: v } : x,
                            );
                            queuePatch({ paymentTerms: next });
                            return next;
                          });
                        }}
                        placeholder="Advance payment at time of booking"
                      />
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600 hover:underline"
                      onClick={() => {
                        const next = paymentTerms.filter((_, i) => i !== idx);
                        setPaymentTerms(next);
                        queuePatch({ paymentTerms: next });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-cta hover:underline"
                  onClick={() => {
                    const next = [...paymentTerms, { percent: 0, title: "", description: "" }];
                    setPaymentTerms(next);
                    queuePatch({ paymentTerms: next });
                  }}
                >
                  + Add payment term
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <p className="text-sm font-semibold text-foreground">Bank details</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Bank</FieldLabel>
                  <TextInput
                    value={bankDetails.bankName ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...bankDetails, bankName: v };
                      setBankDetails(next);
                      queuePatch({ bankDetails: next });
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>Account title</FieldLabel>
                  <TextInput
                    value={bankDetails.accountTitle ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...bankDetails, accountTitle: v };
                      setBankDetails(next);
                      queuePatch({ bankDetails: next });
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>Account #</FieldLabel>
                  <TextInput
                    value={bankDetails.accountNumber ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...bankDetails, accountNumber: v };
                      setBankDetails(next);
                      queuePatch({ bankDetails: next });
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>IBAN</FieldLabel>
                  <TextInput
                    value={bankDetails.iban ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...bankDetails, iban: v };
                      setBankDetails(next);
                      queuePatch({ bankDetails: next });
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Instruction</FieldLabel>
                  <TextInput
                    value={bankDetails.instruction ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...bankDetails, instruction: v };
                      setBankDetails(next);
                      queuePatch({ bankDetails: next });
                    }}
                    placeholder="After payment, WhatsApp your name & amount to..."
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-panel-elevated p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Terms & conditions</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const next = [...termsBlocks, { title: "", body: "" }];
                    setTermsBlocks(next);
                    queuePatch({ termsBlocks: next });
                  }}
                >
                  + Add block
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                {termsBlocks.map((b, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-panel p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        Block {idx + 1}
                      </p>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:underline"
                        onClick={() => {
                          const next = termsBlocks.filter((_, i) => i !== idx);
                          setTermsBlocks(next);
                          queuePatch({ termsBlocks: next });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      <TextInput
                        value={b.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTermsBlocks((prev) => {
                            const next = prev.map((x, i) => (i === idx ? { ...x, title: v } : x));
                            queuePatch({ termsBlocks: next });
                            return next;
                          });
                        }}
                        placeholder="ID Requirements"
                      />
                      <TextAreaField
                        rows={4}
                        value={b.body}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTermsBlocks((prev) => {
                            const next = prev.map((x, i) => (i === idx ? { ...x, body: v } : x));
                            queuePatch({ termsBlocks: next });
                            return next;
                          });
                        }}
                        placeholder="Write the policy..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeStepId === "export" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Preview and export your document. Mark as final when ready.
            </p>

            {copyMsg ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {copyMsg}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
                Preview
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void copyWhatsappMessage();
                }}
              >
                Copy WhatsApp message
              </Button>
              <a
                className={buttonClass("secondary")}
                href={`https://wa.me/?text=${encodeURIComponent(buildWhatsappText())}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open WhatsApp
              </a>
              <Button
                type="button"
                variant="secondary"
                disabled={!itineraryId || docxLoading}
                onClick={() => {
                  if (!itineraryId) return;
                  if (!canMutate) return;
                  setMsg(null);
                  setDocxLoading(true);
                  void (async () => {
                    try {
                      const res = await exportDocx({
                        sessionToken,
                        itineraryId,
                      });
                      window.open(res.url, "_blank", "noopener,noreferrer");
                    } catch (e) {
                      setMsg(toUserFacingErrorMessage(e));
                    } finally {
                      setDocxLoading(false);
                    }
                  })();
                }}
              >
                {docxLoading ? "Preparing…" : "Download Word"}
              </Button>
              <PDFDownloadLink
                document={<ItineraryPdf key={pdfRenderKey} model={pdfModel} />}
                fileName={`${(title || "itinerary").replace(/\s+/g, "-").toLowerCase()}.pdf`}
              >
                {({ loading }) => (
                  <Button type="button" disabled={loading || pdfHasUnresolvedImages}>
                    {loading ? "Preparing…" : pdfHasUnresolvedImages ? "Loading images…" : "Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
              <Button
                type="button"
                variant="secondary"
                disabled={!itineraryId}
                onClick={() => {
                  if (!itineraryId) return;
                  void (async () => {
                    try {
                      await markFinal({ sessionToken, itineraryId });
                      setMsg("Marked as final.");
                    } catch (e) {
                      setMsg(toUserFacingErrorMessage(e));
                    }
                  })();
                }}
              >
                Mark as final
              </Button>
            </div>
          </div>
        ) : null}
      </WizardLayout>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Itinerary preview"
        description="This is the PDF preview (Option A)."
        panelClassName="max-w-5xl"
        fullscreenOnMobile
      >
        <div className="relative flex h-[82dvh] flex-col overflow-hidden rounded-xl border border-border bg-white sm:h-[75dvh]">
          <div className="min-h-0 flex-1">
            <PDFViewer style={{ width: "100%", height: "100%" }}>
              <ItineraryPdf key={pdfRenderKey} model={pdfModel} />
            </PDFViewer>
          </div>
          <div className="z-10 flex items-center justify-between gap-2 border-t border-border bg-slate-900 px-3 py-2 text-white sm:px-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreviewOpen(false)}
              className="border-white/15 bg-white/10 text-white hover:bg-white/15"
            >
              Close
            </Button>
            <PDFDownloadLink
              document={<ItineraryPdf key={pdfRenderKey} model={pdfModel} />}
              fileName={`${(title || "itinerary").replace(/\s+/g, "-").toLowerCase()}.pdf`}
            >
              {({ loading }) => (
                <Button type="button" disabled={loading || pdfHasUnresolvedImages}>
                  {loading ? "Preparing…" : pdfHasUnresolvedImages ? "Loading images…" : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </Modal>
    </>
  );
}

