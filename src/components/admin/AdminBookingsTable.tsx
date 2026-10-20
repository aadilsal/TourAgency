"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { UnifiedBooking } from "@convex/bookings";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { formatMoney } from "@/lib/money";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafePaginatedQuery } from "@/hooks/useSafePaginatedQuery";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { StatusSelect } from "@/components/admin/shared/StatusSelect";
import { InlineNoteEditor } from "@/components/admin/shared/InlineNoteEditor";
import { InboxFilterTabs, LoadMoreFooter } from "@/components/admin/shared/InboxControls";
import { useMergedPagination } from "@/components/admin/shared/useMergedPagination";
import { ContactActions } from "@/components/admin/shared/ContactActions";
import { useInboxFilter } from "@/components/admin/shared/inboxHooks";
import { BOOKING_STATUS_LABEL, labelFrom } from "@/components/admin/shared/statusLabels";

const statuses = ["pending", "confirmed", "cancelled"] as const;
type BookingStatus = (typeof statuses)[number];
type StatusFilter = "all" | BookingStatus;

const PAGE_SIZE = 25;

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
] as const;
const FILTER_IDS = FILTERS.map((f) => f.id);

const statusLabel = labelFrom(BOOKING_STATUS_LABEL);

function tripSummary(r: UnifiedBooking): string {
  const bits: string[] = [];
  if (r.preferredStart || r.preferredEnd) {
    bits.push(`${r.preferredStart ?? "?"} → ${r.preferredEnd ?? "?"}`);
  }
  if (r.departureCity) bits.push(r.departureCity);
  if (r.adults != null || r.children != null) {
    bits.push(`${r.adults ?? 0} adults, ${r.children ?? 0} children`);
  }
  if (r.specialNeeds?.trim()) {
    const s = r.specialNeeds.trim();
    bits.push(s.length > 40 ? `${s.slice(0, 40)}…` : s);
  }
  return bits.join(" · ");
}

