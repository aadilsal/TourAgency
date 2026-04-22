/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { isoDateRangeLabel } from "@/lib/dates";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { ItineraryPdf, type ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";

type Theme = "luxury" | "minimal" | "adventure";
type ActivityIcon = "flight" | "hotel" | "food" | "sightseeing";

const DEFAULT_LOGO_URL = "/images-removebg-preview.png";

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
  const generateUploadUrl = useMutation(api.media.generateItineraryImageUploadUrl);
  const addItineraryImageAsset = useMutation(api.media.addItineraryImageAsset);
  const resolveUrls = useQuery(
    api.media.resolveStorageIdsForAdmin,
    "skip",
  );
  void resolveUrls;

  const [step, setStep] = useState(1);
  const steps = ["Basic", "Brand", "Overview", "Days", "Details", "Preview"];
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
  const [variantLabel, setVariantLabel] = useState("Customised by Air");
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
  );

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
    for (const d of dayPlans) {
      if (d.imageStorageId) ids.push(d.imageStorageId);
    }
    return ids;
  }, [coverStorageId, logoStorageId, affiliations, dayPlans]);

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
    return {
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
      coverImageUrl: coverStorageId ? (toAbsoluteUrl(idToUrl.get(coverStorageId)) ?? null) : null,
      logoUrl: logoStorageId
        ? (toAbsoluteUrl(idToUrl.get(logoStorageId)) ?? null)
        : defaultLogoUrlAbs,
      dayPlans: (dayPlans ?? []).map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        imageUrl: d.imageStorageId
          ? (toAbsoluteUrl(idToUrl.get(String(d.imageStorageId)) ?? null) ?? null)
          : null,
        highlights: d.highlights ?? [],
        overnight: d.overnight ?? undefined,
        morning: (d.morning ?? []).map((a) => ({ title: a.title, description: a.description })),
        afternoon: (d.afternoon ?? []).map((a) => ({ title: a.title, description: a.description })),
        evening: (d.evening ?? []).map((a) => ({ title: a.title, description: a.description })),
      })),
      included,
      notIncluded,
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
      paymentTerms,
      bankDetails,
      termsBlocks,
    };
  }, [
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
    packages,
    paymentTerms,
    bankDetails,
    termsBlocks,
    idToUrl,
    defaultLogoUrlAbs,
  ]);

  async function onCreateDraft() {
    if (!canMutate) return;
    if (!clientName.trim()) {
      setMsg("Enter client name to continue.");
      return;
    }
    setMsg(null);
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
    }
  }

  function next() {
    if (step === 1) {
      void onCreateDraft();
      return;
    }
    if (step === steps.length) {
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
    setStep((s) => clamp(s + 1, 1, 6));
  }

  function back() {
    setStep((s) => clamp(s - 1, 1, 6));
  }

  useEffect(() => {
    if (!existing) return;
    // Keep local state stable after initial create; don't aggressively overwrite.
  }, [existing]);

  const rightActions = (
    <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
      Preview PDF
    </Button>
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

      <WizardLayout
        title="Itinerary"
        steps={steps}
        currentStep={step}
        onBack={step === 1 ? undefined : back}
        onNext={next}
        backDisabled={step === 1}
        nextDisabled={step === 1 ? !clientName.trim() : false}
        nextLabel={step === steps.length ? "Final" : "Next"}
        savingState={itineraryId ? savingState : "idle"}
        rightActions={rightActions}
      >
        {step === 1 ? (
          <div className="space-y-4">
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
        ) : step === 2 ? (
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
        ) : step === 3 ? (
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
        ) : step === 4 ? (
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
        ) : step === 5 ? (
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
                          <button
                            type="button"
                            className="text-xs font-semibold text-brand-cta hover:underline"
                            onClick={() => {
                              setPackages((prev) => {
                                const next = prev.map((x, i) => {
                                  if (i !== idx) return x;
                                  const stays = [...(x.stays ?? []), { location: "", hotel: "", nights: 1 }];
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
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Preview and export your document. Mark as final when ready.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
                Preview
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
        )}
      </WizardLayout>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Itinerary preview"
        description="This is the PDF preview (Option A)."
        panelClassName="max-w-5xl"
        fullscreenOnMobile
      >
        <div className="relative flex h-[82vh] flex-col overflow-hidden rounded-xl border border-border bg-white sm:h-[75vh]">
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

