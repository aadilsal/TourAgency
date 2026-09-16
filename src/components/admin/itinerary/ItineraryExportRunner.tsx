"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import type { ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";
import {
  buildItineraryDocumentModel,
  itineraryFileName,
  itineraryStorageIds,
  type ItineraryDocumentSettings,
  type ItineraryRecord,
} from "@/components/admin/itinerary/itineraryModel";

/** Loads a saved itinerary and builds its export model (shared by PDF + Word). */
export function useItineraryDocumentModel(itineraryId: string) {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";

  const itinQuery = useSafeQuery(
    api.itineraries.getForAdmin,
    canQuery ? { sessionToken, itineraryId: itineraryId as Id<"itineraries"> } : "skip",
  );
  const itin = itinQuery.data as ItineraryRecord | null | undefined;

  const storageIds = useMemo(() => (itin ? itineraryStorageIds(itin) : []), [itin]);
  const resolved = useQuery(
    api.media.resolveStorageIdsForAdmin,
    canQuery && itin && storageIds.length > 0 ? { sessionToken, ids: storageIds } : "skip",
  ) as (string | null)[] | undefined;
  const publicSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const adminSettings = useSafeQuery(
    api.siteSettings.getAdminSiteSettings,
    canQuery ? { sessionToken } : "skip",
  ).data;

  const model = useMemo<ItineraryPdfModel | null>(() => {
    if (!itin) return null;
    // Rendering before image URLs resolve would silently drop images.
    if (storageIds.length > 0 && resolved === undefined) return null;
    const urls = new Map<string, string | null>();
    storageIds.forEach((id, i) => urls.set(id, resolved?.[i] ?? null));
    return buildItineraryDocumentModel(itin, {
      adminSettings: adminSettings as ItineraryDocumentSettings | undefined,
      publicSettings: publicSettings as ItineraryDocumentSettings | undefined,
      urlFor: (id) => urls.get(id) ?? null,
    });
  }, [adminSettings, itin, publicSettings, resolved, storageIds]);

  return { sessionToken, canQuery, itin, model, error: itinQuery.error };
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Download page body: builds the file from the saved record and downloads it once. */
export function ItineraryExportRunner({
  itineraryId,
  kind,
  build,
}: {
  itineraryId: string;
  kind: "pdf" | "docx";
  build: (model: ItineraryPdfModel) => Promise<Blob>;
}) {
  const { sessionToken, canQuery, itin, model, error } = useItineraryDocumentModel(itineraryId);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const didRun = useRef(false);
  const buildRef = useRef(build);
  buildRef.current = build;

  const run = async (m: ItineraryPdfModel, title: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const blob = await buildRef.current(m);
      triggerDownload(blob, itineraryFileName(title, kind));
      setMsg("Download started.");
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!itin || !model || didRun.current) return;
    didRun.current = true;
    void run(model, itin.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itin, model]);

  if (!canQuery) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading session…" : "Sign in required."}
      </p>
    );
  }
  if (itin === undefined) {
    return (
      <>
        <QueryErrorBanner error={error} />
        <p className="text-sm text-muted">Loading itinerary…</p>
      </>
    );
  }
  if (!itin) return <p className="text-sm text-muted">Itinerary not found.</p>;

  const label = kind === "pdf" ? "PDF" : "Word file";
  return (
    <div className="space-y-3">
      <QueryErrorBanner error={error} />
      <h1 className="text-xl font-semibold text-foreground">Downloading {label}…</h1>
      <p className="text-sm text-muted">
        {busy || !model ? "Preparing file…" : "If your download didn’t start, use the button below."}
      </p>
      {msg ? (
        <div className="rounded-xl border border-border bg-panel-elevated p-3 text-sm">{msg}</div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!model || busy}
          onClick={() => model && void run(model, itin.title)}
          className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Download again
        </button>
        <Link
          href={`/admin/itineraries/${itin._id}`}
          className="inline-flex items-center justify-center rounded-xl border border-border bg-panel px-4 py-2 text-sm font-semibold text-foreground hover:bg-panel-elevated"
        >
          Back to itinerary
        </Link>
        <Link
          href="/admin/itineraries"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-panel px-4 py-2 text-sm font-semibold text-foreground hover:bg-panel-elevated"
        >
          Back to list
        </Link>
      </div>
    </div>
  );
}
