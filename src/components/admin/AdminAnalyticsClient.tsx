"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { BarChart3, CalendarCheck, Coins, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";

type Snapshot = {
  headline?: {
    totalBookings: number;
    leads: number;
    revenuePkr: number;
  };
  counts: Record<string, number>;
  pending: { guestBookings: number; userBookings: number };
  /** true = count stopped at the server cap; the real number is at least this. */
  capped?: Record<string, boolean>;
};

/** Plain names for the counts the server sends; anything not listed is not shown. */
const COUNT_LABELS: Array<{ key: string; label: string; hint: string }> = [
  { key: "guestBookings", label: "Bookings from guests", hint: "Booked without an account" },
  { key: "userBookings", label: "Bookings from members", hint: "Booked while signed in" },
  { key: "leads", label: "Enquiries", hint: "People who asked about a trip" },
  { key: "aiRequests", label: "AI trip plans", hint: "Plans requested from the AI planner" },
  { key: "tours", label: "Tours", hint: "Tours on your website" },
  { key: "users", label: "Registered visitors", hint: "People who created an account" },
];

export function AdminAnalyticsClient() {
  const sessionToken = useConvexSessionToken();
  const snap = useQuery(
    api.analytics.getAnalyticsSnapshot,
    typeof sessionToken === "string" ? { sessionToken } : "skip",
  );

  if (snap === undefined) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  const data = snap as Snapshot;
  const headline =
    data.headline ??
    ({
      totalBookings:
        (data.counts.guestBookings ?? 0) + (data.counts.userBookings ?? 0),
      leads: data.counts.leads ?? 0,
      revenuePkr: 0,
    } as const);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Total bookings
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-brand-ink">
                {headline.totalBookings}
                {data.capped?.guestBookings || data.capped?.userBookings ? "+" : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                From guests and signed-in members
              </p>
            </div>
            <span className="rounded-xl bg-brand-primary/10 p-2.5 text-brand-primary">
              <CalendarCheck className="h-6 w-6" aria-hidden />
            </span>
          </div>
        </Card>
        <Card className="border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Leads
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-brand-ink">
                {headline.leads}
                {data.capped?.leads ? "+" : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                People who asked about a trip (AI planner, booking form, added by you)
              </p>
            </div>
            <span className="rounded-xl bg-brand-sun/15 p-2.5 text-brand-sun">
              <Users className="h-6 w-6" aria-hidden />
            </span>
          </div>
        </Card>
        <Card className="border-slate-200/90 p-5 shadow-sm sm:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Revenue
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-brand-ink">
                PKR {headline.revenuePkr.toLocaleString()}
                {data.capped?.revenue ? "+" : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                From confirmed bookings only
              </p>
            </div>
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-700">
              <Coins className="h-6 w-6" aria-hidden />
            </span>
          </div>
        </Card>
      </div>

      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-ink">
          <BarChart3 className="h-4 w-4 text-brand-muted" aria-hidden />
          At a glance
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COUNT_LABELS.filter(({ key }) => typeof data.counts[key] === "number").map(
            ({ key, label, hint }) => (
              <div
                key={key}
                className="rounded-xl border border-slate-200/90 bg-white p-4 text-sm shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-brand-ink">
                  {data.counts[key]}
                  {data.capped?.[key] ? "+" : ""}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-4 text-sm shadow-sm">
        <p className="font-semibold text-brand-ink">Bookings not yet confirmed</p>
        <p className="mt-1 text-slate-600">
          From guests: {data.pending.guestBookings} · From members:{" "}
          {data.pending.userBookings}
        </p>
      </div>
    </div>
  );
}
