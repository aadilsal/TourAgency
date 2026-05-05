"use client";

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  MapPinOff,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TourTypeFilter } from "@/lib/tour-filters";
import {
  parseTourType,
  TOUR_TYPE_OPTIONS,
  tourMatchesType,
} from "@/lib/tour-filters";
import { TourCard, type TourCardData } from "@/components/shared/TourCard";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { MotionSection } from "@/components/ui/MotionSection";
import { useCurrency } from "@/hooks/useCurrency";
import { getTourUnitPrice } from "@/lib/tourPricing";

const PAGE_SIZE = 9;

type TourRow = TourCardData & { _id: string; createdAt?: number };

type SortKey =
  | "popular"
  | "price-asc"
  | "price-desc"
  | "dur-asc"
  | "dur-desc";

type Props = {
  initialTours: TourRow[];
  initialType?: string | null;
  initialMax?: string | null;
  initialMin?: string | null;
  initialLocation?: string | null;
};

const fieldClass =
  "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-havezic-accent shadow-sm focus:outline-none focus:ring-2 focus:ring-havezic-primary/25";

type FilterFormProps = {
  location: string;
  setLocation: (v: string) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  durMin: string;
  setDurMin: (v: string) => void;
  durMax: string;
  setDurMax: (v: string) => void;
  type: TourTypeFilter | "";
  setType: (v: TourTypeFilter | "") => void;
  locations: string[];
  onFilterChange: () => void;
  onReset: () => void;
  /** Extra actions below reset (e.g. mobile “Apply”) */
  footer?: ReactNode;
};

