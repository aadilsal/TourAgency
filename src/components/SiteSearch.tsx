"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/cn";

type TourLite = {
  _id: string;
  slug: string;
  title: string;
  location: string;
  durationDays: number;
  isActive: boolean;
  images: string[];
};

/**
 * Header search.
 * - variant "icon" (desktop): a search icon that reveals a dropdown panel with
 *   a field + live tour results on click or hover.
 * - variant "inline" (mobile menu): an always-visible field with live results.
 */
export function SiteSearch({
  variant = "icon",
  className,
}: {
  variant?: "icon" | "inline";
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(variant === "inline");
  const [value, setValue] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only fetch the catalog once the panel is open (lazy).
  const tours = useQuery(
    api.tours.getTours,
    open ? {} : "skip",
  ) as TourLite[] | undefined;

  useEffect(() => {
    if (open && variant === "icon") inputRef.current?.focus();
  }, [open, variant]);

  useEffect(() => {
    if (variant !== "icon" || !open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, variant]);

  const q = value.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [] as TourLite[];
    return (tours ?? [])
      .filter((t) => t.isActive)
      .filter((t) => `${t.title} ${t.location}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [tours, q]);

  function go(href: string) {
    if (variant === "icon") setOpen(false);
    setValue("");
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    go(q ? `/tours?q=${encodeURIComponent(value.trim())}` : "/tours");
  }

  const panel = (
    <div
      className={cn(
        variant === "icon"
          ? "absolute right-0 top-full z-50 mt-2 w-[min(22rem,90vw)] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
          : "rounded-2xl border border-white/15 bg-white/5 p-2",
      )}
    >
      <form onSubmit={submit} role="search">
        <div className="relative flex items-center">
          <Search
            className={cn(
              "pointer-events-none absolute left-3 h-4 w-4",
              variant === "icon" ? "text-slate-400" : "text-white/60",
            )}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search tours…"
            aria-label="Search tours"
            className={cn(
              "w-full rounded-full py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2",
              variant === "icon"
                ? "border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-havezic-primary/25"
                : "border border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:ring-white/20",
            )}
          />
        </div>
      </form>

      {q ? (
        <div className="mt-2">
          {results.length > 0 ? (
            <ul className="max-h-72 overflow-auto">
              {results.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    onClick={() => go(`/tours/${t.slug}`)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-2 text-left transition",
                      variant === "icon"
                        ? "hover:bg-slate-100"
                        : "hover:bg-white/10",
                    )}
                  >
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                      {t.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.images[0]}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-sm font-semibold",
                          variant === "icon" ? "text-slate-900" : "text-white",
                        )}
                      >
                        {t.title}
                      </span>
                      <span
                        className={cn(
                          "block truncate text-xs",
                          variant === "icon" ? "text-slate-500" : "text-white/60",
                        )}
                      >
                        {t.durationDays} days · {t.location}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className={cn(
                "px-2 py-3 text-sm",
                variant === "icon" ? "text-slate-500" : "text-white/60",
              )}
            >
              {tours === undefined ? "Searching…" : "No matching tours."}
            </p>
          )}
          <button
            type="button"
            onClick={() => go(`/tours?q=${encodeURIComponent(value.trim())}`)}
            className={cn(
              "mt-1 w-full rounded-xl px-2 py-2 text-left text-sm font-semibold",
              variant === "icon"
                ? "text-havezic-primary hover:bg-slate-100"
                : "text-brand-sun hover:bg-white/10",
            )}
          >
            See all results for “{value.trim()}” →
          </button>
        </div>
      ) : null}
    </div>
  );

  if (variant === "inline") {
    return <div className={className}>{panel}</div>;
  }

  return (
    <div
      ref={wrapRef}
      className={cn("relative", className)}
      onMouseEnter={() => setOpen(true)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close search" : "Search"}
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Search className="h-5 w-5" aria-hidden />
        )}
      </button>
      {open ? panel : null}
    </div>
  );
}
