"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { CustomerSearchKind } from "@convex/admin";
import { cn } from "@/lib/cn";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";

const KIND_LABEL: Record<CustomerSearchKind, string> = {
  booking: "Booking",
  lead: "Lead",
  trip: "Trip request",
  visa: "Visa",
  itinerary: "Itinerary",
  invoice: "Invoice",
};

const KIND_TONE: Record<CustomerSearchKind, string> = {
  booking: "bg-amber-100 text-amber-900 ring-amber-200",
  lead: "bg-sky-100 text-sky-900 ring-sky-200",
  trip: "bg-violet-100 text-violet-900 ring-violet-200",
  visa: "bg-teal-100 text-teal-900 ring-teal-200",
  itinerary: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  invoice: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function KindChip({ kind, className }: { kind: CustomerSearchKind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ring-1",
        KIND_TONE[kind],
        className,
      )}
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

/**
 * "Find a customer" box: type a name, phone or email and see matching
 * bookings, leads, trip requests, visa requests, itineraries and invoices.
 * `variant="inline"` renders results under the box (mobile drawer);
 * `variant="dropdown"` floats them (desktop top bar).
 */
export function CustomerSearch({
  variant = "dropdown",
  className,
  onNavigate,
}: {
  variant?: "dropdown" | "inline";
  className?: string;
  /** Called when a result is opened (e.g. to close the drawer). */
  onNavigate?: () => void;
}) {
  const sessionToken = useConvexSessionToken();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(term.trim(), 300);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const ready = typeof sessionToken === "string" && debounced.length >= 2;
  const { data, error, isLoading } = useSafeQuery(
    api.admin.searchCustomers,
    ready ? { sessionToken, term: debounced } : "skip",
  );
  const typing = term.trim() !== debounced;

  // Close the floating list on outside click.
  useEffect(() => {
    if (variant !== "dropdown" || !open) return;
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, variant]);

  const showPanel = (variant === "inline" || open) && term.trim().length > 0;

  let body: React.ReactNode;
  if (term.trim().length < 2) {
    body = <p className="p-3 text-sm text-muted">Type at least 2 letters or 4 digits of a phone number.</p>;
  } else if (error) {
    body = <p className="p-3 text-sm text-red-700">Search isn’t working right now. Please refresh the page.</p>;
  } else if (typing || isLoading || data === undefined) {
    body = (
      <p className="flex items-center gap-2 p-3 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Searching…
      </p>
    );
  } else if (data.length === 0) {
    body = (
      <p className="p-3 text-sm text-muted">
        No customer found for “{debounced}”. Try part of the name, the phone number or the email.
      </p>
    );
  } else {
    body = (
      <ul id={listId} className="max-h-[60vh] divide-y divide-border overflow-y-auto overscroll-contain">
        {data.map((r) => (
          <li key={r.key}>
            <Link
              href={r.href}
              className="flex min-h-11 items-start gap-2 px-3 py-2.5 hover:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-none"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <KindChip kind={r.kind} className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{r.name}</span>
                <span className="block truncate text-xs text-muted">
                  {[r.phone, r.email].filter(Boolean).join(" · ") || r.detail}
                </span>
                {r.phone || r.email ? (
                  <span className="block truncate text-xs text-muted">{r.detail}</span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <label className="relative block">
        <span className="sr-only">Find a customer</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          value={term}
          placeholder="Find customer: name, phone or email"
          aria-controls={showPanel ? listId : undefined}
          className="h-11 w-full rounded-xl border border-border bg-white pl-9 pr-10 text-sm text-foreground shadow-sm placeholder:text-slate-400 focus:border-brand-sun focus:outline-none focus:ring-2 focus:ring-brand-sun/30"
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {term ? (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-muted hover:text-foreground"
            onClick={() => setTerm("")}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </label>
      {showPanel ? (
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-panel shadow-lg",
            variant === "dropdown"
              ? "absolute left-0 right-0 top-full z-[120] mt-2 min-w-[320px] bg-white"
              : "mt-2 bg-white",
          )}
        >
          {body}
        </div>
      ) : null}
    </div>
  );
}