function TourFiltersForm({
  location,
  setLocation,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  durMin,
  setDurMin,
  durMax,
  setDurMax,
  type,
  setType,
  locations,
  onFilterChange,
  onReset,
  footer,
}: FilterFormProps) {
  const currency = useCurrency();
  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-havezic-primary">
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filters
      </p>

      <label className="block text-sm">
        <span className="font-medium text-havezic-text">Location</span>
        <select
          className={fieldClass}
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            onFilterChange();
          }}
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-sm font-medium text-havezic-text">
          Price range ({currency})
        </span>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs text-havezic-text-light">Min</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => {
                setPriceMin(e.target.value);
                onFilterChange();
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-havezic-text-light">Max</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => {
                setPriceMax(e.target.value);
                onFilterChange();
              }}
            />
          </label>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-havezic-text">Duration (days)</span>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs text-havezic-text-light">Min</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              placeholder="Min days"
              value={durMin}
              onChange={(e) => {
                setDurMin(e.target.value);
                onFilterChange();
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-havezic-text-light">Max</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              placeholder="Max days"
              value={durMax}
              onChange={(e) => {
                setDurMax(e.target.value);
                onFilterChange();
              }}
            />
          </label>
        </div>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-havezic-text">Type</span>
        <select
          className={fieldClass}
          value={type}
          onChange={(e) => {
            setType((e.target.value || "") as TourTypeFilter | "");
            onFilterChange();
          }}
        >
          <option value="">Any</option>
          {TOUR_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <Button
        type="button"
        variant="ghost"
        className="w-full py-2 text-sm"
        onClick={onReset}
      >
        Reset filters
      </Button>

      {footer}
    </div>
  );
}

function useActiveFilterCount(
  location: string,
  priceMin: string,
  priceMax: string,
  durMin: string,
  durMax: string,
  type: TourTypeFilter | "",
) {
  return useMemo(() => {
    let n = 0;
    if (location.trim()) n++;
    if (priceMin.replace(/\D/g, "")) n++;
    if (priceMax.replace(/\D/g, "")) n++;
    if (durMin.trim()) n++;
    if (durMax.trim()) n++;
    if (type) n++;
    return n;
  }, [location, priceMin, priceMax, durMin, durMax, type]);
}

export function ToursExploreClient({
  initialTours,
  initialType,
  initialMax,
  initialMin,
  initialLocation,
}: Props) {
  const currency = useCurrency();
  const [location, setLocation] = useState(initialLocation ?? "");
  const [priceMin, setPriceMin] = useState(initialMin ?? "");
  const [priceMax, setPriceMax] = useState(initialMax ?? "");
  const [durMin, setDurMin] = useState("");
  const [durMax, setDurMax] = useState("");
  const [type, setType] = useState<TourTypeFilter | "">(
    parseTourType(initialType ?? undefined) ?? "",
  );
  const [sort, setSort] = useState<SortKey>("popular");
  const [page, setPage] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const convexTours = useQuery(api.tours.getTours, {});

  const catalog = useMemo((): TourRow[] => {
    if (convexTours !== undefined) {
      return convexTours.filter((t) => t.isActive) as TourRow[];
    }
    return initialTours;
  }, [convexTours, initialTours]);

  const activeFilterCount = useActiveFilterCount(
    location,
    priceMin,
    priceMax,
    durMin,
    durMax,
    type,
  );

  const hasDefaultFilters = activeFilterCount === 0;

  const locations = useMemo(() => {
    const s = new Set<string>();
    catalog.forEach((t) => {
      if (t.location) s.add(t.location);
    });
    return Array.from(s).sort();
  }, [catalog]);

  const bumpPage = useCallback(() => setPage(1), []);

  const resetFilters = useCallback(() => {
    setLocation("");
    setPriceMin("");
    setPriceMax("");
    setDurMin("");
    setDurMax("");
    setType("");
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let list = [...catalog];
    const unitPrice = (t: TourRow) => getTourUnitPrice(t, currency);
    if (location) {
      list = list.filter((t) =>
        t.location.toLowerCase().includes(location.toLowerCase()),
      );
    }
    const minP = priceMin.replace(/\D/g, "")
      ? Number(priceMin.replace(/\D/g, ""))
      : null;
    const maxP = priceMax.replace(/\D/g, "")
      ? Number(priceMax.replace(/\D/g, ""))
      : null;
    if (minP !== null && !Number.isNaN(minP)) {
      list = list.filter((t) => unitPrice(t) >= minP);
    }
    if (maxP !== null && !Number.isNaN(maxP)) {
      list = list.filter((t) => unitPrice(t) <= maxP);
    }
    const minD = durMin.trim() ? Number(durMin) : null;
    const maxD = durMax.trim() ? Number(durMax) : null;
    if (minD !== null && !Number.isNaN(minD)) {
      list = list.filter((t) => t.durationDays >= minD);
    }
    if (maxD !== null && !Number.isNaN(maxD)) {
      list = list.filter((t) => t.durationDays <= maxD);
    }
    if (type) {
      list = list.filter((t) => tourMatchesType(t, type));
    }
    list.sort((a, b) => {
      if (sort === "popular") {
        const ta = a.createdAt ?? 0;
        const tb = b.createdAt ?? 0;
        if (tb !== ta) return tb - ta;
        return a.title.localeCompare(b.title);
      }
      if (sort === "price-asc") return unitPrice(a) - unitPrice(b);
      if (sort === "price-desc") return unitPrice(b) - unitPrice(a);
      if (sort === "dur-asc") return a.durationDays - b.durationDays;
      return b.durationDays - a.durationDays;
    });
    return list;
  }, [
    catalog,
    currency,
    location,
    priceMin,
    priceMax,
    durMin,
    durMax,
    type,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (!filterDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filterDrawerOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterDrawerOpen(false);
    };
    if (filterDrawerOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterDrawerOpen]);

  const filterFormProps: FilterFormProps = {
    location,
    setLocation,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    durMin,
    setDurMin,
    durMax,
    setDurMax,
    type,
    setType,
    locations,
    onFilterChange: bumpPage,
    onReset: () => {
      resetFilters();
    },
  };

  const pageSlots = useMemo((): Array<number | "gap"> => {
    if (totalPages <= 1) return [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const slots: Array<number | "gap"> = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) slots.push("gap");
    for (let p = start; p <= end; p++) slots.push(p);
    if (end < totalPages - 1) slots.push("gap");
    slots.push(totalPages);
    return slots;
  }, [totalPages, currentPage]);

  const heroImage = useMemo(() => {
    const withImage = catalog.find((t) => Boolean(t.images?.[0]));
    return withImage?.images?.[0] ?? "";
  }, [catalog]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt=""
              className="h-full w-full object-cover opacity-70"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(900px_circle_at_20%_10%,rgba(255,255,255,0.18),transparent_55%),linear-gradient(to_bottom_right,rgba(5,150,105,0.35),rgba(249,115,22,0.25),rgba(2,132,199,0.25))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/60 to-slate-950" />
        </div>

        <PageContainer className="relative pb-10 pt-14 md:pb-14 md:pt-20 lg:pb-16">
          <MotionSection>
            <header className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-white/85">
                Northern Pakistan
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Explore Tours
              </h1>
              <p className="mt-3 text-base leading-relaxed text-white/80 md:text-lg">
                A curated set of experiences across Hunza, Skardu, Swat &amp;
                beyond. Filter by location, days, budget, and travel style — then
                sort to match how you like to plan.
              </p>
            </header>
          </MotionSection>
        </PageContainer>
      </section>

      {/* Content */}
      <PageContainer className="pb-20 pt-8 md:pt-10 lg:pt-12">
        {/* Mobile: filters trigger + sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:hidden">
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center gap-2 py-3 sm:w-auto"
            onClick={() => setFilterDrawerOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-havezic-primary px-2 py-0.5 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <label className="flex w-full items-center gap-2 text-sm sm:w-auto sm:min-w-[200px]">
            <span className="shrink-0 text-havezic-text">Sort</span>
            <select
              className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-havezic-accent shadow-sm focus:outline-none focus:ring-2 focus:ring-havezic-primary/25"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="popular">Popularity (newest)</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="dur-asc">Duration: shortest</option>
              <option value="dur-desc">Duration: longest</option>
            </select>
          </label>
        </div>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[300px_1fr] lg:gap-10 xl:gap-12">
          {/* Desktop sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-6.5rem)] space-y-6 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white p-6 shadow-sm pb-8">
              <TourFiltersForm {...filterFormProps} />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="hidden items-center justify-between gap-4 lg:flex">
              <p className="text-sm text-havezic-text">
                {convexTours === undefined && initialTours.length === 0 ? (
                  <>Loading tours…</>
                ) : (
                  <>
                    <span className="font-semibold text-havezic-accent">
                      {filtered.length}
                    </span>{" "}
                    tour{filtered.length !== 1 ? "s" : ""} match
                    {activeFilterCount > 0 ? (
                      <span className="text-slate-400">
                        {" "}
                        · {activeFilterCount} filter
                        {activeFilterCount !== 1 ? "s" : ""} active
                      </span>
                    ) : null}
                  </>
                )}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-havezic-text">Sort by</span>
                <select
                  className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-havezic-accent shadow-sm focus:ring-2 focus:ring-havezic-primary/25"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="popular">Popularity (newest)</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="dur-asc">Duration: shortest</option>
                  <option value="dur-desc">Duration: longest</option>
                </select>
              </label>
            </div>

            {/* Mobile count line */}
            <p className="mt-2 text-sm text-havezic-text lg:hidden">
              {convexTours === undefined && initialTours.length === 0 ? (
                <>Loading tours…</>
              ) : (
                <>
                  <span className="font-semibold text-havezic-accent">
                    {filtered.length}
                  </span>{" "}
                  tour{filtered.length !== 1 ? "s" : ""} match
                </>
              )}
            </p>

            {slice.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-dashed border-border bg-havezic-background-light p-10 text-center">
                <MapPinOff
                  className="mx-auto h-12 w-12 text-slate-400"
                  aria-hidden
                />
                <p className="mt-4 text-havezic-text">
                  {convexTours === undefined ? (
                    <>Loading tours…</>
                  ) : !hasDefaultFilters ? (
                    <>
                      No tours match these filters.{" "}
                      <button
                        type="button"
                        className="font-semibold text-havezic-primary underline"
                        onClick={() => {
                          resetFilters();
                          setFilterDrawerOpen(false);
                        }}
                      >
                        Clear filters
                      </button>
                      {" · "}
                      <Link
                        href="/tours"
                        className="font-semibold text-havezic-primary underline"
                      >
                        View all tours
                      </Link>
                    </>
                  ) : catalog.length === 0 ? (
                    <>
                      No active tours in the catalog yet. Check back soon or
                      contact us for a custom trip.
                    </>
                  ) : (
                    <>Couldn&apos;t display results. Try refreshing the page.</>
                  )}
                </p>
              </div>
            ) : (
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3">
                {slice.map((t) => (
                  <li key={t._id} className="h-full">
                    <TourCard tour={t} />
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 ? (
              <nav
                className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center"
                aria-label="Pagination"
              >
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={currentPage <= 1}
                    className="gap-1 px-3 py-2"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="hidden items-center gap-1 sm:flex">
                    {pageSlots.map((p, idx) =>
                      p === "gap" ? (
                        <span key={`gap-${idx}`} className="px-1 text-slate-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={
                            p === currentPage
                              ? "min-w-[2.25rem] rounded-lg bg-havezic-primary px-2 py-1.5 text-sm font-bold text-white"
                              : "min-w-[2.25rem] rounded-lg px-2 py-1.5 text-sm font-medium text-havezic-text hover:bg-havezic-background-light"
                          }
                          aria-current={p === currentPage ? "page" : undefined}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={currentPage >= totalPages}
                    className="gap-1 px-3 py-2"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
              </nav>
            ) : null}
          </div>
        </div>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {filterDrawerOpen ? (
            <div
              className="fixed inset-0 z-[65] lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Tour filters"
            >
              <motion.button
                type="button"
                aria-label="Close filters"
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFilterDrawerOpen(false)}
              />
              <motion.aside
                className="absolute left-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="font-display text-lg font-semibold text-havezic-accent">
                    Filters
                  </h2>
                  <button
                    type="button"
                    className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                    onClick={() => setFilterDrawerOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <TourFiltersForm
                    {...filterFormProps}
                    footer={
                      <Button
                        type="button"
                        variant="primary"
                        className="mt-4 w-full py-3"
                        onClick={() => setFilterDrawerOpen(false)}
                      >
                        Show {filtered.length} result
                        {filtered.length !== 1 ? "s" : ""}
                      </Button>
                    }
                  />
                </div>
              </motion.aside>
            </div>
          ) : null}
        </AnimatePresence>
      </PageContainer>
    </>
  );
}
