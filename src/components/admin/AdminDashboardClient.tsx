"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { AttentionKind } from "@convex/dashboard";
import {
  CalendarCheck,
  CircleDollarSign,
  ListChecks,
  MessageSquare,
  Shield,
  Sparkles,
  Stamp,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { QueryErrorBanner } from "@/components/admin/shared/EditorStatus";
import { ContactActions } from "@/components/admin/shared/ContactActions";
import { formatBadgeCount, useNow } from "@/components/admin/shared/inboxHooks";
import { timeAgo } from "@/components/admin/shared/statusLabels";

type Props = {
  role: "admin" | "super_admin";
};

const KIND_META: Record<AttentionKind, { label: string; tone: string; icon: LucideIcon }> = {
  booking: { label: "Booking", tone: "bg-amber-100 text-amber-900 ring-amber-200", icon: CalendarCheck },
  lead: { label: "Lead", tone: "bg-sky-100 text-sky-900 ring-sky-200", icon: MessageSquare },
  trip: { label: "Trip request", tone: "bg-violet-100 text-violet-900 ring-violet-200", icon: Sparkles },
  visa: { label: "Visa", tone: "bg-teal-100 text-teal-900 ring-teal-200", icon: Stamp },
  review: { label: "Review", tone: "bg-rose-100 text-rose-900 ring-rose-200", icon: Star },
};

const SHOW_FIRST = 10;

function kpiIconWrapClass(color: "sun" | "emerald" | "sky") {
  if (color === "emerald") return "bg-emerald-500/10 text-emerald-700";
  if (color === "sky") return "bg-sky-500/10 text-sky-700";
  return "bg-brand-sun/15 text-brand-sun";
}

export function AdminDashboardClient({ role }: Props) {
  const sessionToken = useConvexSessionToken();
  const hasToken = typeof sessionToken === "string";
  const now = useNow();
  const [showAll, setShowAll] = useState(false);

  const attention = useSafeQuery(
    api.dashboard.getAttentionInbox,
    hasToken ? { sessionToken, limit: 40 } : "skip",
  );
  const snapQ = useSafeQuery(
    api.dashboard.getAdminDashboardSnapshot,
    hasToken
      ? { sessionToken, windowDays: 30, includeAdmins: role === "super_admin" }
      : "skip",
  );
  const snap = snapQ.data;
  const counts = attention.data?.counts;
  const items = attention.data?.items ?? [];
  const shown = showAll ? items : items.slice(0, SHOW_FIRST);

  const tiles: { href: string; label: string; count: number; icon: LucideIcon }[] = counts
    ? [
        { href: "/admin/bookings", label: "New bookings", count: counts.bookings, icon: CalendarCheck },
        { href: "/admin/contact", label: "New leads", count: counts.leads, icon: MessageSquare },
        { href: "/admin/custom-itineraries", label: "Trip requests", count: counts.trips, icon: Sparkles },
        { href: "/admin/visa-invitations", label: "Visa requests", count: counts.visa, icon: Stamp },
        { href: "/admin/reviews", label: "Reviews to approve", count: counts.reviews, icon: Star },
      ]
    : [];

  return (
    <div className="space-y-8">
      <QueryErrorBanner error={attention.error ?? snapQ.error} />

      {/* ── Needs your attention ─────────────────────────────────────── */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Needs your attention</h2>
            <p className="mt-1 text-sm text-muted">
              Everything new from customers, newest first. Tap WhatsApp or Call to reply.
            </p>
          </div>
          {counts && counts.total > 0 ? (
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-red-600 px-2 text-sm font-bold text-white tabular-nums">
              {counts.total}
            </span>
          ) : null}
        </div>

        {tiles.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors hover:bg-black/5",
                    t.count > 0
                      ? "border-red-200 bg-red-50 text-red-900"
                      : "border-border bg-panel-elevated text-muted",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{t.label}</span>
                  <span className="tabular-nums">{formatBadgeCount(t.count, counts?.cap ?? 100)}</span>
                </Link>
              );
            })}
          </div>
        ) : null}

        {attention.isLoading || (!attention.data && !attention.error) ? (
          <p className="mt-4 text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
            You&apos;re all caught up — nothing new is waiting for a reply.
          </p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-border">
              {shown.map((it) => {
                const meta = KIND_META[it.kind];
                return (
                  <li key={it.key} className="py-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          "inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ring-1",
                          meta.tone,
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="min-w-0 truncate font-semibold text-foreground">{it.name}</span>
                      <span className="text-xs text-muted">· {timeAgo(it.createdAt, now)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 break-words text-sm text-muted">{it.summary}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {it.kind !== "review" ? (
                        <ContactActions
                          name={it.name}
                          phone={it.phone}
                          email={it.email}
                          about={it.about}
                        />
                      ) : null}
                      <ButtonLink
                        href={it.href}
                        variant={it.kind === "review" ? "primary" : "secondary"}
                        className="!px-4 !py-2 !text-sm"
                      >
                        {it.kind === "review" ? "Approve or reject" : "Open"}
                      </ButtonLink>
                    </div>
                  </li>
                );
              })}
            </ul>
            {items.length > SHOW_FIRST ? (
              <button
                type="button"
                className="mt-2 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand-cta hover:bg-black/5"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Show fewer" : `Show all ${items.length}`}
              </button>
            ) : null}
          </>
        )}
      </Card>

      {/* ── Last 30 days ─────────────────────────────────────────────── */}
      {snap ? (
        <div>
          <p className="mb-3 text-sm font-semibold text-muted">Last 30 days</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Bookings</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                    {snap.kpis.bookings}
                  </p>
                  <p className="mt-1 text-xs text-muted">Booking requests received</p>
                </div>
                <span className={cn("rounded-xl p-2.5", kpiIconWrapClass("sun"))}>
                  <CalendarCheck className="h-6 w-6" aria-hidden />
                </span>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Leads</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                    {snap.kpis.leads}
                  </p>
                  <p className="mt-1 text-xs text-muted">Messages and enquiries</p>
                </div>
                <span className={cn("rounded-xl p-2.5", kpiIconWrapClass("sky"))}>
                  <MessageSquare className="h-6 w-6" aria-hidden />
                </span>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Revenue</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                    PKR {snap.kpis.revenuePkr.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted">From confirmed bookings (estimate)</p>
                </div>
                <span className={cn("rounded-xl p-2.5", kpiIconWrapClass("emerald"))}>
                  <CircleDollarSign className="h-6 w-6" aria-hidden />
                </span>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <p className="text-sm font-bold text-foreground">Website content</p>
          <p className="mt-1 text-xs text-muted">What visitors can see on the site</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-panel-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tours</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {snap?.health.tours.active ?? 0}{" "}
                <span className="text-sm font-semibold text-muted">live</span>
              </p>
              <p className="mt-1 text-xs text-muted">{snap?.health.tours.inactive ?? 0} hidden</p>
              <Link
                href="/admin/tours"
                className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-cta hover:underline"
              >
                Manage tours
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-panel-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Blog</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {snap?.health.blog.published ?? 0}{" "}
                <span className="text-sm font-semibold text-muted">live</span>
              </p>
              <p className="mt-1 text-xs text-muted">{snap?.health.blog.drafts ?? 0} drafts</p>
              <Link
                href="/admin/blog"
                className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-cta hover:underline"
              >
                Manage blog
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-foreground">Quick actions</p>
          <div className="mt-4 grid gap-2">
            {[
              { href: "/admin/itineraries/new", label: "Make a new quote", icon: ListChecks },
              { href: "/admin/tours", label: "Add / edit tours", icon: CalendarCheck },
              { href: "/admin/blog", label: "Publish content", icon: Users },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-panel-elevated px-3 py-2 text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Icon className="h-4 w-4 text-muted" aria-hidden />
                  {a.label}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {role === "super_admin" && snap ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="rounded-xl bg-brand-sun/15 p-2.5 text-brand-sun">
                <Shield className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Admin management</p>
                <p className="mt-1 text-xs text-muted">Manage admin accounts and roles</p>
              </div>
            </div>
            <Link
              href="/admin/manage-admins"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-cta hover:underline"
            >
              Open
            </Link>
          </div>

          {snap.admins.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No admin accounts found.</p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {snap.admins.map((a) => (
                <li key={a.id} className="rounded-xl border border-border bg-panel-elevated p-3">
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
