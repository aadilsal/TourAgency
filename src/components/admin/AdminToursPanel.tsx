"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { TourPdfImportButton } from "@/components/admin/TourPdfImportButton";
import { asBoolean, asJson, asNumber, asString, asStringArray } from "@/lib/bulkUpload/coerce";
import { importInBatches } from "@/lib/bulkUpload/importInBatches";
import { TOUR_PDF_DRAFT_STORAGE_KEY } from "@/lib/tour-draft";

export function AdminToursPanel() {
  const router = useRouter();
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
  const deleteTour = useMutation(api.tours.deleteTour);
  const updateTour = useMutation(api.tours.updateTour);
  const bulkUpsert = useMutation(api.tours.bulkUpsert);

  const [msg, setMsg] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const sortedTours = useMemo(() => {
    if (!tours) return [];
    return [...tours].sort((a, b) => a.title.localeCompare(b.title));
  }, [tours]);

  async function onSeed() {
    setMsg(null);
    try {
      const r = await seed({});
      setMsg(r.skipped ? "Tours already exist." : `Inserted ${r.inserted} tours.`);
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
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
        <Button type="button" variant="primary" onClick={() => router.push("/admin/tours/new")}>
          <Plus className="h-4 w-4" aria-hidden />
          Add tour
        </Button>
        <TourPdfImportButton
          sessionToken={sessionToken}
          disabled={!hasConvexSessionToken}
          onDraft={(draft) => {
            try {
              sessionStorage.setItem(TOUR_PDF_DRAFT_STORAGE_KEY, JSON.stringify(draft));
            } catch {
              /* ignore quota errors */
            }
            router.push("/admin/tours/new");
          }}
          onError={setMsg}
        />
        <Button type="button" variant="secondary" onClick={() => setBulkOpen(true)}>
          Bulk upload
        </Button>
        <Button type="button" variant="secondary" onClick={() => void onSeed()}>
          Seed sample tours
        </Button>
        {msg ? <span className="text-sm text-brand-muted">{msg}</span> : null}
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
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTours.map((t) => (
              <tr key={t._id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-brand-ink">{t.title}</td>
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
                  {Array.isArray(t.types) && t.types.length > 0 ? t.types.join(", ") : "-"}
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
                        t.isActive ? "justify-end bg-emerald-500" : "justify-start bg-slate-300",
                      )}
                      onClick={() => void updateTour({ tourId: t._id, isActive: !t.isActive })}
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
                    <Link
                      href={`/admin/tours/${t._id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </Link>
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

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk upload tours"
        description="Upload a .json or .xlsx file. Rows are upserted by slug. For nested fields, use JSON-in-cell (recommended) or newline-separated lists where applicable."
        templateHint={
          <div className="space-y-1">
            <p className="font-semibold">Required keys</p>
            <p className="font-mono text-xs">
              title, slug, description, durationDays, location, images, itinerary, isActive
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
          const price = asNumber(row.price) ?? 0;
          const durationDays = asNumber(row.durationDays);
          const location = asString(row.location);
          const isActive = asBoolean(row.isActive);
          if (!title) throw new Error("Missing title");
          if (!slug) throw new Error("Missing slug");
          if (!description) throw new Error("Missing description");
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
