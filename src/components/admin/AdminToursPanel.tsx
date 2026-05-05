"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  TOUR_TYPE_OPTIONS,
  type TourTypeFilter,
} from "@/lib/tour-filters";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { asBoolean, asJson, asNumber, asString, asStringArray } from "@/lib/bulkUpload/coerce";
import { importInBatches } from "@/lib/bulkUpload/importInBatches";

type TourTicketGroup = {
  label: string;
  ageRange?: string;
};

type TourThemeFields = {
  maxPeople?: number;
  minAge?: number;
  tourTypeLabel?: string;
  ratingAvg?: number;
  reviewsCount?: number;
  /** Legacy/optional multi-currency fields (some datasets still include these). */
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
    day: 1,
    title: "Day 1",
    description: "Update itinerary details in the editor.",
  },
];

function parseItineraryJson(raw: string): Doc<"tours">["itinerary"] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Itinerary must be a non-empty JSON array.");
  }
  return parsed.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error("Invalid itinerary row");
    const o = item as Record<string, unknown>;
    const day = typeof o.day === "number" ? o.day : i + 1;
    const title = typeof o.title === "string" ? o.title : `Day ${i + 1}`;
    const description =
      typeof o.description === "string" ? o.description : "";
    return { day, title, description };
  });
}

/** Some browsers/OSes leave `File.type` empty even for real images from “Choose file”. */
function isProbablyImageFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|avif|bmp|heic)$/i.test(f.name);
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

const emailPrefixOptions = [
  "hello",
  "bookings",
  "travel",
  "adventures",
];

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

