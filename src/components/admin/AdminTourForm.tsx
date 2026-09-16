"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useLocalDraft } from "@/hooks/useLocalDraft";
import { confirmDiscard, useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { Button } from "@/components/ui/Button";
import {
  DraftRestoreBanner,
  QueryErrorBanner,
  SaveStatusPill,
} from "@/components/admin/shared/EditorStatus";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { TOUR_PDF_DRAFT_STORAGE_KEY } from "@/lib/tour-draft";
import type { TourPdfImportDraft } from "@/lib/tourPdf/types";
import { BasicsSection } from "@/components/admin/tour-form/BasicsSection";
import { PricingSection } from "@/components/admin/tour-form/PricingSection";
import { DetailsSection } from "@/components/admin/tour-form/DetailsSection";
import { MediaSection } from "@/components/admin/tour-form/MediaSection";
import { ItinerarySection } from "@/components/admin/tour-form/ItinerarySection";
import { adminErrorMessage } from "@/components/admin/tour-form/errors";
import {
  PENDING_IMAGE_PREFIX,
  buildCreateArgs,
  buildUpdatePatch,
  emptyTourForm,
  formValuesEqual,
  pdfDraftToForm,
  rebaseFormValues,
  slugify,
  toServerFields,
  tourDocToForm,
  withoutPendingImages,
  type TourFormPatch,
  type TourFormValues,
} from "@/components/admin/tour-form/model";

/** What the local backup stores: my values + the server version they were based on. */
type TourDraftSnapshot = { values: TourFormValues; baseline: TourFormValues };

function isDraftSnapshot(x: unknown): x is TourDraftSnapshot {
  const s = x as Partial<TourDraftSnapshot> | null;
  return Boolean(s && typeof s === "object" && s.values && s.baseline);
}

/**
 * Admin tour editor (create + edit).
 *
 * Data-safety rules (see tour-form/model.ts for the save logic):
 * - The form stays mounted once loaded: session expiry or a failing query shows
 *   a banner instead of replacing the form.
 * - Unsaved edits are backed up to localStorage and offered back after a crash
 *   or reload; leaving with unsaved edits asks first.
 * - Saves send only changed fields plus the version they were based on. If the
 *   tour changed elsewhere, the editor offers to merge instead of overwriting.
 */
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
  const isEdit = mode === "edit" && Boolean(tourId);

  const destinations = useQuery(api.destinations.listForTourAssignment, {});
  const provinces = useQuery(api.provinces.listForTourAssignment, {});
  const createTour = useMutation(api.tours.createTour);
  const updateTour = useMutation(api.tours.updateTour);

  const tourQuery = useSafeQuery(
    api.tours.getTourForAdmin,
    isEdit && tourId && hasConvexSessionToken ? { tourId, sessionToken } : "skip",
  );
  const server = tourQuery.data;
  const serverRef = useRef(server);
  serverRef.current = server;

  const [values, setValues] = useState<TourFormValues>(emptyTourForm);
  /** The server version (edit) or blank form (create) that `values` started from. */
  const [baseline, setBaseline] = useState<TourFormValues>(emptyTourForm);
  const [initialized, setInitialized] = useState(!isEdit);
  const revisionRef = useRef<number | undefined>(undefined);
  const savingRef = useRef(false);
  const pdfAppliedRef = useRef(false);

  const [remoteVersion, setRemoteVersion] = useState<NonNullable<typeof server> | null>(null);
  const [remoteDeleted, setRemoteDeleted] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfImportWarnings, setPdfImportWarnings] = useState<string[]>([]);

  const dirty = initialized && !formValuesEqual(values, baseline);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useUnsavedChangesGuard(dirty);

  const onChange: TourFormPatch = useCallback((update) => {
    setValues((prev) => ({ ...prev, ...(typeof update === "function" ? update(prev) : update) }));
  }, []);

  // ── Edit mode: load once, then track newer server versions. ────────────────
  useEffect(() => {
    if (!isEdit || server === undefined) return;
    if (server === null) {
      // Deleted after we loaded it: keep the form so nothing typed is lost.
      if (initialized) setRemoteDeleted(true);
      return;
    }
    setRemoteDeleted(false);
    if (!initialized) {
      const form = tourDocToForm(server);
      setValues(form);
      setBaseline(form);
      revisionRef.current = server.updatedAt;
      setInitialized(true);
      return;
    }
    if (savingRef.current || server.updatedAt === revisionRef.current) return;
    if (!dirtyRef.current) {
      // Nothing unsaved: silently show the latest version.
      const form = tourDocToForm(server);
      setValues(form);
      setBaseline(form);
      revisionRef.current = server.updatedAt;
      setRemoteVersion(null);
    } else {
      setRemoteVersion(server);
    }
  }, [isEdit, server, initialized]);

  // ── Create mode: prefill from a PDF import draft, exactly once. ────────────
  useEffect(() => {
    if (mode !== "create" || !initialDraft || pdfAppliedRef.current) return;
    if (!destinations || !provinces) return; // need lookups to map slugs → ids
    pdfAppliedRef.current = true;
    setValues(pdfDraftToForm(initialDraft, destinations, provinces));
    setPdfImportWarnings(initialDraft.warnings);
    setMsg(
      initialDraft.enrichedByLlm
        ? "Imported from document — review fields, add price & images, then save."
        : "Imported from document (rules only) — review slug, description, and destinations.",
    );
  }, [mode, initialDraft, destinations, provinces]);

  // ── Local crash-proof backup. ──────────────────────────────────────────────
  const draftKey = !initialized
    ? null
    : isEdit
      ? `draft:tour:${tourId}`
      : "draft:tour:new";
  const snapshot = useMemo<TourDraftSnapshot>(() => ({ values, baseline }), [values, baseline]);
  const localDraft = useLocalDraft<TourDraftSnapshot>(draftKey, snapshot, dirty);
  const restorable =
    localDraft.restorable && isDraftSnapshot(localDraft.restorable.data)
      ? localDraft.restorable
      : null;
  const showRestore =
    initialized &&
    restorable !== null &&
    !formValuesEqual(withoutPendingImages(restorable.data.values), values);

  function restoreDraft() {
    if (!restorable) return;
    const saved = restorable.data;
    const { values: merged, overlaps } = rebaseFormValues(
      withoutPendingImages(saved.values),
      saved.baseline,
      isEdit ? baseline : values,
    );
    setValues(merged);
    localDraft.dismiss();
    setMsg(
      overlaps.length > 0
        ? `Restored your unsaved changes. ${overlaps.join(", ")} also changed on the server since then — your version is kept, so review before saving.`
        : "Restored your unsaved changes. Review, then save.",
    );
  }

  function mergeRemoteVersion() {
    if (!remoteVersion) return;
    const latest = tourDocToForm(remoteVersion);
    const { values: merged } = rebaseFormValues(values, baseline, latest);
    setValues(merged);
    setBaseline(latest);
    revisionRef.current = remoteVersion.updatedAt;
    setRemoteVersion(null);
    setMsg(null);
  }

  const remoteOverlaps = useMemo(
    () =>
      remoteVersion
        ? rebaseFormValues(values, baseline, tourDocToForm(remoteVersion)).overlaps
        : [],
    [remoteVersion, values, baseline],
  );

  const imageUploadFolderKey = `tours/${slugify(values.slug) || slugify(values.title) || "new-tour"}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (typeof sessionToken !== "string") {
      setMsg(
        "Your session has ended. Your edits are still here and backed up on this device — sign in again in a new tab, then press Save.",
      );
      return;
    }
    if (values.imageRefs.some((r) => r.startsWith(PENDING_IMAGE_PREFIX))) {
      setMsg("Wait for image uploads to finish before saving.");
      return;
    }
    const fields = toServerFields(values);
    if (fields.itinerary.length === 0) {
      setMsg("Add at least one itinerary day with a title.");
      return;
    }
    if (isEdit && remoteVersion) {
      setMsg("This tour changed elsewhere. Use “Load their changes” above first, then save.");
      return;
    }

    setSaving(true);
    savingRef.current = true;
    try {
      if (isEdit && tourId) {
        const patch = buildUpdatePatch(values, baseline);
        if (Object.keys(patch).length > 0) {
          const result = await updateTour({
            sessionToken,
            tourId,
            expectedUpdatedAt: revisionRef.current,
            ...patch,
          });
          if (result && typeof result.updatedAt === "number") {
            revisionRef.current = result.updatedAt;
          }
        }
      } else {
        await createTour({ sessionToken, ...buildCreateArgs(values) });
        try {
          sessionStorage.removeItem(TOUR_PDF_DRAFT_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
      localDraft.clear();
      setBaseline(values);
      router.push("/admin/tours");
      router.refresh();
    } catch (err) {
      setMsg(adminErrorMessage(err));
      setSaving(false);
      const latest = serverRef.current;
      if (isEdit && latest && latest.updatedAt !== revisionRef.current) {
        setRemoteVersion(latest);
      }
    } finally {
      savingRef.current = false;
    }
  }

  function onCancel() {
    if (!confirmDiscard(dirty)) return;
    if (dirty) {
      localDraft.clear();
      if (!isEdit) {
        try {
          sessionStorage.removeItem(TOUR_PDF_DRAFT_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    }
    router.push("/admin/tours");
  }

  // ── Before the first load only. Once initialized the form never unmounts. ─
  if (isEdit && !initialized) {
    if (sessionToken === null) {
      return (
        <p className="text-sm text-amber-800">Log in with an admin session to edit tours.</p>
      );
    }
    if (tourQuery.error) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-red-700">
            Couldn’t load this tour: {toUserFacingErrorMessage(tourQuery.error)}
          </p>
          <Link href="/admin/tours" className="text-sm font-semibold text-brand-primary hover:underline">
            ← Back to tours
          </Link>
        </div>
      );
    }
    if (server === null) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-red-700">Tour not found. It may have been deleted.</p>
          <Link href="/admin/tours" className="text-sm font-semibold text-brand-primary hover:underline">
            ← Back to tours
          </Link>
        </div>
      );
    }
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

      {showRestore && restorable ? (
        <DraftRestoreBanner
          savedAt={restorable.savedAt}
          onRestore={restoreDraft}
          onDiscard={localDraft.clear}
        />
      ) : null}
      <QueryErrorBanner error={tourQuery.error} />
      {remoteDeleted ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <strong>This tour was deleted elsewhere.</strong> Your edits are still on screen — copy
          anything you need before leaving this page.
        </div>
      ) : null}
      {remoteVersion ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            <strong>Someone else saved changes to this tour.</strong>{" "}
            {remoteOverlaps.length > 0
              ? `You both changed: ${remoteOverlaps.join(", ")} — your version of those will be kept.`
              : "Your edits don’t overlap with theirs."}
          </p>
          <button
            type="button"
            onClick={mergeRemoteVersion}
            className="min-h-10 shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
          >
            Load their changes (keep mine)
          </button>
        </div>
      ) : null}

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
          <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {msg}
          </p>
        ) : null}
        {!hasConvexSessionToken ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {sessionToken === undefined
              ? "Loading your admin session for uploads…"
              : "Your session has ended. Your edits are kept on this device — sign in again in a new tab, then save."}
          </p>
        ) : null}

        <BasicsSection
          values={values}
          onChange={onChange}
          destinations={destinations}
          provinces={provinces}
        />
        <PricingSection values={values} onChange={onChange} />
        <DetailsSection
          values={values}
          onChange={onChange}
          approvedReviews={
            server
              ? { average: server.approvedReviewAvg, count: server.approvedReviewCount }
              : undefined
          }
        />
        <MediaSection
          values={values}
          onChange={onChange}
          sessionToken={sessionToken}
          folderKey={imageUploadFolderKey}
          onMessage={setMsg}
        />
        <ItinerarySection values={values} onChange={onChange} />

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button type="submit" disabled={saving || !hasConvexSessionToken}>
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create tour"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <SaveStatusPill dirty={dirty && !saving} />
        </div>
      </form>
    </div>
  );
}
