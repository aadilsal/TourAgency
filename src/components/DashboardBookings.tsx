"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";
import { CalendarRange, Compass, LayoutGrid, Table2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { formatMoney, type CurrencyCode } from "@/lib/money";

type BookingRow = {
  source: "member" | "guest";
  _id: string;
  peopleCount: number;
  currency?: CurrencyCode;
  totalPrice: number;
  status: string;
  createdAt: number;
  preferredStart?: string;
  preferredEnd?: string;
  departureCity?: string;
  tour: { title: string } | null;
};

function statusStyles(status: string) {
  if (status === "confirmed")
    return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
  if (status === "pending")
    return "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
  if (status === "cancelled")
    return "bg-rose-100 text-rose-800 ring-1 ring-rose-200";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

export function DashboardBookings() {
  const sessionToken = useConvexSessionToken();
  const rows = useQuery(
    api.bookings.getUserBookings,
    sessionToken ? { sessionToken } : "skip",
  );
  const [view, setView] = useState<"cards" | "table">("cards");

  if (sessionToken === undefined) {
    return <p className="mt-6 text-sm text-slate-400">Loading…</p>;
  }
  if (sessionToken === null) {
    return (
      <p className="mt-6 text-sm text-slate-400">
        Sign in to see your bookings.
      </p>
    );
  }
  if (rows === undefined) {
    return <p className="mt-6 text-sm text-slate-400">Loading…</p>;
  }
  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center backdrop-blur-sm">
        <Compass className="mx-auto h-10 w-10 text-slate-500" aria-hidden />
        <p className="mt-3 text-sm text-slate-400">
          No bookings yet.{" "}
          <Link href="/tours" className="font-semibold text-brand-accent underline">
            Browse tours
          </Link>
        </p>
      </div>
    );
  }

  const list = rows as BookingRow[];

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <span className="mr-auto text-xs font-medium uppercase tracking-wide text-slate-500">
          View
        </span>
        <Button
          type="button"
          variant={view === "cards" ? "primary" : "secondary"}
          className="!px-3 !py-2"
          onClick={() => setView("cards")}
          aria-pressed={view === "cards"}
        >
          <LayoutGrid className="h-4 w-4" aria-hidden />
          Cards
        </Button>
        <Button
          type="button"
          variant={view === "table" ? "primary" : "secondary"}
          className="!px-3 !py-2"
          onClick={() => setView("table")}
          aria-pressed={view === "table"}
        >
          <Table2 className="h-4 w-4" aria-hidden />
          Table
        </Button>
      </div>

      {view === "cards" ? (
        <ul className="mt-6 space-y-4">
          {list.map((b) => (
            <li key={`${b.source}-${b._id}`}>
              <Card className="p-5 ring-1 ring-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-brand-ink">
                      {b.tour?.title ?? "Tour"}
                    </p>
                    {b.source === "guest" ? (
                      <p className="mt-0.5 text-xs text-brand-muted">
                        Linked guest booking
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-brand-muted">
                      {b.peopleCount} travelers ·{" "}
                      {formatMoney(b.totalPrice, b.currency === "PKR" ? "PKR" : "USD")}
                    </p>
                    {(b.preferredStart || b.preferredEnd || b.departureCity) && (
                      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-brand-muted">
                        <CalendarRange className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
                        {b.preferredStart || "—"} → {b.preferredEnd || "—"}
                        {b.departureCity ? ` · ${b.departureCity}` : ""}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-brand-muted">
                      Booked{" "}
                      {new Date(b.createdAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold capitalize",
                      statusStyles(b.status),
                    )}
                  >
                    {b.status}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-white/10">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Travelers</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Booked</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr
                  key={`${b.source}-${b._id}`}
                  className="border-b border-white/5 bg-white/[0.02] last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-brand-ink">
                    <span className="block">{b.tour?.title ?? "Tour"}</span>
                    {b.source === "guest" ? (
                      <span className="mt-0.5 block text-xs font-normal text-brand-muted">
                        Guest (linked)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {b.peopleCount}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {formatMoney(b.totalPrice, b.currency === "PKR" ? "PKR" : "USD")}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(b.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "inline-block rounded-full px-3 py-1 text-xs font-bold capitalize",
                        statusStyles(b.status),
                      )}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
