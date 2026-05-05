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
import { Button } from "@/components/ui/Button";
import { isoDateRangeLabel } from "@/lib/dates";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";
import { PDFDownloadLink, PDFViewer, pdf } from "@react-pdf/renderer";
import { ItineraryPdf, type ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";
import { alignHotelsToRows, tiersToPackagesForPdf } from "@/lib/itineraryPackageMatrix";
import type { PackageStayRow, PackageTier } from "@/lib/itineraryPackageMatrix";

type Theme = "luxury" | "minimal" | "adventure";

type AtGlanceDay = {
  dayNumber: number;
  title: string;
  detail: string;
  overnight?: string;
};

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

function syncAtGlanceToDayCount(
  prev: AtGlanceDay[],
  newDays: number,
): AtGlanceDay[] {
  const safe = clamp(newDays, 1, 60);
  const next = prev.slice(0, safe);
  while (next.length < safe) {
    const d = next.length + 1;
    next.push({ dayNumber: d, title: `Day ${d}`, detail: "" });
  }
  return next.map((row, i) => ({ ...row, dayNumber: i + 1 }));
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
  startDate: string;
  endDate: string;
  days: number;
  theme: Theme;
  layoutVariant?: "simple" | "advanced";
  atGlanceDays?: AtGlanceDay[];
  packageStayRows?: Array<{ location: string }>;
  packageTiers?: PackageTier[];
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
      title: String(d.title ?? "").trim() || `Day ${idx + 1}`,
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
): { rows: PackageStayRow[]; tiers: PackageTier[] } {
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

  const rows: PackageStayRow[] = locations.map((location) => ({ location }));
  const tiers: PackageTier[] = packages.map((p) => {
    const hotels = rows.map(() => ({ hotel: "", nights: 1 }));
    for (const s of p.stays ?? []) {
      const idx = ensureLocation(s.location);
      if (idx < 0) continue;
      hotels[idx] = {
        hotel: String(s.hotel ?? "").trim(),
        nights: Math.max(1, Math.floor(Number(s.nights) || 1)),
      };
    }
    return {
      name: String(p.name ?? "").trim() || "Package",
      pricePkr: typeof p.pricePkr === "number" ? p.pricePkr : undefined,
      vehicle:
        typeof p.vehicle === "string" && p.vehicle.trim()
          ? p.vehicle.trim()
          : undefined,
      note:
        typeof p.note === "string" && p.note.trim() ? p.note.trim() : undefined,
      hotels,
    };
  });

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
  const [theme, setTheme] = useState<Theme>("luxury");
  const [headline, setHeadline] = useState("Your Dream Trip Awaits —");
  const [variantLabel, setVariantLabel] = useState("Customised");
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [complianceLine, setComplianceLine] = useState(
    "JunketTours — Government Registered Tourism Company | DTS",
  );
  const [pickupDropoff, setPickupDropoff] = useState("");
  const [atGlanceDays, setAtGlanceDays] = useState<AtGlanceDay[]>([
    { dayNumber: 1, title: "Day 1", detail: "" },
  ]);
  const [packageStayRows, setPackageStayRows] = useState<PackageStayRow[]>([
    { location: "" },
  ]);
  const [packageTiers, setPackageTiers] = useState<PackageTier[]>([
    {
      name: "Standard",
      pricePkr: undefined,
      vehicle: "",
      note: "",
      hotels: [{ hotel: "", nights: 1 }],
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

  const computedDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T00:00:00`);
    if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) return null;
    const diff = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
    if (diff < 1) return null;
    return clamp(diff, 1, 60);
  }, [startDate, endDate]);

  useEffect(() => {
    if (computedDays == null) return;
    setAtGlanceDays((prev) => syncAtGlanceToDayCount(prev, computedDays));
  }, [computedDays]);

  useEffect(() => {
    const rowCount = packageStayRows.length;
    setPackageTiers((prev) => alignHotelsToRows(prev, rowCount));
  }, [packageStayRows.length]);

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
    setTheme(existing.theme ?? "luxury");
    setHeadline(existing.headline ?? "Your Dream Trip Awaits —");
    setVariantLabel(existing.variantLabel ?? "Customised");
    setCoverSubtitle(existing.coverSubtitle ?? "");
    setComplianceLine(
      existing.complianceLine ??
        "JunketTours — Government Registered Tourism Company | DTS",
    );
    setPickupDropoff(existing.pickupDropoff ?? "");

    if (existing.atGlanceDays?.length) {
      setAtGlanceDays(
        existing.atGlanceDays.map((d) => ({
          dayNumber: d.dayNumber,
          title: d.title,
          detail: d.detail,
          overnight: d.overnight,
        })),
      );
    }

    if (existing.packageStayRows?.length) {
      setPackageStayRows(existing.packageStayRows.map((r) => ({ ...r })));
    }
    if (existing.packageTiers?.length) {
      const rc =
        existing.packageStayRows?.length ??
        existing.packageTiers[0]?.hotels.length ??
        1;
      setPackageTiers(
        alignHotelsToRows(existing.packageTiers as PackageTier[], rc),
      );
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
    const needsMatrix =
      !existing.packageStayRows ||
      existing.packageStayRows.length === 0 ||
      !existing.packageTiers ||
      existing.packageTiers.length === 0;
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
      const { rows, tiers } = legacyPackagesToMatrix(existing.packages);
      const safeRows = rows.length > 0 ? rows : [{ location: "" }];
      const safeTiers =
        tiers.length > 0
          ? tiers
          : [
              {
                name: "Standard",
                pricePkr: undefined,
                vehicle: "",
                note: "",
                hotels: [],
              },
            ];
      setPackageStayRows(safeRows);
      setPackageTiers(alignHotelsToRows(safeTiers, safeRows.length));
      patch.packageStayRows = safeRows;
      patch.packageTiers = alignHotelsToRows(safeTiers, safeRows.length);
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

  const safeDays = clamp(computedDays ?? (existing?.days ?? 5), 1, 60);
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
        hotels: tier.hotels.map((h: { hotel: string; nights: number }) => ({
          ...h,
          nights: h.nights === prev ? next : h.nights,
        })),
      })),
    );
  }, [defaultHotelNights]);

  const pdfModel: ItineraryPdfModel = useMemo(() => {
    const included = includedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const notIncluded = notIncludedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const tiersAligned = alignHotelsToRows(packageTiers, packageStayRows.length);
    const packages = tiersToPackagesForPdf(packageStayRows, tiersAligned);

    const settings = adminSettings;
    const licence =
      (settings as { governmentLicenseNo?: string })?.governmentLicenseNo?.trim() ||
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
      companyName: "JunketTours",
      contact: {
        phone: settings?.whatsappPhone?.trim() || undefined,
        email: settings?.contactEmail?.trim() || undefined,
        website: (settings as { website?: string })?.website?.trim() || undefined,
        officeAddress: settings?.officeAddress?.trim() || undefined,
      },
      coverImageUrl: toAbsoluteUrl(`/maps/${mapFallback}`),
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
    packageStayRows,
    packageTiers,
    pickupDropoff,
    safeDays,
    startDate,
    endDate,
    title,
    variantLabel,
  ]);

  const [previewModel, setPreviewModel] = useState<ItineraryPdfModel>(pdfModel);
  const previewTimer = useRef<number | null>(null);

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
      complianceLine,
      pickupDropoff,
      title,
      clientName,
      startDate,
      endDate,
      days: safeDays,
      theme,
      atGlanceDays,
      packageStayRows,
      packageTiers: alignHotelsToRows(packageTiers, packageStayRows.length),
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
    complianceLine,
    pickupDropoff,
    title,
    clientName,
    startDate,
    endDate,
    safeDays,
    theme,
    atGlanceDays,
    packageStayRows,
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
      const d = computedDays ?? 5;
      const id = await createDraft({
        sessionToken,
        title: title || "Untitled itinerary",
        clientName: clientName || "Client",
        startDate: startDate || minDate,
        endDate: endDate || minDate,
        days: d,
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
              document={<ItineraryPdf model={pdfModel} />}
              fileName={`${(title || "itinerary").replace(/\s+/g, "-").toLowerCase()}.pdf`}
              className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Download PDF
            </PDFDownloadLink>
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
                <FieldLabel required>Start date</FieldLabel>
                <TextInput
                  type="date"
                  min={minDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>End date</FieldLabel>
                <TextInput
                  type="date"
                  min={startDate || minDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Days</FieldLabel>
                <TextInput type="number" readOnly value={computedDays ?? ""} />
                <FieldHint>From start and end date.</FieldHint>
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
                  disabled={
                    creatingDraft ||
                    !title.trim() ||
                    !clientName.trim() ||
                    !startDate ||
                    !endDate ||
                    computedDays == null
                  }
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
                    <FieldLabel>Compliance line</FieldLabel>
                    <TextInput
                      value={complianceLine}
                      onChange={(e) => setComplianceLine(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Itinerary at a glance
                </p>
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
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    Packages (shared stay rows)
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setPackageStayRows((r) => [...r, { location: "" }]);
                      setPackageTiers((prev) =>
                        prev.map((t) => ({
                          ...t,
                          hotels: [...t.hotels, { hotel: "", nights: defaultHotelNights }],
                        })),
                      );
                    }}
                  >
                    + Add stay row
                  </Button>
                </div>
                <div className="mt-4 space-y-6">
                  {packageTiers.map((tier, tIdx) => (
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
                              const clone: PackageTier = {
                                name: src.name ? `${src.name} (copy)` : "",
                                pricePkr: src.pricePkr,
                                vehicle: src.vehicle,
                                note: src.note,
                                hotels: src.hotels.map((h: { hotel: string; nights: number }) => ({
                                  hotel: h.hotel,
                                  nights: h.nights,
                                })),
                              };
                              const next = [...prev];
                              next.splice(tIdx + 1, 0, clone);
                              return alignHotelsToRows(next, packageStayRows.length);
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
                      <div className="mt-3">
                        <div className="space-y-3">
                          <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_96px_28px] md:gap-2 md:text-xs md:font-bold md:uppercase md:tracking-wide md:text-muted">
                            <div>Location</div>
                            <div>Hotel</div>
                            <div>Nights</div>
                            <div />
                          </div>

                          {packageStayRows.map((row, ri) => (
                            <div
                              key={ri}
                              className="rounded-xl border border-border/60 bg-panel p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0"
                            >
                              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_96px_28px] md:items-start">
                                <div className="min-w-0">
                                  <p className="md:hidden text-[11px] font-bold uppercase tracking-wide text-muted">
                                    Location
                                  </p>
                                  {tIdx === 0 ? (
                                    <TextInput
                                      value={row.location}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setPackageStayRows((prev) =>
                                          prev.map((x, i) =>
                                            i === ri ? { ...x, location: v } : x,
                                          ),
                                        );
                                      }}
                                      placeholder="e.g. Skardu"
                                    />
                                  ) : (
                                    <div className="mt-1 md:mt-0 text-sm text-muted">
                                      {row.location || "—"}
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="md:hidden text-[11px] font-bold uppercase tracking-wide text-muted">
                                    Hotel
                                  </p>
                                  <TextInput
                                    value={tier.hotels[ri]?.hotel ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setPackageTiers((prev) =>
                                        prev.map((x, i) => {
                                          if (i !== tIdx) return x;
                                          const hotels = [...x.hotels];
                                          hotels[ri] = {
                                            hotel: v,
                                            nights: hotels[ri]?.nights ?? 1,
                                          };
                                          return { ...x, hotels };
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
                                    value={tier.hotels[ri]?.nights ?? 1}
                                    onChange={(e) => {
                                      const n = Number(e.target.value);
                                      setPackageTiers((prev) =>
                                        prev.map((x, i) => {
                                          if (i !== tIdx) return x;
                                          const hotels = [...x.hotels];
                                          hotels[ri] = {
                                            hotel: hotels[ri]?.hotel ?? "",
                                            nights: Math.max(1, n || 1),
                                          };
                                          return { ...x, hotels };
                                        }),
                                      );
                                    }}
                                  />
                                </div>

                                <div className="flex items-center justify-end">
                                  {tIdx === 0 && ri > 0 ? (
                                    <button
                                      type="button"
                                      className="text-xs font-semibold text-red-600"
                                      onClick={() => {
                                        setPackageStayRows((prev) =>
                                          prev.filter((_, i) => i !== ri),
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
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const rowCount = packageStayRows.length;
                      setPackageTiers((prev) => [
                        ...prev,
                        {
                          name: "",
                          pricePkr: undefined,
                          vehicle: "",
                          note: "",
                          hotels: Array.from({ length: rowCount }, () => ({
                            hotel: "",
                            nights: defaultHotelNights,
                          })),
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
