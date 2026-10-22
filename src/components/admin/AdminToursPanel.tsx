"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search } from "lucide-react";
import { IconAction, IconActionLink } from "@/components/admin/shared/IconAction";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { TourPdfImportButton } from "@/components/admin/TourPdfImportButton";
import { adminErrorMessage } from "@/components/admin/tour-form/errors";
import { MoreMenu } from "@/components/admin/tour-form/fields";
import { asBoolean, asJson, asNumber, asString, asStringArray } from "@/lib/bulkUpload/coerce";
import { importInBatches } from "@/lib/bulkUpload/importInBatches";
import { TOUR_PDF_DRAFT_STORAGE_KEY } from "@/lib/tours/tour-draft";

const PAGE_SIZE = 50;

/** Non-empty array or `undefined`, so blank spreadsheet cells never clear data. */
function nonEmpty<T>(arr: T[] | undefined): T[] | undefined {
  return arr && arr.length > 0 ? arr : undefined;
}

export function AdminToursPanel() {
  const router = useRouter();
  const sessionToken = useConvexSessionToken();
  const hasConvexSessionToken = typeof sessionToken === "string";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    results: tours,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.tours.listToursForAdmin,
    hasConvexSessionToken ? { sessionToken, search: search || undefined } : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const seed = useMutation(api.seed.seedSampleTours);
  const destinations = useQuery(api.destinations.listForTourAssignment, {});
  const deleteTour = useMutation(api.tours.deleteTour);
  const updateTour = useMutation(api.tours.updateTour);
  const bulkUpsert = useMutation(api.tours.bulkUpsert);

  const [msg, setMsg] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  /** These used to be fire-and-forget: failures now surface in the panel. */
  async function toggleActive(tourId: Id<"tours">, isActive: boolean) {
    setMsg(null);
    if (!hasConvexSessionToken) {
      setMsg("You have been signed out. Refresh the page and sign in again.");
      return;
    }
    try {
      await updateTour({ sessionToken, tourId, isActive });
    } catch (e) {
      setMsg(adminErrorMessage(e));
    }
  }

  async function removeTour(tourId: Id<"tours">) {
    setMsg(null);
    if (!hasConvexSessionToken) {
      setMsg("You have been signed out. Refresh the page and sign in again.");
      return;
    }
    try {
      await deleteTour({ sessionToken, tourId });
    } catch (e) {
      // e.g. "…has bookings… Deactivate it instead" — show it verbatim.
      setMsg(adminErrorMessage(e));
    }
  }

  async function onSeed() {
    setMsg(null);
    try {
      const r = await seed({ sessionToken: sessionToken as string });
      setMsg(r.skipped ? "Tours already exist." : `Added ${r.inserted} sample tours.`);
    } catch (e) {
      setMsg(toUserFacingErrorMessage(e));
    }
  }

  if (sessionToken === undefined || (hasConvexSessionToken && status === "LoadingFirstPage")) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      {!hasConvexSessionToken ? (
        <p className="text-sm text-amber-800">
          Log in with an admin session to manage tours.
        </p>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <TourPdfImportButton
            variant="primary"
            label="Upload tour document (AI fills the form)"
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
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              // "Add tour" is a blank form: drop any leftover document import.
              try {
                sessionStorage.removeItem(TOUR_PDF_DRAFT_STORAGE_KEY);
              } catch {
                /* ignore */
              }
              router.push("/admin/tours/new");
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add tour manually
          </Button>
          <MoreMenu
            items={[
              { label: "Upload many tours from a spreadsheet", onSelect: () => setBulkOpen(true) },
              process.env.NODE_ENV === "development" && {
                label: "Seed sample tours (developer only)",
                onSelect: () => void onSeed(),
              },
            ]}
          />
        </div>
        <p className="text-xs text-slate-500">
          Have a tour plan as a PDF, Word or text file? Upload it and the form is filled in for
          you to check and save.
        </p>
      </div>

      {msg ? (
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {msg}
        </p>
      ) : null}

      <label className="relative block max-w-sm">
        <span className="sr-only">Search tours by title</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tours by title…"
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
        />
      </label>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="admin-stack-table min-w-[720px] w-full text-left text-sm">
          <thead className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tour</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Types</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tours.map((t) => (
              <tr key={t._id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <span className="block font-medium text-brand-ink">
                    {t.title}
                    {t.photoCount === 0 ? (
                      <span
                        className="ml-2 inline-block rounded-full bg-rose-50 px-2 py-0.5 align-middle text-[11px] font-semibold text-rose-700"
                        title="This tour has no photos. The website shows a destination photo instead — open the tour and add your own under Tour images."
                      >
                        No photos
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs text-slate-400">
                    <span className="sr-only">Web address: </span>/tours/{t.slug}
                  </span>
                </td>
                <td data-label="Location" className="px-4 py-3 text-slate-600">{t.location}</td>
                <td data-label="Destination" className="px-4 py-3 text-slate-600">
                  {(() => {
                    const ids = [
                      ...(Array.isArray(t.destinationIds) ? t.destinationIds : []),
                      ...(t.destinationId ? [t.destinationId] : []),
                    ];
                    const names = Array.from(new Set(ids))
                      .map((id) => destinations?.find((d) => d._id === id)?.name)
                      .filter((name): name is string => Boolean(name));
                    return names.length > 0 ? names.join(", ") : "-";
                  })()}
                </td>
                <td data-label="Types" className="px-4 py-3 text-slate-600">
                  {Array.isArray(t.types) && t.types.length > 0 ? t.types.join(", ") : "-"}
                </td>
                <td data-label="Days" className="px-4 py-3 text-slate-600">{t.durationDays}</td>
                <td data-label="Active" className="px-4 py-3">
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
                        "relative flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors before:absolute before:-inset-2.5 before:content-[''] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2",
                        t.isActive ? "justify-end bg-emerald-500" : "justify-start bg-slate-300",
                      )}
                      onClick={() => void toggleActive(t._id, !t.isActive)}
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
                <td data-stack="actions" className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <IconActionLink
                      href={`/admin/tours/${t._id}/edit`}
                      label="Edit tour"
                      icon={Pencil}
                    />
                    <IconAction
                      label="Delete tour"
                      onClick={() => {
                        if (
                          confirm(
                            `Permanently delete “${t.title}”? This can't be undone. Tours with bookings, reviews or itineraries can't be deleted — switch them off instead.`,
                          )
                        ) {
                          void removeTour(t._id);
                        }
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tours.length === 0 && hasConvexSessionToken ? (
          <p className="p-6 text-sm text-slate-500">
            {search ? `No tours match “${search}”.` : "No tours yet. Upload a tour document or add one manually."}
          </p>
        ) : null}
      </div>

      {status === "CanLoadMore" || status === "LoadingMore" ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            disabled={status === "LoadingMore"}
            onClick={() => loadMore(PAGE_SIZE)}
          >
            {status === "LoadingMore" ? "Loading…" : "Load more tours"}
          </Button>
        </div>
      ) : null}

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Upload many tours from a spreadsheet"
        description="Upload an Excel (.xlsx) or .json file with one tour per row. Rows with the same web address as an existing tour update that tour; new ones are added. Empty cells leave the current value as it is."
        templateHint={
          <div className="space-y-1">
            <p className="font-semibold">Columns you must fill in</p>
            <p className="font-mono text-xs">
              title, slug, description, durationDays, location, isActive (+ itinerary for new tours)
            </p>
            <p className="text-xs text-slate-600">
              “slug” is the tour’s web address (e.g. hunza-7-days). Optional columns: images,
              pricePkr, priceUsd, types, highlights, included, excluded, timeSlots, ticketGroups,
              maxPeople, minAge, tourTypeLabel, office, email.
            </p>
            <p className="text-xs text-slate-600">
              Lists (images, highlights…) can be one item per line. New tours also need the
              day-by-day itinerary column, written like
              [{"{"}&quot;day&quot;: 1, &quot;title&quot;: &quot;Arrive in Hunza&quot;{"}"}].
            </p>
          </div>
        }
        transformRow={(row) => {
          const title = asString(row.title);
          const slug = asString(row.slug);
          const description = asString(row.description);
          const durationDays = asNumber(row.durationDays);
          const location = asString(row.location);
          const isActive = asBoolean(row.isActive);
          if (!title) throw new Error("Missing title");
          if (!slug) throw new Error("Missing slug");
          if (!description) throw new Error("Missing description");
          if (durationDays === undefined) throw new Error("Missing durationDays");
          if (!location) throw new Error("Missing location");
          if (isActive === undefined) throw new Error("Missing isActive");

          let normalizedItinerary:
            | Array<{ day: number; title: string; description: string }>
            | undefined;
          if (asString(row.itinerary) !== undefined || Array.isArray(row.itinerary)) {
            const itinerary = asJson<
              Array<{ day?: number; title?: string; description?: string }>
            >(row.itinerary);
            if (!Array.isArray(itinerary)) {
              throw new Error("itinerary must be a JSON array");
            }
            normalizedItinerary = nonEmpty(
              itinerary.map((it, idx) => ({
                day: typeof it.day === "number" ? it.day : idx + 1,
                title:
                  typeof it.title === "string" && it.title.trim() ? it.title : `Day ${idx + 1}`,
                description: typeof it.description === "string" ? it.description : "",
              })),
            );
          }
          const ticketGroups = asJson<Array<{ label: string; ageRange?: string }>>(
            row.ticketGroups,
          );

          return {
            title,
            slug,
            description,
            durationDays,
            location,
            isActive,
            price: asNumber(row.price),
            pricePkr: asNumber(row.pricePkr),
            priceUsd: asNumber(row.priceUsd),
            images: nonEmpty(asStringArray(row.images)),
            itinerary: normalizedItinerary,
            types: nonEmpty(asStringArray(row.types)),
            highlights: nonEmpty(asStringArray(row.highlights)),
            included: nonEmpty(asStringArray(row.included)),
            excluded: nonEmpty(asStringArray(row.excluded)),
            timeSlots: nonEmpty(asStringArray(row.timeSlots)),
            ticketGroups: Array.isArray(ticketGroups) ? nonEmpty(ticketGroups) : undefined,
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
            // Every optional key is `undefined` when its cell was blank, and the
            // server only patches keys that are present.
            importBatch: async (batch) =>
              bulkUpsert({ sessionToken: sessionToken as string, rows: batch }),
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
