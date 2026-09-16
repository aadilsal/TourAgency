"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { UnifiedBooking } from "@convex/bookings";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { formatMoney } from "@/lib/money";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { StatusSelect } from "@/components/admin/shared/StatusSelect";
import { InlineNoteEditor } from "@/components/admin/shared/InlineNoteEditor";
import { InboxFilterTabs, LoadMoreFooter } from "@/components/admin/shared/InboxControls";
import { useMergedPagination } from "@/components/admin/shared/useMergedPagination";

const statuses = ["pending", "confirmed", "cancelled"] as const;
type BookingStatus = (typeof statuses)[number];
type StatusFilter = "all" | BookingStatus;

const PAGE_SIZE = 25;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
] as const;

function tripSummary(r: UnifiedBooking): string {
  const bits: string[] = [];
  if (r.preferredStart || r.preferredEnd) {
    bits.push(`${r.preferredStart ?? "?"} → ${r.preferredEnd ?? "?"}`);
  }
  if (r.departureCity) bits.push(r.departureCity);
  if (r.adults != null || r.children != null) {
    bits.push(`A${r.adults ?? "—"} / C${r.children ?? "—"}`);
  }
  if (r.specialNeeds?.trim()) {
    const s = r.specialNeeds.trim();
    bits.push(s.length > 40 ? `${s.slice(0, 40)}…` : s);
  }
  return bits.join(" · ") || "—";
}

function DetailField({ label, value }: { label: string; value?: string }) {
  if (!value || !value.trim()) return null;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm text-brand-ink">{value}</p>
    </div>
  );
}

function BookingDetail({
  r,
  colSpan,
  onSaveNote,
  canMutate,
}: {
  r: UnifiedBooking;
  colSpan: number;
  onSaveNote: (note: string) => Promise<unknown>;
  canMutate: boolean;
}) {
  const phone = r.phone;
  const dateRange =
    r.preferredStart || r.preferredEnd
      ? `${r.preferredStart ?? "?"} → ${r.preferredEnd ?? "?"}`
      : undefined;
  const pax =
    r.adults != null || r.children != null
      ? `${r.adults ?? 0} adult(s), ${r.children ?? 0} child(ren)`
      : undefined;
  const price =
    typeof r.totalPrice === "number" && r.totalPrice > 0
      ? formatMoney(r.totalPrice, r.currency === "PKR" ? "PKR" : "USD")
      : undefined;
  return (
    <tr className="border-b border-slate-100 bg-slate-50/60 last:border-0">
      <td colSpan={colSpan} className="px-4 py-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Customer" value={r.name} />
          <DetailField label="Phone" value={phone} />
          <DetailField label="Email" value={r.email} />
          <DetailField
            label="Account"
            value={r.kind === "guest" ? "Guest (no login)" : "Registered member"}
          />
          <DetailField
            label="Tour"
            value={r.tourDeleted ? `${r.tourTitle} (tour since deleted)` : r.tourTitle}
          />
          <DetailField
            label="Travellers"
            value={`${r.peopleCount} ${r.peopleCount === 1 ? "person" : "people"}`}
          />
          <DetailField label="Preferred dates" value={dateRange} />
          <DetailField label="Departure city" value={r.departureCity} />
          <DetailField label="Adults / children" value={pax} />
          <DetailField label="Estimated value" value={price} />
          <DetailField label="Special needs" value={r.specialNeeds} />
          <DetailField label="Customer notes" value={r.notes} />
        </div>
        {!phone && !r.email ? (
          <p className="mt-2 text-xs text-amber-700">
            No contact details were captured for this request.
          </p>
        ) : null}
        <InlineNoteEditor
          className="mt-4"
          value={r.adminNote}
          disabled={!canMutate}
          hint="Internal only — never shown to the customer."
          onSave={onSaveNote}
        />
        <div className="mt-4">
          {r.itineraryId ? (
            <ButtonLink
              href={`/admin/itineraries/${r.itineraryId}`}
              variant="secondary"
              className="!min-h-9 !px-3 !py-1.5 !text-xs"
            >
              View itinerary{r.itineraryTitle ? ` — ${r.itineraryTitle}` : ""}
            </ButtonLink>
          ) : r.tourDeleted ? null : (
            <ButtonLink
              href={`/admin/itineraries/new?sourceKind=${r.kind}&sourceBookingId=${r.id}&sourceTourId=${r.tourId}&clientName=${encodeURIComponent(r.name)}&title=${encodeURIComponent(`${r.tourTitle} — ${r.name}`)}`}
              variant="secondary"
              className="!min-h-9 !px-3 !py-1.5 !text-xs"
            >
              Create itinerary for this booking
            </ButtonLink>
          )}
        </div>
      </td>
    </tr>
  );
}

