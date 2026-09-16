/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionArgs } from "convex/server";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useAutosave } from "@/hooks/useAutosave";
import { useLocalDraft } from "@/hooks/useLocalDraft";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import {
  DraftRestoreBanner,
  QueryErrorBanner,
  SaveStatusPill,
} from "@/components/admin/shared/EditorStatus";
import { FieldHint, FieldLabel, SelectField, TextAreaField, TextInput } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { todayYmdLocal } from "@/lib/todayYmdLocal";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { cn } from "@/lib/cn";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { ItineraryPdf, type ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";
import {
  DEFAULT_COMPLIANCE_LINE,
  DEFAULT_HEADLINE,
  DEFAULT_LOGO_URL,
  DEFAULT_VARIANT_LABEL,
  MAX_DAYS,
  addDaysToYmd,
  blankPackageTier,
  buildSimpleItineraryModel,
  clamp,
  daysBetween,
  editablePackageTiersToPatchPayload,
  itineraryFileName,
  legacyDayPlansToAtGlance,
  legacyPackagesToTiers,
  linesToList,
  normalizePackageTier,
  parseYmdLocal,
  pickMapFallbackImage,
  syncAtGlanceToDayCount,
  type AtGlanceDay,
  type EditablePackageTier,
  type ItineraryDocumentSettings,
  type ItineraryRecord,
  type Theme,
} from "@/components/admin/itinerary/itineraryModel";
import { AtGlanceDaysEditor } from "@/components/admin/itinerary/AtGlanceDaysEditor";
import { PackageTiersEditor } from "@/components/admin/itinerary/PackageTiersEditor";
import { LegacyItineraryContentPanel } from "@/components/admin/itinerary/LegacyItineraryContentPanel";

type ItineraryPatch = Omit<
  FunctionArgs<typeof api.itineraries.patchDraft>,
  "sessionToken" | "itineraryId"
>;

/** Everything the form edits — also the shape of the local crash backup. */
type BuilderSnapshot = {
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

/** Pre-2026-09 backup keys (raw snapshot, no timestamp). Read once, then removed. */
function legacyBackupKey(itineraryId: string | null) {
  return `jt:admin:itinerary-simple-builder:${itineraryId ?? "unsaved"}`;
}

function backupKey(itineraryId: string | null) {
  return `draft:itinerary:${itineraryId ?? "new"}`;
}

function readLegacyBackup(itineraryId: string | null): Partial<BuilderSnapshot> | null {
  try {
    const raw = window.localStorage.getItem(legacyBackupKey(itineraryId));
    return raw ? (JSON.parse(raw) as Partial<BuilderSnapshot>) : null;
  } catch {
    return null;
  }
}

function removeLegacyBackup(itineraryId: string | null) {
  try {
    window.localStorage.removeItem(legacyBackupKey(itineraryId));
  } catch {
    /* ignore */
  }
}

/** Fields in a snapshot that would change the saved record. */
function snapshotToPatch(s: BuilderSnapshot): Required<
  Pick<
    ItineraryPatch,
    | "headline"
    | "variantLabel"
    | "coverSubtitle"
    | "complianceLine"
    | "pickupDropoff"
    | "title"
    | "clientName"
    | "days"
    | "theme"
    | "atGlanceDays"
    | "packageTiers"
    | "included"
    | "notIncluded"
  >
> & { startDate: string | null; endDate: string | null } {
  return {
    headline: s.headline,
    variantLabel: s.variantLabel,
    coverSubtitle: s.coverSubtitle,
    complianceLine: s.complianceLine,
    pickupDropoff: s.pickupDropoff,
    title: s.title,
    clientName: s.clientName,
    // `null` clears a date on the server; `undefined` would leave the old one.
    startDate: s.startDate.trim() || null,
    endDate: s.endDate.trim() || null,
    days: clamp(s.dayCount, 1, MAX_DAYS),
    theme: s.theme,
    atGlanceDays: s.atGlanceDays,
    packageTiers: editablePackageTiersToPatchPayload(s.packageTiers),
    included: linesToList(s.includedInput),
    notIncluded: linesToList(s.notIncludedInput),
  };
}

function serializeFields(patch: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(patch)) out[k] = JSON.stringify(v ?? null);
  return out;
}

/** How much real content a snapshot holds (only used to vet old-format backups). */
function snapshotContentScore(s: Partial<BuilderSnapshot> | null | undefined): number {
  if (!s) return 0;
  let score = 0;
  for (const d of s.atGlanceDays ?? []) {
    if ((d?.title ?? "").trim()) score++;
    if ((d?.detail ?? "").trim()) score++;
    if ((d?.overnight ?? "").trim()) score++;
  }
  score += linesToList(s.includedInput ?? "").length;
  score += linesToList(s.notIncludedInput ?? "").length;
  for (const t of s.packageTiers ?? []) {
    if (typeof t?.pricePkr === "number") score++;
    if ((t?.vehicle ?? "").trim()) score++;
    for (const stay of t?.stays ?? []) if ((stay?.hotel ?? "").trim()) score++;
  }
  return score;
}

export function AdminItinerarySimpleBuilder({
  itineraryId: itineraryIdProp,
  initialTitle,
  initialClientName,
  sourceTourId,
  sourceBookingId,
  sourceGuestBookingId,
}: {
  itineraryId?: string;
  /** Prefill + linkage when arriving from a booking (see /admin/itineraries/new). */
  initialTitle?: string;
  initialClientName?: string;
  sourceTourId?: string;
  sourceBookingId?: string;
  sourceGuestBookingId?: string;
}) {
  const router = useRouter();
  const liveToken = useConvexSessionToken();
  // Keep the form mounted if the session lapses mid-edit: saves fail visibly
  // and the local backup keeps the edits instead of the form unmounting.
  const lastTokenRef = useRef<string | null>(null);
  if (typeof liveToken === "string") lastTokenRef.current = liveToken;
  const sessionToken = typeof liveToken === "string" ? liveToken : lastTokenRef.current;
  const sessionLost = liveToken === null && lastTokenRef.current !== null;
  const canMutate = typeof sessionToken === "string";

  const minDate = useMemo(() => todayYmdLocal(), []);
  const defaultLogoUrlAbs = useMemo(() => toAbsoluteUrl(DEFAULT_LOGO_URL), []);

  const createDraft = useMutation(api.itineraries.createDraft);
  const patchDraft = useMutation(api.itineraries.patchDraft);
  const markFinal = useMutation(api.itineraries.markFinal);
  const draftItineraryDays = useAction(api.ai.draftItineraryDays);
  const generateUploadUrl = useMutation(api.media.generateItineraryImageUploadUrl);
  const addItineraryImageAsset = useMutation(api.media.addItineraryImageAsset);

  const [itineraryId, setItineraryId] = useState<Id<"itineraries"> | null>(
    itineraryIdProp ? (itineraryIdProp as Id<"itineraries">) : null,
  );

  const existingQuery = useSafeQuery(
    api.itineraries.getForAdmin,
    canMutate && itineraryId ? { sessionToken, itineraryId } : "skip",
  );
  const existing = existingQuery.data as ItineraryRecord | null | undefined;

  const settingsQuery = useSafeQuery(
    api.siteSettings.getAdminSiteSettings,
    canMutate ? { sessionToken } : "skip",
  );
  const adminSettings = settingsQuery.data as ItineraryDocumentSettings | undefined;

  // ── Form state ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(initialTitle ?? "");
  const [clientName, setClientName] = useState(initialClientName ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayCount, setDayCount] = useState(5);
  const [theme, setTheme] = useState<Theme>("luxury");
  const [headline, setHeadline] = useState(DEFAULT_HEADLINE);
  const [variantLabel, setVariantLabel] = useState(DEFAULT_VARIANT_LABEL);
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [coverStorageId, setCoverStorageId] = useState<Id<"_storage"> | null>(null);
  const [complianceLine, setComplianceLine] = useState(DEFAULT_COMPLIANCE_LINE);
  const [pickupDropoff, setPickupDropoff] = useState("");
  const [atGlanceDays, setAtGlanceDays] = useState<AtGlanceDay[]>(() =>
    syncAtGlanceToDayCount([], 5),
  );
  const [packageTiers, setPackageTiers] = useState<EditablePackageTier[]>([
    blankPackageTier(1, "Standard"),
  ]);
  const [includedInput, setIncludedInput] = useState("");
  const [notIncludedInput, setNotIncludedInput] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "pdf">("form");

  /** Id whose saved values are loaded into state. Autosave stays off until then. */
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const isHydrated = Boolean(itineraryId) && hydratedId === String(itineraryId);
  /** Last values known to be on the server, per field (JSON). Only changed fields are sent. */
  const baselineRef = useRef<Record<string, string> | null>(null);
  /** One-time legacy migration patch, sent right after hydration. */
  const migrationPatchRef = useRef<ItineraryPatch | null>(null);
  const lastAutoNights = useRef<number>(1);

  const safeDays = clamp(dayCount, 1, MAX_DAYS);
  const nights = Math.max(0, safeDays - 1);
  const defaultHotelNights = Math.max(1, nights || 1);
  const computedDaysFromDates = startDate && endDate ? daysBetween(startDate, endDate) : null;

  const snapshot = useMemo<BuilderSnapshot>(
    () => ({
      title,
      clientName,
      startDate,
      endDate,
      dayCount: safeDays,
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
      safeDays,
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
  const formPatch = useMemo(() => snapshotToPatch(snapshot), [snapshot]);

  // ── Autosave ──────────────────────────────────────────────────────────────
  const autosave = useAutosave<ItineraryPatch>({
    enabled: canMutate && isHydrated,
    save: async (patch) => {
      if (!sessionToken || !itineraryId) throw new Error("Not authenticated");
      await patchDraft({ sessionToken, itineraryId, ...patch });
    },
  });
  const { queue: queueSave, flush: flushSave } = autosave;

  useEffect(() => {
    if (!itineraryIdProp) return;
    setItineraryId(itineraryIdProp as Id<"itineraries">);
  }, [itineraryIdProp]);

  // Load the saved record into the form exactly once per itinerary.
  useEffect(() => {
    if (!existing || !itineraryId) return;
    const key = String(itineraryId);
    if (hydratedId === key) return;

    const migration: ItineraryPatch = {};
    let days = existing.atGlanceDays?.length ? existing.atGlanceDays : null;
    if (!days && existing.dayPlans?.length) {
      days = legacyDayPlansToAtGlance(existing.dayPlans);
    }
    const count = clamp(Math.max(existing.days || 1, days?.length ?? 0), 1, MAX_DAYS);
    const syncedDays = syncAtGlanceToDayCount(days ?? [], count);
    if (!existing.atGlanceDays?.length && existing.dayPlans?.length) {
      migration.atGlanceDays = syncedDays;
    }

    let tiers: EditablePackageTier[] | null = null;
    if (existing.packageTiers?.length) {
      tiers = existing.packageTiers.map((t) => normalizePackageTier(t, existing.packageStayRows ?? []));
    } else if (existing.packages?.length) {
      tiers = legacyPackagesToTiers(existing.packages);
      migration.packageTiers = editablePackageTiersToPatchPayload(tiers);
    }
    // Exports must render what this builder shows (see usesSimpleLayout).
    if (existing.layoutVariant !== "simple") migration.layoutVariant = "simple";

    setTitle(existing.title ?? "");
    setClientName(existing.clientName ?? "");
    setStartDate(existing.startDate ?? "");
    setEndDate(existing.endDate ?? "");
    setDayCount(count);
    setTheme(existing.theme ?? "luxury");
    setHeadline(existing.headline ?? DEFAULT_HEADLINE);
    setVariantLabel(existing.variantLabel ?? DEFAULT_VARIANT_LABEL);
    setCoverSubtitle(existing.coverSubtitle ?? "");
    setComplianceLine(existing.complianceLine ?? DEFAULT_COMPLIANCE_LINE);
    setPickupDropoff(existing.pickupDropoff ?? "");
    setCoverStorageId(existing.coverImageStorageId ?? null);
    setAtGlanceDays(syncedDays);
    setPackageTiers(tiers ?? [blankPackageTier(Math.max(1, count - 1), "Standard")]);
    setIncludedInput((existing.included ?? []).join("\n"));
    setNotIncludedInput((existing.notIncluded ?? []).join("\n"));

    // Don't let the "nights follow day count" effect rewrite saved hotel nights on open.
    lastAutoNights.current = Math.max(1, count - 1);
    baselineRef.current = null;
    migrationPatchRef.current = Object.keys(migration).length ? migration : null;
    setHydratedId(key);
  }, [existing, itineraryId, hydratedId]);

  // Queue only the fields that changed since the last known server state, so
  // opening a record never rewrites it and one section can't clobber another.
  useEffect(() => {
    if (!isHydrated) return;
    const serialized = serializeFields(formPatch);
    if (!baselineRef.current) {
      baselineRef.current = serialized;
      const migration = migrationPatchRef.current;
      migrationPatchRef.current = null;
      if (migration) queueSave(migration);
      return;
    }
    const changed: Record<string, unknown> = {};
    for (const [k, json] of Object.entries(serialized)) {
      if (baselineRef.current[k] !== json) changed[k] = formPatch[k as keyof typeof formPatch];
    }
    if (Object.keys(changed).length === 0) return;
    baselineRef.current = serialized;
    queueSave(changed as ItineraryPatch);
  }, [formPatch, isHydrated, queueSave]);

  // Keep the package "Nights" default in sync with the day count, only for
  // cells still holding the previous auto-default.
  useEffect(() => {
    const prev = lastAutoNights.current;
    const next = defaultHotelNights;
    if (prev === next) return;
    lastAutoNights.current = next;
    setPackageTiers((prevTiers) =>
      prevTiers.map((tier) => ({
        ...tier,
        stays: tier.stays.map((stay) => ({ ...stay, nights: stay.nights === prev ? next : stay.nights })),
      })),
    );
  }, [defaultHotelNights]);

  // Site default inclusions: applied once, only to a brand-new (unsaved) form
  // the admin hasn't typed into. Never re-applied over saved or typed text.
  const defaultsAppliedRef = useRef(false);
  useEffect(() => {
    if (defaultsAppliedRef.current || itineraryIdProp || !adminSettings) return;
    defaultsAppliedRef.current = true;
    if (adminSettings.defaultIncluded?.length) {
      setIncludedInput((cur) => (cur.trim() ? cur : adminSettings.defaultIncluded!.join("\n")));
    }
    if (adminSettings.defaultNotIncluded?.length) {
      setNotIncludedInput((cur) => (cur.trim() ? cur : adminSettings.defaultNotIncluded!.join("\n")));
    }
  }, [adminSettings, itineraryIdProp]);

  // ── Local crash backup ───────────────────────────────────────────────────
  const pristineNewJson = useRef<string | null>(null);
  if (pristineNewJson.current === null) pristineNewJson.current = JSON.stringify(snapshot);
  const newFormDirty =
    !itineraryId && JSON.stringify({ ...snapshot, includedInput: "", notIncludedInput: "" }) !==
      JSON.stringify({ ...JSON.parse(pristineNewJson.current), includedInput: "", notIncludedInput: "" });
  const dirty = itineraryId ? isHydrated && autosave.hasPending : newFormDirty;

  const localDraft = useLocalDraft<BuilderSnapshot>(
    itineraryId && !isHydrated ? null : backupKey(itineraryId ? String(itineraryId) : null),
    snapshot,
    dirty,
  );
  const { restorable, clear: clearBackup, dismiss: dismissBackup } = localDraft;
  const [legacyOffer, setLegacyOffer] = useState<Partial<BuilderSnapshot> | null>(null);

  // Old-format backups: offer once (only when richer than what's loaded), then drop the key.
  const legacyCheckedRef = useRef<string | null>(null);
  useEffect(() => {
    const scope = itineraryId ? String(itineraryId) : null;
    if (itineraryId && !isHydrated) return;
    const key = scope ?? "new";
    if (legacyCheckedRef.current === key) return;
    legacyCheckedRef.current = key;
    const old = readLegacyBackup(scope);
    if (!old) return;
    const worthOffering = scope
      ? snapshotContentScore(old) > snapshotContentScore(snapshot)
      : !initialTitle && !initialClientName && snapshotContentScore(old) > 0;
    if (worthOffering) setLegacyOffer(old);
    else removeLegacyBackup(scope);
  }, [initialClientName, initialTitle, isHydrated, itineraryId, snapshot]);

  // A backup identical to the loaded record isn't worth a prompt.
  useEffect(() => {
    if (!restorable || !itineraryId || !isHydrated) return;
    if (JSON.stringify(snapshotToPatch(restorable.data)) === JSON.stringify(formPatch)) clearBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restorable, isHydrated]);

  // Once everything is saved (and no restore decision is pending) drop the backup.
  useEffect(() => {
    if (!itineraryId || restorable || legacyOffer) return;
    if (autosave.status === "saved" && !autosave.hasPending) clearBackup();
  }, [autosave.hasPending, autosave.status, clearBackup, itineraryId, legacyOffer, restorable]);

  const applySnapshot = useCallback((s: Partial<BuilderSnapshot>) => {
    if (typeof s.title === "string") setTitle(s.title);
    if (typeof s.clientName === "string") setClientName(s.clientName);
    if (typeof s.startDate === "string") setStartDate(s.startDate);
    if (typeof s.endDate === "string") setEndDate(s.endDate);
    if (typeof s.dayCount === "number") setDayCount(clamp(s.dayCount, 1, MAX_DAYS));
    if (s.theme) setTheme(s.theme);
    if (typeof s.headline === "string") setHeadline(s.headline);
    if (typeof s.variantLabel === "string") setVariantLabel(s.variantLabel);
    if (typeof s.coverSubtitle === "string") setCoverSubtitle(s.coverSubtitle);
    if (typeof s.complianceLine === "string") setComplianceLine(s.complianceLine);
    if (typeof s.pickupDropoff === "string") setPickupDropoff(s.pickupDropoff);
    if (Array.isArray(s.atGlanceDays) && s.atGlanceDays.length > 0) setAtGlanceDays(s.atGlanceDays);
    if (Array.isArray(s.packageTiers) && s.packageTiers.length > 0) {
      setPackageTiers(s.packageTiers.map((t) => normalizePackageTier(t)));
    }
    if (typeof s.includedInput === "string") setIncludedInput(s.includedInput);
    if (typeof s.notIncludedInput === "string") setNotIncludedInput(s.notIncludedInput);
  }, []);

  useUnsavedChangesGuard(dirty || creatingDraft || uploadingCover);

  // ── Day count / dates ────────────────────────────────────────────────────
  /**
   * Days removed by lowering the count, by index. Typing "12" into the count
   * passes through "1"; without this, days 2..N would be silently erased.
   */
  const trimmedDaysRef = useRef<Map<number, AtGlanceDay>>(new Map());
  const setDayCountAndSync = useCallback(
    (next: number) => {
      const safe = clamp(next, 1, MAX_DAYS);
      setDayCount(safe);
      setAtGlanceDays((prev) => {
        const trimmed = trimmedDaysRef.current;
        for (let i = safe; i < prev.length; i++) trimmed.set(i, prev[i]!);
        const restored = [...prev];
        for (let i = prev.length; i < safe; i++) {
          const kept = trimmed.get(i);
          if (!kept) break;
          restored.push(kept);
          trimmed.delete(i);
        }
        return syncAtGlanceToDayCount(restored, safe);
      });
      if (!startDate && !endDate) return;
      const baseStart = parseYmdLocal(startDate) ? startDate : parseYmdLocal(endDate) ? endDate : minDate;
      if (startDate !== baseStart) setStartDate(baseStart);
      const nextEnd = addDaysToYmd(baseStart, safe - 1);
      if (nextEnd) setEndDate(nextEnd);
    },
    [endDate, minDate, startDate],
  );

  // ── Cover image & preview ────────────────────────────────────────────────
  const mapFallback = pickMapFallbackImage([title, pickupDropoff].filter(Boolean).join(" "));
  const coverResolve = useQuery(
    api.media.resolveStorageIdsForAdmin,
    canMutate && coverStorageId ? { sessionToken, ids: [coverStorageId] } : "skip",
  ) as (string | null)[] | undefined;
  const coverUrlResolved = coverResolve?.[0] ?? undefined;
  const coverFallbackAbs = toAbsoluteUrl(`/maps/${mapFallback}`);
  const coverPreviewSrc = (coverUrlResolved && toAbsoluteUrl(coverUrlResolved)) || coverFallbackAbs || "";

  const pdfModel: ItineraryPdfModel = useMemo(
    () =>
      buildSimpleItineraryModel(
        {
          headline,
          variantLabel,
          title,
          coverSubtitle,
          clientName,
          startDate,
          endDate,
          days: safeDays,
          pickupDropoff,
          complianceLine,
          coverImageUrl: coverUrlResolved ? toAbsoluteUrl(coverUrlResolved) : coverFallbackAbs,
          logoUrl: defaultLogoUrlAbs,
          atGlanceDays,
          included: linesToList(includedInput),
          notIncluded: linesToList(notIncludedInput),
          packageTiers: editablePackageTiersToPatchPayload(packageTiers),
          packageStayRows: [],
        },
        adminSettings,
      ),
    [
      adminSettings,
      atGlanceDays,
      clientName,
      complianceLine,
      coverFallbackAbs,
      coverSubtitle,
      coverUrlResolved,
      defaultLogoUrlAbs,
      endDate,
      headline,
      includedInput,
      notIncludedInput,
      packageTiers,
      pickupDropoff,
      safeDays,
      startDate,
      title,
      variantLabel,
    ],
  );

  const [previewModel, setPreviewModel] = useState<ItineraryPdfModel>(pdfModel);
  useEffect(() => {
    const t = window.setTimeout(() => setPreviewModel(pdfModel), 500);
    return () => window.clearTimeout(t);
  }, [pdfModel]);

  async function uploadCoverImage(file: File) {
    if (!sessionToken) throw new Error("Not authenticated");
    if (!itineraryId) throw new Error("Create the draft first.");
    const folderKey = `itineraries/${String(itineraryId)}`;
    const postUrl = await generateUploadUrl({ sessionToken, folderKey });
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = (await res.json()) as { storageId?: Id<"_storage"> };
    if (!data.storageId) throw new Error("No storageId returned");
    // Persist the cover first — that's the part the admin can't afford to lose.
    queueSave({ coverImageStorageId: data.storageId });
    await flushSave();
    setCoverStorageId(data.storageId);
    try {
      await addItineraryImageAsset({ sessionToken, itineraryId, folderKey, storageId: data.storageId });
      return null;
    } catch (e) {
      console.error("Failed to index itinerary image asset", e);
      return "Cover saved, but it couldn’t be added to the image library.";
    }
  }

  async function handleCreateDraft() {
    if (!sessionToken || creatingDraft || itineraryId) return;
    setCreatingDraft(true);
    setMsg(null);
    const sent = snapshotToPatch(snapshot);
    try {
      // One atomic mutation: everything typed so far is saved with the insert.
      const id = await createDraft({
        sessionToken,
        title: sent.title.trim() || "Untitled itinerary",
        clientName: sent.clientName.trim() || "Client",
        startDate: sent.startDate ?? undefined,
        endDate: sent.endDate ?? undefined,
        days: sent.days,
        theme: sent.theme,
        headline: sent.headline,
        variantLabel: sent.variantLabel,
        coverSubtitle: sent.coverSubtitle,
        complianceLine: sent.complianceLine,
        pickupDropoff: sent.pickupDropoff,
        atGlanceDays: sent.atGlanceDays,
        packageTiers: sent.packageTiers,
        included: sent.included,
        notIncluded: sent.notIncluded,
        sourceTourId: sourceTourId as Id<"tours"> | undefined,
        sourceBookingId: sourceBookingId as Id<"bookings"> | undefined,
        sourceGuestBookingId: sourceGuestBookingId as Id<"guestBookings"> | undefined,
      });
      // The server now holds exactly `sent`; anything typed during the request
      // differs from this baseline and is autosaved right away.
      baselineRef.current = serializeFields(sent);
      migrationPatchRef.current = null;
      clearBackup();
      removeLegacyBackup(null);
      setLegacyOffer(null);
      setItineraryId(id);
      setHydratedId(String(id));
      // Update the URL without remounting, so a refresh reopens this draft.
      window.history.replaceState(null, "", `/admin/itineraries/${id}`);
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    } finally {
      setCreatingDraft(false);
    }
  }

  async function copyWhatsappMessage() {
    const primaryPrice = packageTiers[0]?.pricePkr;
    const text = [
      `Hi ${clientName.trim()}`.trim(),
      title.trim() ? `Trip: ${title.trim()}` : "",
      startDate && endDate ? `Travel dates: ${startDate} → ${endDate}` : "",
      primaryPrice != null
        ? `Starting from: PKR ${primaryPrice.toLocaleString()} (${packageTiers[0]?.name || "Package"})`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied WhatsApp message.");
      window.setTimeout(() => setMsg(null), 2000);
    } catch {
      setMsg("Copy failed.");
    }
  }

  /** Fills only blank days, so a draft can never overwrite text the admin wrote. */
  async function draftDaysWithAi() {
    if (!sessionToken || !itineraryId) return;
    const blanks = atGlanceDays.filter((d) => !d.title.trim() && !d.detail.trim()).length;
    if (blanks === 0) {
      setMsg("Every day already has content — clear a day first if you want it redrafted.");
      return;
    }
    setDrafting(true);
    setMsg(null);
    try {
      await flushSave();
      const res = await draftItineraryDays({ sessionToken, itineraryId });
      const byDay = new Map(res.days.map((d) => [d.dayNumber, d]));
      let filled = 0;
      setAtGlanceDays((prev) =>
        prev.map((row) => {
          const draft = byDay.get(row.dayNumber);
          if (row.title.trim() || row.detail.trim() || !draft) return row;
          if (!draft.title.trim() && !draft.detail.trim()) return row;
          filled++;
          return { ...row, title: draft.title, detail: draft.detail, overnight: row.overnight ?? draft.overnight };
        }),
      );
      setMsg(
        filled > 0
          ? `Drafted ${filled} day${filled === 1 ? "" : "s"}. Review the text, then add hotels and prices yourself.`
          : "The assistant returned nothing usable. Try again.",
      );
    } catch (e) {
      console.error("AI day drafting failed", e);
      setMsg(toUserFacingErrorMessage(e));
    } finally {
      setDrafting(false);
    }
  }

  async function downloadPdfNow() {
    const blob = await pdf(<ItineraryPdf model={pdfModel} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = itineraryFileName(title, "pdf");
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /** Runs an action only after every pending edit is saved; shows failures. */
  async function afterSave(action: () => Promise<void>, setBusy: (b: boolean) => void) {
    setBusy(true);
    setMsg(null);
    try {
      await flushSave();
      await action();
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (!canMutate) {
    return (
      <p className="text-sm text-muted">
        {liveToken === undefined ? "Loading session…" : "Sign in required."}
      </p>
    );
  }

  if (itineraryId && !isHydrated) {
    if (existing === null) return <p className="text-sm text-muted">Itinerary not found.</p>;
    return (
      <div className="space-y-3">
        <QueryErrorBanner error={existingQuery.error} />
        <p className="text-sm text-muted">Loading itinerary…</p>
      </div>
    );
  }

  const legacySource = existing ?? null;

  return (
    <div className="space-y-6">
      <QueryErrorBanner error={sessionLost ? new Error("Not authenticated") : existingQuery.error} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-h-6 items-center gap-2 text-sm text-muted">
          {itineraryId ? (
            <SaveStatusPill status={autosave.status} error={autosave.error} />
          ) : (
            <span>Not saved yet — create the draft to start autosaving.</span>
          )}
          {autosave.status === "error" ? (
            <Button type="button" variant="secondary" onClick={() => void flushSave().catch(() => undefined)}>
              Retry save
            </Button>
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
            <>
              <Button
                type="button"
                disabled={downloading}
                onClick={() => void afterSave(downloadPdfNow, setDownloading)}
              >
                {downloading ? "Preparing…" : "Download PDF"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  void afterSave(async () => {
                    router.push(`/admin/itineraries/${itineraryId}/download-word`);
                  }, setDownloading)
                }
              >
                Download Word
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {restorable ? (
        <DraftRestoreBanner
          savedAt={restorable.savedAt}
          onRestore={() => {
            applySnapshot(restorable.data);
            dismissBackup();
            setMsg(itineraryId ? "Backup restored into the form — saving now." : "Backup restored.");
          }}
          onDiscard={clearBackup}
        />
      ) : null}

      {legacyOffer ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-semibold text-foreground">This browser has an older unsaved backup</p>
          <p className="mt-1 text-muted">
            {itineraryId
              ? "It holds day details, inclusions or package rows the saved copy is missing."
              : "It holds a previous unfinished itinerary. Restore it only if it belongs to this client."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                applySnapshot(legacyOffer);
                setLegacyOffer(null);
                removeLegacyBackup(itineraryId ? String(itineraryId) : null);
              }}
            >
              Restore backup
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setLegacyOffer(null);
                removeLegacyBackup(itineraryId ? String(itineraryId) : null);
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      ) : null}

      {msg ? <div className="rounded-xl border border-border bg-panel-elevated p-3 text-sm">{msg}</div> : null}

      <div className="lg:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-panel-elevated p-2">
          {(["form", "pdf"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileTab(tab)}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                mobileTab === tab
                  ? "bg-brand-sun/18 text-foreground ring-1 ring-brand-sun/25"
                  : "text-muted hover:bg-black/5 hover:text-foreground",
              )}
            >
              {tab === "form" ? "Edit" : "PDF preview"}
            </button>
          ))}
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
                  min={itineraryId ? undefined : minDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>End date (optional)</FieldLabel>
                <TextInput
                  type="date"
                  min={startDate || (itineraryId ? undefined : minDate)}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Number of days</FieldLabel>
                <TextInput
                  type="number"
                  min={1}
                  max={MAX_DAYS}
                  value={safeDays}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n) || e.target.value === "") return;
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
                    <TextInput value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Cover subtitle</FieldLabel>
                    <TextInput value={coverSubtitle} onChange={(e) => setCoverSubtitle(e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Cover image</FieldLabel>
                    <div className="mt-2 flex items-center gap-3">
                      {coverStorageId ? (
                        <img src={coverPreviewSrc} alt="Cover preview" className="h-16 w-28 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-16 w-28 items-center justify-center rounded-md bg-panel text-sm text-muted">
                          Map fallback
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          id="cover-upload"
                          type="file"
                          accept="image/*"
                          disabled={uploadingCover}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (!f) return;
                            setUploadingCover(true);
                            setMsg(null);
                            try {
                              const warning = await uploadCoverImage(f);
                              setMsg(warning ?? "Cover image saved.");
                            } catch (err) {
                              setMsg(`Cover image not saved. ${toUserFacingErrorMessage(err)}`);
                            } finally {
                              setUploadingCover(false);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={!coverStorageId || uploadingCover}
                          onClick={async () => {
                            setMsg(null);
                            try {
                              queueSave({ coverImageStorageId: null });
                              await flushSave();
                              setCoverStorageId(null);
                            } catch (e) {
                              setMsg(toUserFacingErrorMessage(e));
                            }
                          }}
                        >
                          Use map fallback
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Compliance line</FieldLabel>
                    <TextAreaField rows={2} value={complianceLine} onChange={(e) => setComplianceLine(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Itinerary at a glance</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">{safeDays} days</span>
                    <Button type="button" variant="secondary" onClick={() => void draftDaysWithAi()} disabled={drafting}>
                      {drafting ? "Drafting…" : "Draft empty days with AI"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={safeDays <= 1}
                      onClick={() => {
                        const last = atGlanceDays[safeDays - 1];
                        const hasContent = last && (last.title.trim() || last.detail.trim() || last.overnight?.trim());
                        if (hasContent && !window.confirm(`Remove Day ${safeDays} and its text?`)) return;
                        setDayCountAndSync(safeDays - 1);
                      }}
                    >
                      Remove Day
                    </Button>
                  </div>
                </div>
                <FieldHint>
                  AI fills only days you have left blank, as a draft to edit. It never writes hotel names or
                  prices — add those yourself.
                </FieldHint>
                <FieldHint>
                  {startDate || endDate
                    ? "If dates are set, changing day count updates the end date to match."
                    : "Add as many days as you need; dates are optional."}
                </FieldHint>
                <AtGlanceDaysEditor days={atGlanceDays} onChange={setAtGlanceDays} />
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDayCountAndSync(safeDays + 1)}
                    disabled={safeDays >= MAX_DAYS}
                  >
                    + Add Day
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Included / Not included</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Included (one per line)</FieldLabel>
                    <TextAreaField rows={8} value={includedInput} onChange={(e) => setIncludedInput(e.target.value)} />
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
                {(!includedInput.trim() && adminSettings?.defaultIncluded?.length) ||
                (!notIncludedInput.trim() && adminSettings?.defaultNotIncluded?.length) ? (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (!includedInput.trim() && adminSettings?.defaultIncluded?.length) {
                          setIncludedInput(adminSettings.defaultIncluded.join("\n"));
                        }
                        if (!notIncludedInput.trim() && adminSettings?.defaultNotIncluded?.length) {
                          setNotIncludedInput(adminSettings.defaultNotIncluded.join("\n"));
                        }
                      }}
                    >
                      Fill empty lists with site defaults
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Packages</p>
                <PackageTiersEditor tiers={packageTiers} onChange={setPackageTiers} defaultNights={defaultHotelNights} />
              </div>

              {legacySource ? <LegacyItineraryContentPanel doc={legacySource} /> : null}

              <div className="rounded-2xl border border-dashed border-border bg-panel-elevated p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">On every PDF (read-only)</p>
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
                  onClick={() =>
                    void afterSave(async () => {
                      if (!sessionToken || !itineraryId) return;
                      await markFinal({ sessionToken, itineraryId });
                      await downloadPdfNow();
                      router.push("/admin/itineraries");
                    }, setFinishing)
                  }
                >
                  {finishing ? "Finishing…" : "Finish (download + mark final)"}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <div className={cn("lg:sticky lg:top-24", mobileTab !== "pdf" && "hidden lg:block")}>
          <div className="rounded-2xl border border-border bg-panel-elevated p-2">
            <p className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-muted">Live PDF</p>
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
