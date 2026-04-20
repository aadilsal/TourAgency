"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  CalendarCheck,
  CircleDollarSign,
  ListChecks,
  MessageSquare,
  Shield,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  role: "admin" | "super_admin";
};

function kpiIconWrapClass(color: "sun" | "emerald" | "violet" | "sky") {
  if (color === "emerald") return "bg-emerald-500/10 text-emerald-700";
  if (color === "violet") return "bg-violet-500/10 text-violet-700";
  if (color === "sky") return "bg-sky-500/10 text-sky-700";
  return "bg-brand-sun/15 text-brand-sun";
}

function formatWhen(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(ts);
  }
}

function statusBadgeClass(status: string) {
  if (status === "confirmed")
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "pending") return "bg-amber-100 text-amber-900 ring-amber-200";
  if (status === "cancelled") return "bg-rose-100 text-rose-800 ring-rose-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function AdminDashboardClient({ role }: Props) {
  const snap = useQuery(api.dashboard.getAdminDashboardSnapshot, {
    windowDays: 30,
    includeAdmins: role === "super_admin",
  });
  const updateStatus = useMutation(api.bookings.updateBookingStatus);

  const kpis = snap?.kpis;
  const recent = snap?.recent;
  const health = snap?.health;

  const pendingBookings = recent?.pendingBookings ?? [];
  const leads = recent?.leads ?? [];
  const pendingPlans = recent?.pendingCustomPlans ?? [];

  const pendingBookingsLabel = useMemo(() => {
    if (!snap) return "";
    return `${snap.windowLabel} · ${kpis?.bookings ?? 0} bookings`;
  }, [snap, kpis?.bookings]);

  if (snap === undefined) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{snap.windowLabel}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/bookings">
            <Button type="button" variant="secondary" className="!px-3 !py-2 !text-xs">
              View bookings
            </Button>
          </Link>
          <Link href="/admin/contact">
            <Button type="button" variant="secondary" className="!px-3 !py-2 !text-xs">
              View leads
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button type="button" variant="primary" className="!px-3 !py-2 !text-xs">
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Bookings
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                {kpis?.bookings ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">Created in last 30 days</p>
            </div>
            <span className={cn("rounded-xl p-2.5", kpiIconWrapClass("sun"))}>
              <CalendarCheck className="h-6 w-6" aria-hidden />
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Leads
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                {kpis?.leads ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">Captured in last 30 days</p>
            </div>
            <span className={cn("rounded-xl p-2.5", kpiIconWrapClass("sky"))}>
              <MessageSquare className="h-6 w-6" aria-hidden />
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Revenue
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                PKR {(kpis?.revenuePkr ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted">Confirmed in last 30 days</p>
            </div>
            <span className={cn("rounded-xl p-2.5", kpiIconWrapClass("emerald"))}>
              <CircleDollarSign className="h-6 w-6" aria-hidden />
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Pending
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                {kpis?.pendingBookings ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">Bookings awaiting review</p>
            </div>
            <span className={cn("rounded-xl p-2.5", kpiIconWrapClass("violet"))}>
              <ListChecks className="h-6 w-6" aria-hidden />
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">Pending bookings</p>
              <p className="mt-1 text-xs text-muted">{pendingBookingsLabel}</p>
            </div>
            <Link href="/admin/bookings" className="text-xs font-semibold text-brand-cta hover:underline">
              View all
            </Link>
          </div>

          {pendingBookings.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No pending bookings right now.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {pendingBookings.map((b) => (
                <li key={`${b.kind}-${b.id}`} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {b.name}
                      <span className="text-muted"> · </span>
                      <span className="font-medium text-muted">{b.tourTitle}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {b.peopleCount} {b.peopleCount === 1 ? "person" : "people"} ·{" "}
                      PKR {b.totalPrice.toLocaleString()} · {formatWhen(b.createdAt)}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1",
                      b.kind === "guest"
                        ? "bg-violet-50 text-violet-900 ring-violet-200"
                        : "bg-brand-sun/15 text-brand-sun ring-brand-sun/25",
                    )}
                  >
                    {b.kind === "guest" ? "Guest" : "Member"}
                  </span>

                  <select
                    className={cn(
                      "cursor-pointer appearance-none rounded-full border-0 bg-[length:0.75rem] bg-[right_0.65rem_center] bg-no-repeat py-2 pl-3 pr-7 text-xs font-bold capitalize shadow-sm ring-2 ring-inset focus:outline-none focus:ring-2 focus:ring-brand-primary/35",
                      statusBadgeClass(b.status),
                    )}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23334155'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    }}
                    value={b.status}
                    aria-label={`Set status for ${b.name}`}
                    onChange={(e) => {
                      void updateStatus({
                        kind: b.kind,
                        id: b.id,
                        status: e.target.value as "pending" | "confirmed" | "cancelled",
                      });
                    }}
                  >
                    {["pending", "confirmed", "cancelled"].map((s) => (
                      <option key={s} value={s} className="bg-white text-slate-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">New leads</p>
                <p className="mt-1 text-xs text-muted">Latest messages and inquiries</p>
              </div>
              <Link href="/admin/contact" className="text-xs font-semibold text-brand-cta hover:underline">
                View all
              </Link>
            </div>
            {leads.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No leads yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {leads.map((l) => (
                  <li key={l.id} className="rounded-xl border border-border bg-panel-elevated p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {l.name}
                      <span className="text-muted"> · </span>
                      <span className="text-xs font-bold uppercase tracking-wide text-muted">
                        {l.source}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {l.message?.trim() || l.phone}
                    </p>
                    <p className="mt-2 text-[11px] text-muted">{formatWhen(l.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">Custom plans</p>
                <p className="mt-1 text-xs text-muted">
                  Pending: {kpis?.pendingCustomPlans ?? 0}
                </p>
              </div>
              <Link
                href="/admin/custom-itineraries"
                className="text-xs font-semibold text-brand-cta hover:underline"
              >
                Review
              </Link>
            </div>
            {pendingPlans.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No pending requests.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {pendingPlans.map((p) => (
                  <li key={p.id} className="rounded-xl border border-border bg-panel-elevated p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {p.name}
                      <span className="text-muted"> · </span>
                      <span className="text-xs text-muted">{p.phone}</span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{p.summary}</p>
                    <p className="mt-2 text-[11px] text-muted">{formatWhen(p.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <p className="text-sm font-bold text-foreground">Health</p>
          <p className="mt-1 text-xs text-muted">Content and inventory status</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-panel-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Tours
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {health?.tours.active ?? 0}{" "}
                <span className="text-sm font-semibold text-muted">active</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {health?.tours.inactive ?? 0} inactive
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin/tours" className="text-xs font-semibold text-brand-cta hover:underline">
                  Manage tours
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-panel-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Blog
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {health?.blog.published ?? 0}{" "}
                <span className="text-sm font-semibold text-muted">live</span>
              </p>
              <p className="mt-1 text-xs text-muted">{health?.blog.drafts ?? 0} drafts</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin/blog" className="text-xs font-semibold text-brand-cta hover:underline">
                  Manage blog
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-foreground">Quick actions</p>
          <p className="mt-1 text-xs text-muted">Common admin tasks</p>
          <div className="mt-4 grid gap-2">
            <Link href="/admin/tours" className="rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10">
              <span className="inline-flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted" aria-hidden />
                Add / edit tours
              </span>
            </Link>
            <Link href="/admin/bookings" className="rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10">
              <span className="inline-flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-muted" aria-hidden />
                Review bookings
              </span>
            </Link>
            <Link href="/admin/contact" className="rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10">
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted" aria-hidden />
                Reply to leads
              </span>
            </Link>
            <Link href="/admin/blog" className="rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-muted" aria-hidden />
                Publish content
              </span>
            </Link>
          </div>
        </Card>
      </div>

      {role === "super_admin" ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="rounded-xl bg-brand-sun/15 p-2.5 text-brand-sun">
                <Shield className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Admin management</p>
                <p className="mt-1 text-xs text-muted">
                  Manage admin accounts and roles
                </p>
              </div>
            </div>
            <Link
              href="/admin/manage-admins"
              className="text-xs font-semibold text-brand-cta hover:underline"
            >
              Open
            </Link>
          </div>

          {snap.admins.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No admin accounts found.</p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {snap.admins.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-border bg-panel-elevated p-3"
                >
                  <p className="text-sm font-semibold text-foreground">{a.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted" title={a.email}>
                    {a.email}
                  </p>
                  <p className="mt-2 inline-flex rounded-full bg-brand-forest/12 px-2 py-0.5 text-[11px] font-bold capitalize text-brand-forest ring-1 ring-brand-forest/25">
                    {a.role.replace("_", " ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}