export function AdminBookingsTable() {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const [filter, setFilter] = useState<StatusFilter>("all");
  const baseArgs = canMutate
    ? { sessionToken, ...(filter === "all" ? {} : { status: filter }) }
    : null;

  // Guest requests and member bookings live in two tables: page each one and
  // merge in creation order, so the list scales without a full-table read.
  const guest = usePaginatedQuery(
    api.bookings.listBookingsPage,
    baseArgs ? { ...baseArgs, kind: "guest" as const } : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const member = usePaginatedQuery(
    api.bookings.listBookingsPage,
    baseArgs ? { ...baseArgs, kind: "user" as const } : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const merged = useMergedPagination<UnifiedBooking>(
    [guest, member],
    (r) => r.createdAt,
    PAGE_SIZE,
  );

  const updateStatus = useMutation(api.bookings.updateBookingStatus);
  const setNote = useMutation(api.bookings.setBookingAdminNote);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function requireToken(): string {
    if (typeof sessionToken !== "string") {
      throw new Error("Session expired — refresh and sign in again.");
    }
    return sessionToken;
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <InboxFilterTabs options={FILTERS} value={filter} onChange={setFilter} />

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-[560px] w-full text-left text-sm">
          <thead className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Tour</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {merged.results.map((r) => {
              const key = `${r.kind}-${r.id}`;
              const isOpen = expanded.has(key);
              const contactLine = r.email || r.phone || "—";
              return (
                <Fragment key={key}>
                  <tr className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(key)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? `Hide details for ${r.name}` : `Show details for ${r.name}`}
                        className="flex min-h-9 items-start gap-2 text-left"
                      >
                        <ChevronDown
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                        <span>
                          <span className="font-medium text-brand-ink">{r.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{contactLine}</span>
                          {r.adminNote ? (
                            <span className="mt-0.5 block max-w-[220px] truncate text-xs italic text-slate-500">
                              Note: {r.adminNote}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ring-1",
                          r.kind === "guest"
                            ? "bg-violet-50 text-violet-900 ring-violet-200"
                            : "bg-brand-sun/15 text-brand-sun ring-brand-sun/25",
                        )}
                      >
                        {r.kind === "guest" ? "Guest" : "Member"}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3 text-slate-700">
                      <span className="font-medium text-brand-ink">{r.tourTitle}</span>
                      {r.tourDeleted ? (
                        <span className="ml-1 text-[11px] font-semibold text-rose-600">(deleted)</span>
                      ) : null}
                      <span className="mt-1 block text-xs text-slate-500">
                        {r.peopleCount} {r.peopleCount === 1 ? "person" : "people"}
                        {typeof r.totalPrice === "number" && r.totalPrice > 0
                          ? ` · ${formatMoney(r.totalPrice, r.currency === "PKR" ? "PKR" : "USD")}`
                          : null}
                        {tripSummary(r) !== "—" ? ` · ${tripSummary(r)}` : null}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect
                        value={r.status}
                        options={statuses}
                        disabled={!canMutate}
                        label={`Set status for ${r.name}`}
                        onChange={(next) =>
                          updateStatus({
                            sessionToken: requireToken(),
                            kind: r.kind,
                            id: r.id,
                            status: next,
                          })
                        }
                      />
                    </td>
                  </tr>
                  {isOpen ? (
                    <BookingDetail
                      r={r}
                      colSpan={4}
                      canMutate={canMutate}
                      onSaveNote={(note) =>
                        setNote({
                          sessionToken: requireToken(),
                          kind: r.kind,
                          id: r.id,
                          adminNote: note,
                        })
                      }
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <LoadMoreFooter
          status={canMutate ? merged.status : "LoadingFirstPage"}
          count={merged.results.length}
          onLoadMore={merged.loadMore}
          noun="requests"
          emptyText={
            filter === "all"
              ? "No customisation requests yet."
              : "No customisation requests match this filter."
          }
        />
      </div>
    </div>
  );
}