export function AdminToursPanel() {
  const sessionToken = useConvexSessionToken();
  const hasConvexSessionToken = typeof sessionToken === "string";
  const tours = useQuery(
    api.tours.getTours,
    hasConvexSessionToken
      ? { includeInactive: true, sessionToken }
      : { includeInactive: false },
  );
  const seed = useMutation(api.seed.seedSampleTours);
  const destinations = useQuery(api.destinations.listForTourAssignment, {});
  const createTour = useMutation(api.tours.createTour);
  const deleteTour = useMutation(api.tours.deleteTour);
  const updateTour = useMutation(api.tours.updateTour);
  const bulkUpsert = useMutation(api.tours.bulkUpsert);
  const backfillTourUsdPrices = useMutation(api.migrations.backfillTourUsdPrices);
  const generateUploadUrl = useMutation(api.media.generateTourImageUploadUrl);
  const ingestRemote = useAction(api.mediaActions.ingestImageFromUrl);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"tours"> | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [types, setTypes] = useState<TourTypeFilter[]>([]);
  const [destinationIds, setDestinationIds] = useState<Id<"destinations">[]>([]);
  const [pricePkr, setPricePkr] = useState(150000);
  const [priceUsd, setPriceUsd] = useState(599);
  const [durationDays, setDurationDays] = useState(5);
  const [location, setLocation] = useState("Gilgit-Baltistan");
  const [maxPeople, setMaxPeople] = useState<number | "">("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [tourTypeLabel, setTourTypeLabel] = useState("");
  const [ratingAvg, setRatingAvg] = useState<number | "">("");
  const [reviewsCount, setReviewsCount] = useState<number | "">("");
  const [office, setOffice] = useState(fallbackOffice);
  const [email, setEmail] = useState(() => fallbackEmail("new-tour"));
  const [imageRefs, setImageRefs] = useState<string[]>([]);
  const [urlIngestInput, setUrlIngestInput] = useState("");
  const [pathsInput, setPathsInput] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [itineraryJson, setItineraryJson] = useState(
    () => JSON.stringify(defaultItinerary, null, 2),
  );
  const [highlightsInput, setHighlightsInput] = useState("");
  const [includedInput, setIncludedInput] = useState("");
  const [excludedInput, setExcludedInput] = useState("");
  const [timeSlotsInput, setTimeSlotsInput] = useState("");
  const [ticketGroupsInput, setTicketGroupsInput] = useState(
    "Adult (18+)\nYouth (13-17)\nChildren (0-12)",
  );
  const [isActive, setIsActive] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  /** `blob:` URLs for files being uploaded (key = temporary ref in `imageRefs`). */
  const [pendingFilePreviews, setPendingFilePreviews] = useState<
    Record<string, string>
  >({});

  const clearAllPendingPreviews = useCallback(() => {
    setPendingFilePreviews((p) => {
      for (const u of Object.values(p)) URL.revokeObjectURL(u);
      return {};
    });
  }, []);

  useEffect(() => {
    if (!modalOpen) clearAllPendingPreviews();
  }, [modalOpen, clearAllPendingPreviews]);

  const sortedTours = useMemo(() => {
    if (!tours) return [];
    return [...tours].sort((a, b) => a.title.localeCompare(b.title));
  }, [tours]);

  /** Matches server slug normalization so uploads align with `tours.imageFolderKey`. */
  const derivedTourSlugForFolder = useMemo(() => {
    const fromSlug = slug.trim();
    if (fromSlug) {
      return fromSlug.toLowerCase().replace(/\s+/g, "-");
    }
    const fromTitle = title.trim().toLowerCase().replace(/\s+/g, "-");
    return fromTitle || "new-tour";
  }, [slug, title]);

  const imageUploadFolderKey = useMemo(
    () => `tours/${derivedTourSlugForFolder}`,
    [derivedTourSlugForFolder],
  );

  const imagePreviewUrls = useQuery(
    api.media.resolveStorageIdsForAdmin,
    modalOpen && typeof sessionToken === "string" && imageRefs.length > 0
      ? { sessionToken, ids: imageRefs }
      : "skip",
  );

  function openNew() {
    clearAllPendingPreviews();
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setTypes([]);
    setDestinationIds([]);
    setPricePkr(150000);
    setPriceUsd(599);
    setDurationDays(5);
    setLocation("Gilgit-Baltistan");
    setMaxPeople("");
    setMinAge("");
    setTourTypeLabel("Honeymoon tours");
    setRatingAvg("");
    setReviewsCount("");
    setOffice(fallbackOffice());
    setEmail(fallbackEmail("new-tour"));
    setImageRefs([]);
    setUrlIngestInput("");
    setPathsInput("");
    setItineraryJson(JSON.stringify(defaultItinerary, null, 2));
    setHighlightsInput("Discover scenic viewpoints\nLocal culture & food\nComfortable private transport");
    setIncludedInput("24/7 Expert assistance\nProfessional driver\nFuel & tolls\nHotel pickup & drop off");
    setExcludedInput("Flights\nPersonal expenses\nTips");
    setTimeSlotsInput("08:00\n10:00\n12:00");
    setTicketGroupsInput("Adult (18+)\nYouth (13-17)\nChildren (0-12)");
    setIsActive(true);
    setMsg(null);
    setModalOpen(true);
  }

  function openEdit(t: TourDoc) {
    clearAllPendingPreviews();
    setEditingId(t._id);
    setTitle(t.title);
    setSlug(t.slug);
    setDescription(t.description);
    setDestinationIds(
      [
        ...(Array.isArray(t.destinationIds) ? t.destinationIds : []),
        ...(t.destinationId ? [t.destinationId] : []),
      ].filter((id, index, all) => all.indexOf(id) === index),
    );
    setTypes(
      (Array.isArray(t.types) ? t.types : []).filter(
        (x): x is TourTypeFilter =>
          TOUR_TYPE_OPTIONS.some((opt) => opt.value === x),
      ),
    );
    setPricePkr(t.pricePkr ?? t.price);
    setPriceUsd(t.priceUsd ?? 0);
    setDurationDays(t.durationDays);
    setLocation(t.location);
    setMaxPeople(typeof t.maxPeople === "number" ? t.maxPeople : "");
    setMinAge(typeof t.minAge === "number" ? t.minAge : "");
    setTourTypeLabel(typeof t.tourTypeLabel === "string" ? t.tourTypeLabel : "");
    setRatingAvg(typeof t.ratingAvg === "number" ? t.ratingAvg : "");
    setReviewsCount(typeof t.reviewsCount === "number" ? t.reviewsCount : "");
    setOffice(t.office ?? fallbackOffice());
    setEmail(t.email ?? fallbackEmail(t.slug || t.title));
    setImageRefs([...t.images]);
    setUrlIngestInput("");
    setPathsInput("");
    setItineraryJson(JSON.stringify(t.itinerary, null, 2));
    setHighlightsInput(
      Array.isArray(t.highlights) ? t.highlights.join("\n") : "",
    );
    setIncludedInput(
      Array.isArray(t.included) ? t.included.join("\n") : "",
    );
    setExcludedInput(
      Array.isArray(t.excluded) ? t.excluded.join("\n") : "",
    );
    setTimeSlotsInput(
      Array.isArray(t.timeSlots) ? t.timeSlots.join("\n") : "",
    );
    setTicketGroupsInput(
      Array.isArray(t.ticketGroups)
        ? t.ticketGroups
            .map((g) =>
              g.ageRange ? `${g.label} (${g.ageRange})` : String(g.label),
            )
            .filter((x) => x.trim().length > 0)
            .join("\n")
        : "",
    );
    setIsActive(t.isActive);
    setMsg(null);
    setModalOpen(true);
  }

  async function onSeed() {
    setMsg(null);
    try {
      const r = await seed({});
      setMsg(
        r.skipped ? "Tours already exist." : `Inserted ${r.inserted} tours.`,
      );
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    }
  }

  async function onBackfillUsd() {
    setMsg(null);
    try {
      const r = await backfillTourUsdPrices({ dryRun: false });
      setMsg(`Backfilled USD/PKR for ${r.patched} tours.`);
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    }
  }

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
      setMsg(
        "No image files detected. Use JPEG, PNG, WebP, or another common image format.",
      );
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
          setImageRefs((prev) =>
            prev.map((r) => (r === tempId ? data.storageId! : r)),
          );
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

  async function onIngestUrls() {
    if (typeof sessionToken !== "string") return;
    const token = sessionToken;
    const lines = urlIngestInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((u) => /^https?:\/\//i.test(u));
    if (lines.length === 0) {
      setMsg("Add at least one http(s) image URL.");
      return;
    }
    setIngesting(true);
    setMsg(null);
    try {
      for (const url of lines) {
        const id = await ingestRemote({ sessionToken: token, url });
        setImageRefs((prev) => [...prev, id]);
      }
      setUrlIngestInput("");
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
    } finally {
      setIngesting(false);
    }
  }

  function onAddPaths() {
    const lines = pathsInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setImageRefs((prev) => [...prev, ...lines]);
    setPathsInput("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    let itinerary: Doc<"tours">["itinerary"];
    try {
      itinerary = parseItineraryJson(itineraryJson);
    } catch (err) {
      setMsg(toUserFacingErrorMessage(err));
      return;
    }
    const images = imageRefs.filter(Boolean);
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
    setSaving(true);
    try {
      const uniqueDestinationIds = Array.from(new Set(destinationIds));
      if (editingId) {
        await updateTour({
          tourId: editingId,
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          description,
          types,
          destinationIds: uniqueDestinationIds,
          destinationId: uniqueDestinationIds[0],
          pricePkr,
          priceUsd,
          durationDays,
          location,
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
        setMsg("Tour updated.");
      } else {
        await createTour({
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          description,
          types,
          destinationIds: uniqueDestinationIds,
          destinationId: uniqueDestinationIds[0],
          pricePkr,
          priceUsd,
          durationDays,
          location,
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
        setMsg("Tour created.");
      }
      setModalOpen(false);
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (tours === undefined) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      {!hasConvexSessionToken ? (
        <p className="text-sm text-amber-800">
          {sessionToken === undefined
            ? "Loading your session for uploads and tour data…"
            : "Log in with an admin session to manage all tours (including inactive)."}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          Add tour
        </Button>
        <Button type="button" variant="secondary" onClick={() => setBulkOpen(true)}>
          Bulk upload
        </Button>
        <Button type="button" variant="secondary" onClick={() => void onSeed()}>
          Seed sample tours
        </Button>
        <Button type="button" variant="secondary" onClick={() => void onBackfillUsd()}>
          Backfill USD prices
        </Button>
        {msg && !modalOpen ? (
          <span className="text-sm text-brand-muted">{msg}</span>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tour</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Types</th>
              <th className="px-4 py-3">Price (PKR)</th>
              <th className="px-4 py-3">Price (USD)</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTours.map((t) => (
              <tr
                key={t._id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-3 font-medium text-brand-ink">
                  {t.title}
                </td>
                <td className="px-4 py-3 text-slate-600">/{t.slug}</td>
                <td className="px-4 py-3 text-slate-600">{t.location}</td>
                <td className="px-4 py-3 text-slate-600">
                  {(() => {
                    const ids = [
                      ...(Array.isArray(t.destinationIds) ? t.destinationIds : []),
                      ...(t.destinationId ? [t.destinationId] : []),
                    ];
                    const names = ids
                      .map((id) => destinations?.find((d) => d._id === id)?.name)
                      .filter((name): name is string => Boolean(name));
                    return names.length > 0 ? names.join(", ") : "-";
                  })()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {Array.isArray(t.types) && t.types.length > 0
                    ? t.types.join(", ")
                    : "-"}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-700">
                  {(t.pricePkr ?? t.price).toLocaleString()}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-700">
                  {Number(t.priceUsd ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-600">{t.durationDays}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={t.isActive}
                      aria-label={
                        t.isActive
                          ? `${t.title}: visible on site — click to hide`
                          : `${t.title}: hidden from site — click to show`
                      }
                      className={cn(
                        "flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2",
                        t.isActive
                          ? "justify-end bg-emerald-500"
                          : "justify-start bg-slate-300",
                      )}
                      onClick={() =>
                        void updateTour({ tourId: t._id, isActive: !t.isActive })
                      }
                    >
                      <span
                        className="pointer-events-none block h-[18px] w-[18px] shrink-0 rounded-full bg-white shadow-sm ring-1 ring-slate-900/10"
                        aria-hidden
                      />
                    </button>
                    <span
                      className={cn(
                        "min-w-[1.5rem] text-xs font-semibold tabular-nums",
                        t.isActive ? "text-emerald-800" : "text-slate-500",
                      )}
                    >
                      {t.isActive ? "On" : "Off"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-slate-50"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      onClick={() => {
                        if (confirm("Delete this tour?")) {
                          void deleteTour({ tourId: t._id });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedTours.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No tours yet. Add one or seed samples.</p>
        ) : null}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit tour" : "Add tour"}
        description="Images upload to Convex or are downloaded from URLs. New locations sync to /destinations after you seed regions once."
        panelClassName="max-w-2xl"
      >
        <form onSubmit={onSubmit} className="space-y-3">
          {msg && modalOpen ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {msg}
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
            <legend className="px-1 text-xs font-semibold text-slate-600">
              Tour types
            </legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {TOUR_TYPE_OPTIONS.map((opt) => {
                const checked = types.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTypes((prev) =>
                            prev.includes(opt.value)
                              ? prev
                              : [...prev, opt.value],
                          );
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
            <legend className="px-1 text-xs font-semibold text-slate-600">
              Destinations
            </legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {(destinations ?? []).map((d) => {
                const checked = destinationIds.includes(d._id);
                return (
                  <label
                    key={d._id}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setDestinationIds((prev) => {
                          if (e.target.checked) {
                            return prev.includes(d._id) ? prev : [...prev, d._id];
                          }
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
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block text-xs font-semibold text-slate-600">
              Price (PKR)
              <input
                type="number"
                required
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={pricePkr}
                onChange={(e) => setPricePkr(Number(e.target.value))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Price (USD)
              <input
                type="number"
                required
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={priceUsd}
                onChange={(e) => setPriceUsd(Number(e.target.value))}
              />
            </label>
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
            <legend className="px-1 text-xs font-semibold text-slate-600">
              ThemeForest “facts row”
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-semibold text-slate-600">
                Max people
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={maxPeople}
                  onChange={(e) =>
                    setMaxPeople(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Min age
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={minAge}
                  onChange={(e) =>
                    setMinAge(e.target.value === "" ? "" : Number(e.target.value))
                  }
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
                  onChange={(e) =>
                    setRatingAvg(e.target.value === "" ? "" : Number(e.target.value))
                  }
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
                  onChange={(e) =>
                    setReviewsCount(e.target.value === "" ? "" : Number(e.target.value))
                  }
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
            <legend className="px-1 text-xs font-semibold text-slate-600">
              Booking form fields (ThemeForest-style)
            </legend>
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
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active (visible on site)
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-bold text-slate-700">Tour images (Convex)</p>
            <p className="mt-1 text-xs text-slate-500">
              Upload files or paste public image URLs — we store binaries in Convex.
              You can also add site paths (e.g. /images/…) or existing storage IDs.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-700">Image folder</span>{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-800 ring-1 ring-slate-200">
                {imageUploadFolderKey}
              </code>
              — multiple files you upload are registered under this tour when you save
              (Convex storage is flat; the DB keeps this logical folder).
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
              <Button
                type="button"
                variant="secondary"
                className="!px-3 !py-2 !text-xs"
                disabled={ingesting || !hasConvexSessionToken}
                onClick={() => void onIngestUrls()}
              >
                {ingesting ? "Downloading…" : "Download URLs below"}
              </Button>
            </div>
            <label className="mt-3 block text-xs font-semibold text-slate-600">
              Image URLs to fetch & store (one per line)
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs"
                value={urlIngestInput}
                onChange={(e) => setUrlIngestInput(e.target.value)}
                placeholder="https://cdn.example.com/photo.jpg"
              />
            </label>
            <label className="mt-3 block text-xs font-semibold text-slate-600">
              Paths / storage IDs (append as-is, one per line)
              <textarea
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs"
                value={pathsInput}
                onChange={(e) => setPathsInput(e.target.value)}
                placeholder="/images/local.jpg"
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 !px-2 !py-1 !text-xs"
              onClick={onAddPaths}
            >
              Add paths / IDs
            </Button>
            {imageRefs.length > 0 ? (
              <ul className="mt-4 space-y-3 border-t border-slate-200 pt-3">
                {imageRefs.map((ref, i) => {
                  const localBlob = pendingFilePreviews[ref];
                  const remote = imagePreviewUrls?.[i];
                  const src = localBlob ?? remote ?? null;
                  const waitingRemote =
                    !src &&
                    imagePreviewUrls === undefined &&
                    !ref.startsWith("__pending_");
                  return (
                    <li
                      key={`${ref}-${i}`}
                      className="flex items-start gap-3 text-xs"
                    >
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        {waitingRemote ? (
                          <div
                            className="absolute inset-0 animate-pulse bg-slate-200"
                            aria-hidden
                          />
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
          <label className="block text-xs font-semibold text-slate-600">
            Itinerary (JSON array of {"{"} day, title, description {"}"})
            <textarea
              rows={8}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
              value={itineraryJson}
              onChange={(e) => setItineraryJson(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create tour"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk upload tours"
        description="Upload a .json or .xlsx file. Rows are upserted by slug. For nested fields, use JSON-in-cell (recommended) or newline-separated lists where applicable."
        templateHint={
          <div className="space-y-1">
            <p className="font-semibold">Required keys</p>
            <p className="font-mono text-xs">
              title, slug, description, price, durationDays, location, images, itinerary, isActive
            </p>
            <p className="text-xs text-slate-600">
              For XLSX: put <span className="font-mono">images</span> as newline/comma text, and{" "}
              <span className="font-mono">itinerary</span> as a JSON array string.
            </p>
          </div>
        }
        transformRow={(row) => {
          const title = asString(row.title);
          const slug = asString(row.slug);
          const description = asString(row.description);
          const price = asNumber(row.price);
          const durationDays = asNumber(row.durationDays);
          const location = asString(row.location);
          const isActive = asBoolean(row.isActive);
          if (!title) throw new Error("Missing title");
          if (!slug) throw new Error("Missing slug");
          if (!description) throw new Error("Missing description");
          if (price === undefined) throw new Error("Missing price");
          if (durationDays === undefined) throw new Error("Missing durationDays");
          if (!location) throw new Error("Missing location");
          if (isActive === undefined) throw new Error("Missing isActive");

          const images = asStringArray(row.images) ?? [];
          const itinerary = asJson<
            Array<{ day?: number; title?: string; description?: string }>
          >(row.itinerary);
          if (!Array.isArray(itinerary) || itinerary.length === 0) {
            throw new Error("itinerary must be a JSON array");
          }
          const normalizedItinerary = itinerary.map((it, idx) => ({
            day: typeof it.day === "number" ? it.day : idx + 1,
            title: typeof it.title === "string" && it.title.trim() ? it.title : `Day ${idx + 1}`,
            description: typeof it.description === "string" ? it.description : "",
          }));

          return {
            title,
            slug,
            description,
            price,
            durationDays,
            location,
            isActive,
            images,
            itinerary: normalizedItinerary,
            types: asStringArray(row.types),
            highlights: asStringArray(row.highlights),
            included: asStringArray(row.included),
            excluded: asStringArray(row.excluded),
            timeSlots: asStringArray(row.timeSlots),
            ticketGroups: asJson<Array<{ label: string; ageRange?: string }>>(row.ticketGroups),
            maxPeople: asNumber(row.maxPeople),
            minAge: asNumber(row.minAge),
            tourTypeLabel: asString(row.tourTypeLabel),
            ratingAvg: asNumber(row.ratingAvg),
            reviewsCount: asNumber(row.reviewsCount),
            office: asString(row.office),
            email: asString(row.email),
          };
        }}
        onImport={async (rows) => {
          return await importInBatches({
            rows,
            batchSize: 10,
            importBatch: async (batch) =>
              bulkUpsert({
                rows: batch.map((b) => ({
                  title: b.title,
                  slug: b.slug,
                  description: b.description,
                  price: b.price,
                  durationDays: b.durationDays,
                  location: b.location,
                  images: b.images,
                  itinerary: b.itinerary,
                  isActive: b.isActive,
                  types: b.types,
                  highlights: b.highlights,
                  included: b.included,
                  excluded: b.excluded,
                  timeSlots: b.timeSlots,
                  ticketGroups: Array.isArray(b.ticketGroups) ? b.ticketGroups : undefined,
                  maxPeople: b.maxPeople,
                  minAge: b.minAge,
                  tourTypeLabel: b.tourTypeLabel,
                  ratingAvg: b.ratingAvg,
                  reviewsCount: b.reviewsCount,
                  office: b.office,
                  email: b.email,
                })),
              }),
            merge: (a, b) => ({
              processed: a.processed + b.processed,
              created: (a.created ?? 0) + (b.created ?? 0),
              updated: (a.updated ?? 0) + (b.updated ?? 0),
              skipped: (a.skipped ?? 0) + (b.skipped ?? 0),
              errors: [...(a.errors ?? []), ...(b.errors ?? [])],
            }),
          });
        }}
      />
    </div>
  );
}
