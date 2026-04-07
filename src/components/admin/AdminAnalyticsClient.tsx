"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { BarChart3, CalendarCheck, Coins, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";

type Snapshot = {
  headline?: {
    totalBookings: number;
    leads: number;
    revenuePkr: number;
  };
  counts: Record<string, number>;
  pending: { guestBookings: number; userBookings: number };
};

export function AdminAnalyticsClient() {
  const snap = useQuery(api.analytics.getAnalyticsSnapshot, {});
  const wa = useQuery(api.whatsapp.getWhatsAppClickLink, {
    presetMessage: "Hi JunketTours — I saw a tour on your site.",
  });

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
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Guest + registered member bookings
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
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Inquiries captured (AI, booking, manual)
              </p>
            </div>
            <span className="rounded-xl bg-sky-500/10 p-2.5 text-sky-700">
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
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Confirmed member totals + confirmed guest (tour × travelers)
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
          More counts
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.counts).map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl border border-slate-200/90 bg-white p-4 text-sm shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-brand-ink">
                {typeof v === "number" ? v : String(v)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-4 text-sm shadow-sm">
        <p className="font-semibold text-brand-ink">Pending bookings</p>
        <p className="mt-1 text-slate-600">
          Guest: {data.pending.guestBookings} · Member:{" "}
          {data.pending.userBookings}
        </p>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
        <p className="font-semibold text-brand-ink">WhatsApp</p>
        <p className="mt-1 text-xs text-slate-500">Business line +92 320 9973486</p>
        {wa === undefined ? (
          <p className="mt-2 text-slate-500">Loading link…</p>
        ) : wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:brightness-110"
            aria-label="Open WhatsApp chat"
          >
            <WhatsAppBrandIcon className="h-6 w-6" />
          </a>
        ) : (
          <p className="mt-2 text-slate-500">
            WhatsApp link unavailable — check Convex deployment.
          </p>
        )}
      </div>
    </div>
  );
}
