"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Button } from "@/components/ui/Button";
import { TOUR_TYPE_OPTIONS, parseTourType, type TourTypeFilter } from "@/lib/tour-filters";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import type { TourPdfImportDraft } from "@/lib/tourPdf/types";

type TourTicketGroup = { label: string; ageRange?: string };

type TourThemeFields = {
  maxPeople?: number;
  minAge?: number;
  tourTypeLabel?: string;
  ratingAvg?: number;
  reviewsCount?: number;
  pricePkr?: number;
  priceUsd?: number;
  highlights?: string[];
  included?: string[];
  excluded?: string[];
  timeSlots?: string[];
  ticketGroups?: TourTicketGroup[];
};

type TourDoc = Doc<"tours"> & TourThemeFields;

const defaultItinerary: Doc<"tours">["itinerary"] = [
  {
    day: 0,
    title: "Day 0",
    description: "Update itinerary details in the editor.",
  },
];

/** Some browsers/OSes leave `File.type` empty even for real images from “Choose file”. */
function isProbablyImageFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|avif|bmp|heic)$/i.test(f.name);
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function TourImageThumbPreview({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  if (broken) {
    return (
      <div className="flex h-full items-center justify-center px-1 text-center text-[10px] font-medium text-slate-500">
        Image unavailable
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- blob + Convex URLs */
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

const officeOptions = [
  "Lahore Office",
  "Islamabad Office",
  "Karachi Office",
  "Skardu Office",
];

const emailPrefixOptions = ["hello", "bookings", "travel", "adventures"];

const emailDomainOptions = [
  "junkettours.example",
  "traveldesk.example",
  "adventures.example",
  "explore.example",
];

function pickRandomValue(values: string[]) {
  return values[Math.floor(Math.random() * values.length)] ?? values[0] ?? "";
}

function fallbackOffice() {
  return pickRandomValue(officeOptions);
}

function fallbackEmail(seed?: string) {
  const normalizedSeed = seed
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  const prefix = pickRandomValue(emailPrefixOptions);
  const domain = pickRandomValue(emailDomainOptions);
  return `${prefix}${normalizedSeed ? `.${normalizedSeed}` : ""}@${domain}`;
}

export function AdminTourForm({
  mode,
  tourId,
  initialDraft,
}: {
  mode: "create" | "edit";
  tourId?: Id<"tours">;
  initialDraft?: TourPdfImportDraft | null;
}) {
  const router = useRouter();
  const sessionToken = useConvexSessionToken();
  const hasConvexSessionToken = typeof sessionToken === "string";

  const destinations = useQuery(api.destinations.listForTourAssignment, {});
  const provinces = useQuery(api.provinces.listForTourAssignment, {});
  const createTour = useMutation(api.tours.createTour);
  const updateTour = useMutation(api.tours.updateTour);
  const generateUploadUrl = useMutation(api.media.generateTourImageUploadUrl);

  const tourData = useQuery(
    api.tours.getTourForAdmin,
    mode === "edit" && tourId && hasConvexSessionToken
      ? { tourId, sessionToken }
      : "skip",
  );

  const [initialized, setInitialized] = useState(mode === "create");
  const initializedRef = useRef(mode === "create");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [types, setTypes] = useState<TourTypeFilter[]>([]);
  const [destinationIds, setDestinationIds] = useState<Id<"destinations">[]>([]);
  const [provinceIds, setProvinceIds] = useState<Id<"provinces">[]>([]);
  const [durationDays, setDurationDays] = useState(5);
  const [location, setLocation] = useState("Gilgit-Baltistan");
  const [maxPeople, setMaxPeople] = useState<number | "">("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [tourTypeLabel, setTourTypeLabel] = useState("");
  const [pricePkr, setPricePkr] = useState<number | "">("");
  const [priceUsd, setPriceUsd] = useState<number | "">("");
  const [ratingAvg, setRatingAvg] = useState<number | "">("");
  const [reviewsCount, setReviewsCount] = useState<number | "">("");
  const [office, setOffice] = useState(fallbackOffice);
  const [email, setEmail] = useState(() => fallbackEmail("new-tour"));
  const [imageRefs, setImageRefs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [itineraryDays, setItineraryDays] = useState<Doc<"tours">["itinerary"]>(
    () => [...defaultItinerary],
  );
  const [highlightsInput, setHighlightsInput] = useState(
    "Discover scenic viewpoints\nLocal culture & food\nComfortable private transport",
  );
  const [includedInput, setIncludedInput] = useState(
    "24/7 Expert assistance\nProfessional driver\nFuel & tolls\nHotel pickup & drop off",
  );
  const [excludedInput, setExcludedInput] = useState("Flights\nPersonal expenses\nTips");
  const [timeSlotsInput, setTimeSlotsInput] = useState("08:00\n10:00\n12:00");
  const [ticketGroupsInput, setTicketGroupsInput] = useState(
    "Adult (18+)\nYouth (13-17)\nChildren (0-12)",
  );
  const [isActive, setIsActive] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfImportWarnings, setPdfImportWarnings] = useState<string[]>([]);
  /** `blob:` URLs for files being uploaded (key = temporary ref in `imageRefs`). */
  const [pendingFilePreviews, setPendingFilePreviews] = useState<Record<string, string>>({});

  const clearAllPendingPreviews = useCallback(() => {
    setPendingFilePreviews((p) => {
      for (const u of Object.values(p)) URL.revokeObjectURL(u);
      return {};
    });
  }, []);

  useEffect(() => () => clearAllPendingPreviews(), [clearAllPendingPreviews]);

  function updateDay(idx: number, patch: Partial<Doc<"tours">["itinerary"][number]>) {
    setItineraryDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }
  function addDay() {
    setItineraryDays((prev) => [
      ...prev,
      {
        day: prev.length ? (prev[prev.length - 1]!.day ?? prev.length - 1) + 1 : 1,
        title: "",
        description: "",
      },
    ]);
  }
  function removeDay(idx: number) {
    setItineraryDays((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [...defaultItinerary];
    });
  }
  function moveDay(idx: number, dir: -1 | 1) {
    setItineraryDays((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j]!, next[idx]!];
      return next;
    });
  }

  /** Matches server slug normalization so uploads align with `tours.imageFolderKey`. */
  const derivedTourSlugForFolder = useMemo(() => {
    const fromSlug = slug.trim();
    if (fromSlug) return slugify(fromSlug);
    return slugify(title) || "new-tour";
  }, [slug, title]);

  const imageUploadFolderKey = useMemo(
    () => `tours/${derivedTourSlugForFolder}`,
    [derivedTourSlugForFolder],
  );

  const imagePreviewUrls = useQuery(
    api.media.resolveStorageIdsForAdmin,
    hasConvexSessionToken && imageRefs.length > 0
      ? { sessionToken, ids: imageRefs }
      : "skip",
  );

  // ── Populate from an existing tour (edit mode), once. ──────────────────────
  useEffect(() => {
    if (mode !== "edit" || initializedRef.current || !tourData) return;
    initializedRef.current = true;
    const t = tourData as TourDoc;
    setTitle(t.title);
    setSlug(t.slug);
    setDescription(t.description);
    setDestinationIds(
      [
        ...(Array.isArray(t.destinationIds) ? t.destinationIds : []),
        ...(t.destinationId ? [t.destinationId] : []),
      ].filter((id, index, all) => all.indexOf(id) === index),
    );
    setProvinceIds(Array.isArray(t.provinceIds) ? [...t.provinceIds] : []);
    setTypes(
      (Array.isArray(t.types) ? t.types : []).filter((x): x is TourTypeFilter =>
        TOUR_TYPE_OPTIONS.some((opt) => opt.value === x),
      ),
    );
    setDurationDays(t.durationDays);
    setLocation(t.location);
    setMaxPeople(typeof t.maxPeople === "number" ? t.maxPeople : "");
    setMinAge(typeof t.minAge === "number" ? t.minAge : "");
    setTourTypeLabel(typeof t.tourTypeLabel === "string" ? t.tourTypeLabel : "");
    setPricePkr(typeof t.pricePkr === "number" ? t.pricePkr : "");
    setPriceUsd(typeof t.priceUsd === "number" ? t.priceUsd : "");
    setRatingAvg(typeof t.ratingAvg === "number" ? t.ratingAvg : "");
    setReviewsCount(typeof t.reviewsCount === "number" ? t.reviewsCount : "");
    setOffice(t.office ?? fallbackOffice());
    setEmail(t.email ?? fallbackEmail(t.slug || t.title));
    setImageRefs([...t.images]);
    setItineraryDays(t.itinerary.length ? t.itinerary : [...defaultItinerary]);
    setHighlightsInput(Array.isArray(t.highlights) ? t.highlights.join("\n") : "");
    setIncludedInput(Array.isArray(t.included) ? t.included.join("\n") : "");
    setExcludedInput(Array.isArray(t.excluded) ? t.excluded.join("\n") : "");
    setTimeSlotsInput(Array.isArray(t.timeSlots) ? t.timeSlots.join("\n") : "");
    setTicketGroupsInput(
      Array.isArray(t.ticketGroups)
        ? t.ticketGroups
            .map((g) => (g.ageRange ? `${g.label} (${g.ageRange})` : String(g.label)))
            .filter((x) => x.trim().length > 0)
            .join("\n")
        : "",
    );
    setIsActive(t.isActive);
    setInitialized(true);
  }, [mode, tourData]);

  // ── Prefill from a PDF import draft (create mode), once. ───────────────────
  useEffect(() => {
    if (mode !== "create" || !initialDraft) return;
    if (initializedRef.current && title) return; // already applied
    if (!destinations || !provinces) return; // need lookups to map slugs → ids
    initializedRef.current = true;
    const draft = initialDraft;
    setTitle(draft.title);
    setSlug(draft.slug);
    setDescription(draft.description);
    setTypes(
      draft.types
        .map((t) => parseTourType(t))
        .filter((t): t is TourTypeFilter => t !== null),
    );
    setDestinationIds(
      draft.destinationSlugs
        .map((s) => destinations.find((d) => d.slug === s)?._id)
        .filter((id): id is NonNullable<typeof id> => Boolean(id)),
    );
    setProvinceIds(
      draft.provinceSlugs
        .map((s) => provinces.find((p) => p.slug === s)?._id)
        .filter((id): id is NonNullable<typeof id> => Boolean(id)),
    );
    setDurationDays(draft.durationDays);
    setLocation(draft.location);
    setMaxPeople(typeof draft.maxPeople === "number" ? draft.maxPeople : "");
    setMinAge(typeof draft.minAge === "number" ? draft.minAge : "");
    setTourTypeLabel(draft.tourTypeLabel ?? "Heritage & Culture tours");
    setPricePkr(typeof draft.pricePkr === "number" ? draft.pricePkr : "");
    setPriceUsd(typeof draft.priceUsd === "number" ? draft.priceUsd : "");
    setOffice(fallbackOffice());
    setEmail(fallbackEmail(draft.slug || draft.title));
    setItineraryDays(draft.itinerary.length ? draft.itinerary : [...defaultItinerary]);
    setHighlightsInput(draft.highlights.join("\n"));
    setIncludedInput(draft.included.join("\n"));
    setExcludedInput(draft.excluded.join("\n"));
    setTimeSlotsInput(
      Array.isArray(draft.timeSlots) && draft.timeSlots.length > 0
        ? draft.timeSlots.join("\n")
        : "08:00\n10:00\n12:00",
    );
    setTicketGroupsInput(
      Array.isArray(draft.ticketGroups) && draft.ticketGroups.length > 0
        ? draft.ticketGroups
            .map((g) => (g.ageRange ? `${g.label} (${g.ageRange})` : String(g.label)))
            .join("\n")
        : "Adult (18+)\nYouth (13-17)\nChildren (0-12)",
    );
    setIsActive(false);
    setPdfImportWarnings(draft.warnings);
    setMsg(
      draft.enrichedByLlm
        ? "Imported from document — review fields, add price & images, then save."
        : "Imported from document (rules only) — review slug, description, and destinations.",
    );
  }, [mode, initialDraft, destinations, provinces, title]);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = input.files;
    const resetFileInput = () => {
      input.value = "";
    };
    if (!files?.length) {
      resetFileInput();
      return;
    }
    if (!hasConvexSessionToken) {
      setMsg(
        sessionToken === undefined
          ? "Your session is still loading. Wait a moment, then choose images again."
          : "You need a valid admin session to upload. Refresh the page or sign in again.",
      );
      resetFileInput();
      return;
    }
    const token = sessionToken;
    const filesArr = Array.from(files).filter(isProbablyImageFile);
    if (filesArr.length === 0) {
      setMsg("No image files detected. Use JPEG, PNG, WebP, or another common image format.");
      resetFileInput();
      return;
    }
    const entries = filesArr.map((file) => {
      const tempId = `__pending_${crypto.randomUUID()}`;
      return { file, tempId, objectUrl: URL.createObjectURL(file) };
    });
    setPendingFilePreviews((prev) => {
      const n = { ...prev };
      for (const { tempId, objectUrl } of entries) n[tempId] = objectUrl;
      return n;
    });
    setImageRefs((prev) => [...prev, ...entries.map((x) => x.tempId)]);
    setUploading(true);
    setMsg(null);
    try {
      for (const { file, tempId, objectUrl } of entries) {
        try {
          const postUrl = await generateUploadUrl({
            sessionToken: token,
            folderKey: imageUploadFolderKey,
          });
          const contentType = file.type || "image/jpeg";
          const res = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": contentType },
            body: file,
          });
          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
          const data = (await res.json()) as { storageId?: string };
          if (!data.storageId) throw new Error("No storageId from upload");
          URL.revokeObjectURL(objectUrl);
          setPendingFilePreviews((prev) => {
            const rest = { ...prev };
            delete rest[tempId];
            return rest;
          });
          setImageRefs((prev) => prev.map((r) => (r === tempId ? data.storageId! : r)));
        } catch (inner) {
          URL.revokeObjectURL(objectUrl);
          setPendingFilePreviews((prev) => {
            const rest = { ...prev };
            delete rest[tempId];
            return rest;
          });
          setImageRefs((prev) => prev.filter((r) => r !== tempId));
          throw inner;
        }
      }
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    } finally {
      setUploading(false);
      resetFileInput();
    }
  }

  function removeImageAt(index: number) {
    setImageRefs((prev) => {
      const ref = prev[index];
      if (ref) {
        setPendingFilePreviews((p) => {
          const url = p[ref];
          if (!url) return p;
          URL.revokeObjectURL(url);
          const rest = { ...p };
          delete rest[ref];
          return rest;
        });
      }
      return prev.filter((_, j) => j !== index);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const itinerary: Doc<"tours">["itinerary"] = itineraryDays
      .map((d, i) => ({
        day: typeof d.day === "number" ? d.day : i + 1,
        title: d.title.trim(),
        description: d.description.trim(),
      }))
      .filter((d) => d.title || d.description);
    if (itinerary.length === 0) {
      setMsg("Add at least one itinerary day with a title.");
      return;
    }
    const images = imageRefs.filter((r) => Boolean(r) && !r.startsWith("__pending_"));
    if (imageRefs.some((r) => r.startsWith("__pending_"))) {
      setMsg("Wait for image uploads to finish before saving.");
      return;
    }
    const parseLines = (raw: string) =>
      raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    const highlights = parseLines(highlightsInput);
    const included = parseLines(includedInput);
    const excluded = parseLines(excludedInput);
    const timeSlots = parseLines(timeSlotsInput);
    const ticketGroups = parseLines(ticketGroupsInput).map((line) => {
      const m = line.match(/^(.*?)(?:\s*\((.+)\))?$/);
      const label = (m?.[1] ?? line).trim();
      const ageRange = (m?.[2] ?? "").trim() || undefined;
      return { label, ageRange };
    });
    const uniqueDestinationIds = Array.from(new Set(destinationIds));
    const uniqueProvinceIds = Array.from(new Set(provinceIds));
    const finalSlug = slug ? slugify(slug) : slugify(title);

    setSaving(true);
    try {
      if (mode === "edit" && tourId) {
        // `null` clears an optional field; `updateTour` maps null → field removal.
        await updateTour({
          tourId,
          title,
          slug: finalSlug,
          description,
          types,
          destinationIds: uniqueDestinationIds,
          destinationId: uniqueDestinationIds[0],
          provinceIds: uniqueProvinceIds,
          durationDays,
          location,
          pricePkr: pricePkr === "" ? null : pricePkr,
          priceUsd: priceUsd === "" ? null : priceUsd,
          maxPeople: maxPeople === "" ? null : maxPeople,
          minAge: minAge === "" ? null : minAge,
          tourTypeLabel: tourTypeLabel.trim() || null,
          ratingAvg: ratingAvg === "" ? null : ratingAvg,
          reviewsCount: reviewsCount === "" ? null : reviewsCount,
          office,
          email,
          images,
          itinerary,
          highlights,
          included,
          excluded,
          timeSlots,
          ticketGroups,
          isActive,
        });
      } else {
        await createTour({
          title,
          slug: finalSlug,
          description,
          types,
          destinationIds: uniqueDestinationIds,
          destinationId: uniqueDestinationIds[0],
          provinceIds: uniqueProvinceIds,
          durationDays,
          location,
          pricePkr: pricePkr === "" ? undefined : pricePkr,
          priceUsd: priceUsd === "" ? undefined : priceUsd,
          maxPeople: maxPeople === "" ? undefined : maxPeople,
          minAge: minAge === "" ? undefined : minAge,
          tourTypeLabel: tourTypeLabel.trim() || undefined,
          ratingAvg: ratingAvg === "" ? undefined : ratingAvg,
          reviewsCount: reviewsCount === "" ? undefined : reviewsCount,
          office,
          email,
          images,
          itinerary,
          highlights,
          included,
          excluded,
          timeSlots,
          ticketGroups,
          isActive,
        });
      }
      router.push("/admin/tours");
      router.refresh();
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
      setSaving(false);
    }
  }

  if (mode === "edit" && sessionToken === null) {
    return (
      <p className="text-sm text-amber-800">
        Log in with an admin session to edit tours.
      </p>
    );
  }
  if (mode === "edit" && tourData === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-700">Tour not found (or you don’t have access).</p>
        <Link href="/admin/tours" className="text-sm font-semibold text-brand-primary hover:underline">
          ← Back to tours
        </Link>
      </div>
    );
  }
  if (mode === "edit" && !initialized) {
    return <p className="text-sm text-brand-muted">Loading tour…</p>;
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/tours"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to tours
      </Link>

      <form onSubmit={onSubmit} className="space-y-3">
        {pdfImportWarnings.length > 0 ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
            <p className="font-semibold">PDF import checklist</p>
            <ul className="mt-1 list-inside list-disc text-sky-900">
              {pdfImportWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {msg ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</p>
        ) : null}
        {!hasConvexSessionToken ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {sessionToken === undefined
              ? "Loading your admin session for uploads…"
              : "Log in with an admin session to save changes and upload images."}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">
            Title
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Slug
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="auto from title if empty"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </label>
        </div>
        <label className="block text-xs font-semibold text-slate-600">
          Description
          <textarea
            required
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">Tour types</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {TOUR_TYPE_OPTIONS.map((opt) => {
              const checked = types.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTypes((prev) => (prev.includes(opt.value) ? prev : [...prev, opt.value]));
                        return;
                      }
                      setTypes((prev) => prev.filter((x) => x !== opt.value));
                    }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">Destinations</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {(destinations ?? []).map((d) => {
              const checked = destinationIds.includes(d._id);
              return (
                <label key={d._id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setDestinationIds((prev) => {
                        if (e.target.checked) return prev.includes(d._id) ? prev : [...prev, d._id];
                        return prev.filter((id) => id !== d._id);
                      });
                    }}
                  />
                  {d.name}
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">Provinces</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {(provinces ?? []).map((p) => {
              const checked = provinceIds.includes(p._id);
              return (
                <label key={p._id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setProvinceIds((prev) => {
                        if (e.target.checked) return prev.includes(p._id) ? prev : [...prev, p._id];
                        return prev.filter((id) => id !== p._id);
                      });
                    }}
                  />
                  {p.name}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">
            Duration (days)
            <input
              type="number"
              required
              min={1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Location
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>
        </div>

        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">Pricing</legend>
          <p className="mb-2 text-xs text-slate-500">
            Set a price to publish this tour with a public price and a{" "}
            <span className="font-semibold">Book now</span> button. Leave both blank to keep it as a{" "}
            <span className="font-semibold">Customise</span> (request-a-quote) tour.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              Price (USD) — shown to international visitors
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. 1200"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Price (PKR) — shown to Pakistan visitors
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. 250000"
                value={pricePkr}
                onChange={(e) => setPricePkr(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">Facts row</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <label className="block text-xs font-semibold text-slate-600">
              Max people
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={maxPeople}
                onChange={(e) => setMaxPeople(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Min age
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Tour type label
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. Honeymoon tours"
                value={tourTypeLabel}
                onChange={(e) => setTourTypeLabel(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-xs font-semibold text-slate-600">
              Rating avg
              <input
                type="number"
                min={0}
                max={5}
                step="0.1"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={ratingAvg}
                onChange={(e) => setRatingAvg(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Reviews count
              <input
                type="number"
                min={0}
                step="1"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={reviewsCount}
                onChange={(e) => setReviewsCount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-600">
            Highlights (one per line)
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={highlightsInput}
              onChange={(e) => setHighlightsInput(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            What’s included (one per line)
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={includedInput}
              onChange={(e) => setIncludedInput(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Not included (one per line)
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={excludedInput}
              onChange={(e) => setExcludedInput(e.target.value)}
            />
          </label>
        </div>

        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">Booking form fields</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              Time slots (one per line)
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={timeSlotsInput}
                onChange={(e) => setTimeSlotsInput(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Ticket groups (one per line, optional “(age range)”)
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={ticketGroupsInput}
                onChange={(e) => setTicketGroupsInput(e.target.value)}
                placeholder={"Adult (18+)\nChildren (0-12)"}
              />
            </label>
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">
            Office
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active (visible on site)
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold text-slate-700">Tour images</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload image files from your device — they are stored securely in Convex. Uploaded
            images register under this tour when you save.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-700">Image folder</span>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-800 ring-1 ring-slate-200">
              {imageUploadFolderKey}
            </code>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-brand-primary hover:bg-slate-50">
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploading || !hasConvexSessionToken}
                onChange={(e) => void onPickFiles(e)}
              />
              {uploading
                ? "Uploading…"
                : !hasConvexSessionToken && sessionToken === undefined
                  ? "Preparing uploads…"
                  : "Choose images"}
            </label>
          </div>
          {imageRefs.length > 0 ? (
            <ul className="mt-4 space-y-3 border-t border-slate-200 pt-3">
              {imageRefs.map((ref, i) => {
                const localBlob = pendingFilePreviews[ref];
                const remote = imagePreviewUrls?.[i];
                const src = localBlob ?? remote ?? null;
                const waitingRemote =
                  !src && imagePreviewUrls === undefined && !ref.startsWith("__pending_");
                return (
                  <li key={`${ref}-${i}`} className="flex items-start gap-3 text-xs">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {waitingRemote ? (
                        <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden />
                      ) : src ? (
                        <TourImageThumbPreview src={src} />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[10px] font-medium text-slate-500">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="break-all font-mono text-slate-700">
                        {ref.startsWith("__pending_")
                          ? "Uploading…"
                          : ref.length > 64
                            ? `${ref.slice(0, 64)}…`
                            : ref}
                      </span>
                      <button
                        type="button"
                        className="mt-1 block text-red-600 hover:underline"
                        onClick={() => removeImageAt(i)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No images yet.</p>
          )}
        </div>

        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">Itinerary — day by day</legend>
          <div className="space-y-3">
            {itineraryDays.map((d, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Day</span>
                  <input
                    type="number"
                    className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={d.day}
                    onChange={(e) => updateDay(idx, { day: Number(e.target.value) })}
                  />
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium"
                    placeholder="Day title (e.g. Islamabad — Hunza)"
                    value={d.title}
                    onChange={(e) => updateDay(idx, { title: e.target.value })}
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="Move up"
                      className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                      disabled={idx === 0}
                      onClick={() => moveDay(idx, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                      disabled={idx === itineraryDays.length - 1}
                      onClick={() => moveDay(idx, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label="Remove day"
                      className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                      onClick={() => removeDay(idx)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="What happens this day…"
                  value={d.description}
                  onChange={(e) => updateDay(idx, { description: e.target.value })}
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 !px-3 !py-1.5 !text-xs"
            onClick={addDay}
          >
            + Add day
          </Button>
        </fieldset>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={saving || !hasConvexSessionToken}>
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create tour"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/tours")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
