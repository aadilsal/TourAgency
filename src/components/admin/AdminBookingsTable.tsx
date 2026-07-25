"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatMoney, type CurrencyCode } from "@/lib/money";

const statuses = ["pending", "confirmed", "cancelled"] as const;

type TripFields = {
  preferredStart?: string;
  preferredEnd?: string;
  departureCity?: string;
  adults?: number;
  children?: number;
  specialNeeds?: string;
  notes?: string;
};

type UnifiedRow =
  | ({
      kind: "guest";
      id: string;
      tourId: string;
      name: string;
      phone: string;
      email?: string;
      tourTitle: string;
      peopleCount: number;
      status: (typeof statuses)[number];
      currency?: CurrencyCode;
      totalPrice?: number;
      itineraryId?: string;
      itineraryTitle?: string;
    } & TripFields)
  | ({
      kind: "user";
      id: string;
      tourId: string;
      name: string;
      email: string;
      phone?: string;
      tourTitle: string;
      peopleCount: number;
      totalPrice: number;
      status: (typeof statuses)[number];
      currency?: CurrencyCode;
      itineraryId?: string;
      itineraryTitle?: string;
    } & TripFields);

type StatusFilter = "all" | "pending" | "confirmed";

function tripSummary(r: UnifiedRow): string {
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
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm text-brand-ink">{value}</p>
    </div>
  );
}

function BookingDetail({
  r,
  colSpan,
}: {
  r: UnifiedRow;
  colSpan: number;
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
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Customer" value={r.name} />
          <DetailField label="Phone" value={phone} />
          <DetailField label="Email" value={r.email} />
          <DetailField
            label="Account"
            value={r.kind === "guest" ? "Guest (no login)" : "Registered member"}
          />
          <DetailField label="Tour" value={r.tourTitle} />
          <DetailField
            label="Travellers"
            value={`${r.peopleCount} ${r.peopleCount === 1 ? "person" : "people"}`}
          />
          <DetailField label="Preferred dates" value={dateRange} />
          <DetailField label="Departure city" value={r.departureCity} />
          <DetailField label="Adults / children" value={pax} />
          <DetailField label="Estimated value" value={price} />
          <DetailField label="Special needs" value={r.specialNeeds} />
          <DetailField label="Notes" value={r.notes} />
        </div>
        {!phone && !r.email ? (
          <p className="mt-2 text-xs text-amber-700">
            No contact details were captured for this request.
          </p>
        ) : null}
        <div className="mt-3">
          {r.itineraryId ? (
            <ButtonLink
              href={`/admin/itineraries/${r.itineraryId}`}
              variant="secondary"
              className="!px-3 !py-1.5 !text-xs"
            >
              View itinerary{r.itineraryTitle ? ` — ${r.itineraryTitle}` : ""}
            </ButtonLink>
          ) : (
            <ButtonLink
              href={`/admin/itineraries/new?sourceKind=${r.kind}&sourceBookingId=${r.id}&sourceTourId=${r.tourId}&clientName=${encodeURIComponent(r.name)}&title=${encodeURIComponent(`${r.tourTitle} — ${r.name}`)}`}
              variant="secondary"
              className="!px-3 !py-1.5 !text-xs"
            >
              Create itinerary for this booking
            </ButtonLink>
          )}
        </div>
      </td>
    </tr>
  );
}

function statusBadgeClass(status: string) {
  if (status === "confirmed")
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "pending")
    return "bg-amber-100 text-amber-900 ring-amber-200";
  if (status === "cancelled")
    return "bg-rose-100 text-rose-800 ring-rose-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function AdminBookingsTable() {
  const rows = useQuery(api.bookings.getAllBookings, {});
  const updateStatus = useMutation(api.bookings.updateBookingStatus);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const list = rows as UnifiedRow[];
    if (filter === "all") return list;
    return list.filter((r) => r.status === filter);
  }, [rows, filter]);

  if (rows === undefined) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
        </span>
        {(
          [
            { id: "all" as const, label: "All" },
            { id: "pending" as const, label: "Pending" },
            { id: "confirmed" as const, label: "Confirmed" },
          ] as const
        ).map((f) => (
          <Button
            key={f.id}
            type="button"
            variant={filter === f.id ? "primary" : "secondary"}
            className="!px-3 !py-1.5 !text-xs"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
        <span className="ml-auto text-sm text-slate-500">
          {filtered.length} of {rows.length} shown
        </span>
      </div>

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
            {filtered.map((r) => {
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
                    className="flex items-start gap-2 text-left"
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
                        {contactLine}
                      </span>
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
                  <span className="font-medium text-brand-ink">
                    {r.tourTitle}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {r.peopleCount}{" "}
                    {r.peopleCount === 1 ? "person" : "people"}
                    {typeof r.totalPrice === "number" && r.totalPrice > 0
                      ? ` · ${formatMoney(r.totalPrice, r.currency === "PKR" ? "PKR" : "USD")}`
                      : null}
                    {tripSummary(r) !== "—" ? ` · ${tripSummary(r)}` : null}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    className={cn(
                      "max-w-[180px] cursor-pointer appearance-none rounded-full border-0 bg-[length:0.75rem] bg-[right_0.65rem_center] bg-no-repeat py-2 pl-3 pr-7 text-xs font-bold capitalize shadow-sm ring-2 ring-inset focus:outline-none focus:ring-2 focus:ring-brand-primary/35",
                      statusBadgeClass(r.status),
                    )}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23334155'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    }}
                    value={r.status}
                    aria-label={`Set status for ${r.name}`}
                    onChange={(e) => {
                      void updateStatus({
                        kind: r.kind,
                        id: r.id as string,
                        status: e.target.value as (typeof statuses)[number],
                      });
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s} className="bg-white text-slate-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              {isOpen ? <BookingDetail r={r} colSpan={4} /> : null}
              </Fragment>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No customisation requests yet.</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No customisation requests match this filter.
          </p>
        ) : null}
      </div>
    </div>
  );
}