/** YYYY-MM-DD from a stored preferred date (already ISO, or any parseable date). */
function isoDate(raw?: string): string | undefined {
  const s = raw?.trim();
  if (!s) return undefined;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (m) return m[1];
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return undefined;
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Link to a new itinerary pre-filled from this booking. URL contract (read by
 * the itinerary editor): sourceKind, sourceBookingId, sourceTourId, clientName,
 * title, clientPhone, clientEmail, startDate (YYYY-MM-DD), adults, children —
 * missing values are omitted.
 */
export function quoteHrefForBooking(r: UnifiedBooking): string {
  const adults = r.adults ?? (r.children == null ? r.peopleCount : undefined);
  const params: [string, string | number | undefined][] = [
    ["sourceKind", r.kind],
    ["sourceBookingId", r.id],
    ["sourceTourId", r.tourId],
    ["clientName", r.name],
    ["title", `${r.tourTitle} — ${r.name}`],
    ["clientPhone", r.phone?.trim() || undefined],
    ["clientEmail", r.email?.trim() || undefined],
    ["startDate", isoDate(r.preferredStart)],
    ["adults", adults != null && adults > 0 ? adults : undefined],
    ["children", r.children != null && r.children >= 0 ? r.children : undefined],
  ];
  const qs = params
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `/admin/itineraries/new?${qs}`;
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

function BookingDetailBody({
  r,
  onSaveNote,
  canMutate,
}: {
  r: UnifiedBooking;
  onSaveNote: (note: string) => Promise<unknown>;
  canMutate: boolean;
}) {
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
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Customer" value={r.name} />
        <DetailField label="Phone" value={r.phone} />
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
      <InlineNoteEditor
        className="mt-4"
        value={r.adminNote}
        disabled={!canMutate}
        hint="Internal only — never shown to the customer."
        onSave={onSaveNote}
      />
    </>
  );
}

function QuoteLink({ r }: { r: UnifiedBooking }) {
  if (r.itineraryId) {
    return (
      <ButtonLink
        href={`/admin/itineraries/${r.itineraryId}`}
        variant="secondary"
        className="!px-3 !py-2 !text-sm"
      >
        Open quote{r.itineraryTitle ? ` — ${r.itineraryTitle}` : ""}
      </ButtonLink>
    );
  }
  if (r.tourDeleted) return null;
  return (
    <ButtonLink href={quoteHrefForBooking(r)} variant="secondary" className="!px-3 !py-2 !text-sm">
      Make quote (itinerary)
    </ButtonLink>
  );
}

export function AdminBookingsTable() {
  const sessionToken = useConvexSessionToken();
  const canMutate = typeof sessionToken === "string";
  const [filter, setFilter] = useInboxFilter<StatusFilter>(FILTER_IDS, "pending");
  const baseArgs = canMutate
    ? { sessionToken, ...(filter === "all" ? {} : { status: filter }) }
    : null;

  // Guest requests and member bookings live in two tables: page each one and
  // merge in creation order, so the list scales without a full-table read.
  const guest = useSafePaginatedQuery(
    api.bookings.listBookingsPage,
    baseArgs ? { ...baseArgs, kind: "guest" as const } : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const member = useSafePaginatedQuery(
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

  const statusSelect = (r: UnifiedBooking) => (
    <StatusSelect
      value={r.status}
      options={statuses}
      labelFor={statusLabel}
      disabled={!canMutate}
      label={`Set status for ${r.name}`}
      onChange={(next) =>
        updateStatus({ sessionToken: requireToken(), kind: r.kind, id: r.id, status: next })
      }
    />
  );
  const saveNote = (r: UnifiedBooking) => (note: string) =>
    setNote({ sessionToken: requireToken(), kind: r.kind, id: r.id, adminNote: note });
  const priceLine = (r: UnifiedBooking) => {
    const bits = [`${r.peopleCount} ${r.peopleCount === 1 ? "person" : "people"}`];
    if (typeof r.totalPrice === "number" && r.totalPrice > 0) {
      bits.push(formatMoney(r.totalPrice, r.currency === "PKR" ? "PKR" : "USD"));
    }
    const trip = tripSummary(r);
    if (trip) bits.push(trip);
    return bits.join(" · ");
  };

  const footer = (
    <LoadMoreFooter
      status={canMutate ? merged.status : "LoadingFirstPage"}
      count={merged.results.length}
      onLoadMore={merged.loadMore}
      noun="bookings"
      emptyText={
        filter === "all"
          ? "No bookings yet."
          : filter === "pending"
            ? "No new bookings — you're all caught up."
            : "No bookings match this filter."
      }
    />
  );

  return (
    <div className="space-y-4">
      <QueryErrorBanner error={guest.error ?? member.error} />
      <InboxFilterTabs options={FILTERS} value={filter} onChange={setFilter} />

      {/* Phones: stacked cards */}
      <div className="grid gap-3 md:hidden">
        {merged.results.map((r) => {
          const key = `${r.kind}-${r.id}`;
          const isOpen = expanded.has(key);
          return (
            <div key={key} className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-ink">{r.name}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700">
                    {r.tourTitle}
                    {r.tourDeleted ? (
                      <span className="ml-1 text-[11px] font-semibold text-rose-600">(deleted)</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{priceLine(r)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                {statusSelect(r)}
              </div>
              {r.adminNote ? (
                <p className="mt-2 truncate text-xs italic text-slate-500">Note: {r.adminNote}</p>
              ) : null}
              <ContactActions
                className="mt-3"
                name={r.name}
                phone={r.phone}
                email={r.email}
                about={`booking request for ${r.tourTitle}`}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <QuoteLink r={r} />
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleExpanded(key)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-black/5"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  {isOpen ? "Hide details" : "Details & note"}
                </button>
              </div>
              {isOpen ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <BookingDetailBody r={r} canMutate={canMutate} onSaveNote={saveNote(r)} />
                </div>
              ) : null}
            </div>
          );
        })}
        <div className="rounded-xl border border-slate-200/90 bg-white">{footer}</div>
      </div>

      {/* Tablets and up: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Tour</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {merged.results.map((r) => {
              const key = `${r.kind}-${r.id}`;
              const isOpen = expanded.has(key);
              return (
                <Fragment key={key}>
                  <tr className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(key)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? `Hide details for ${r.name}` : `Show details for ${r.name}`}
                        className="flex min-h-11 items-start gap-2 text-left"
                      >
                        <ChevronDown
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                        <span>
                          <span className="font-medium text-brand-ink">{r.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {r.email || r.phone || "—"}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                          {r.adminNote ? (
                            <span className="mt-0.5 block max-w-[220px] truncate text-xs italic text-slate-500">
                              Note: {r.adminNote}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </td>
                    <td className="max-w-[260px] px-4 py-3 align-top text-slate-700">
                      <span className="font-medium text-brand-ink">{r.tourTitle}</span>
                      {r.tourDeleted ? (
                        <span className="ml-1 text-[11px] font-semibold text-rose-600">(deleted)</span>
                      ) : null}
                      <span className="mt-1 block text-xs text-slate-500">{priceLine(r)}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ContactActions
                        compact
                        name={r.name}
                        phone={r.phone}
                        email={r.email}
                        about={`booking request for ${r.tourTitle}`}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">{statusSelect(r)}</td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-slate-100 bg-slate-50/60 last:border-0">
                      <td colSpan={4} className="px-4 py-4">
                        <BookingDetailBody r={r} canMutate={canMutate} onSaveNote={saveNote(r)} />
                        <div className="mt-4">
                          <QuoteLink r={r} />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {footer}
      </div>
    </div>
  );
}
